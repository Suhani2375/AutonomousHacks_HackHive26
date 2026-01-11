import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db, storage } from '../shared/firebase-config';
import './ReportGarbage.css';

function ReportGarbage() {
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Start camera
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setPhoto(blob);
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const uploadReport = async () => {
    if (!photo || !location) {
      alert('Please capture a photo and allow location access');
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Upload image to Firebase Storage
      const timestamp = Date.now();
      const imageRef = ref(storage, `reports/${user.uid}/${timestamp}_before.jpg`);
      await uploadBytes(imageRef, photo);
      const imageUrl = await getDownloadURL(imageRef);

      // Get precise address from coordinates (reverse geocoding)
      let address = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;
      const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // Try Google Maps first (most accurate)
      if (mapsApiKey) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${mapsApiKey}&result_type=street_address|route|premise|point_of_interest`
          );
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            // Use the most specific result
            address = data.results[0].formatted_address;
            console.log('✅ Google Maps geocoding successful:', address);
          } else if (data.error_message) {
            console.error('Google Maps API error:', data.error_message);
          }
        } catch (error) {
          console.error('Error getting address from Google Maps:', error);
        }
      }
      
      // Fallback to OpenStreetMap (free, accurate)
      if (address.includes('Lat:') || address.includes('Lng:')) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'NeuroClean-Waste-Management/1.0'
              }
            }
          );
          const data = await response.json();
          if (data.display_name) {
            // Format OpenStreetMap address nicely
            const parts = [];
            if (data.address) {
              if (data.address.road) parts.push(data.address.road);
              if (data.address.house_number) parts.push(data.address.house_number);
              if (data.address.suburb || data.address.neighbourhood) {
                parts.push(data.address.suburb || data.address.neighbourhood);
              }
              if (data.address.city || data.address.town || data.address.village) {
                parts.push(data.address.city || data.address.town || data.address.village);
              }
            }
            address = parts.length > 0 ? parts.join(', ') : data.display_name;
            console.log('✅ OpenStreetMap geocoding successful:', address);
          }
        } catch (error) {
          console.error('Error with OpenStreetMap geocoding:', error);
          // Final fallback - formatted coordinates
          address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        }
      }

      // Get current timestamp for location validation
      const photoTimestamp = Date.now();
      const locationTimestamp = new Date().toISOString();
      
      // Create report in Firestore with timestamp validation
      const reportData = {
        citizenId: user.uid,
        imageBefore: imageUrl,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: address,
          timestamp: locationTimestamp, // For location validation
          photoTimestamp: photoTimestamp // For matching photo with location
        },
        status: 'pending',
        priority: 3, // Default priority, will be updated by AI
        createdAt: new Date(),
        photoTimestamp: photoTimestamp, // Store photo timestamp
        locationTimestamp: locationTimestamp, // Store location timestamp
        cameraCaptured: true, // Mark as camera-captured (not gallery)
        history: [{
          status: 'pending',
          time: new Date(),
          note: 'Report submitted via camera'
        }]
      };
      
      console.log('📝 Creating report with data:', {
        citizenId: reportData.citizenId,
        status: reportData.status,
        location: reportData.location.address
      });
      
      const reportRef = await addDoc(collection(db, 'reports'), reportData);
      console.log('✅ Report created successfully:', reportRef.id);
      
      // Navigate to dashboard after successful submission
      navigate('/dashboard');

      navigate('/dashboard');
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <button className="close-button" onClick={() => navigate('/dashboard')}>✕</button>
      </div>

      {!photo ? (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video"
          />
          <div className="camera-overlay">
            <div className="camera-frame"></div>
          </div>
          <div className="camera-instructions">
            Take a photo of the garbage to report
          </div>
          <button className="capture-button" onClick={capturePhoto}>
            <div className="capture-button-inner"></div>
          </button>
        </div>
      ) : (
        <div className="photo-preview">
          <img src={URL.createObjectURL(photo)} alt="Captured" className="preview-image" />
          <div className="photo-actions">
            <button className="retake-button" onClick={retakePhoto}>
              <span>↻</span> Retake
            </button>
            <button className="upload-button" onClick={uploadReport} disabled={uploading}>
              {uploading ? 'Uploading...' : '↑ Upload'}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default ReportGarbage;

