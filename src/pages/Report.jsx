import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

export default function Report() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  // Start camera - CAMERA ONLY, NO GALLERY UPLOAD
  // Backend requirement: Frontend must not allow gallery upload, only camera capture
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Back camera for better waste capture
      });
      videoRef.current.srcObject = stream;
      window.currentStream = stream;
      setCameraLoading(false);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraLoading(false);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (window.currentStream) {
      window.currentStream.getTracks().forEach(track => track.stop());
      window.currentStream = null;
    }
  };

  // Get GPS - capture at upload time
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        error => {
          console.error("Location error:", error);
          alert("Location access required. Please enable location permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // On page load
  useEffect(() => {
    startCamera();
    getLocation();

    return () => {
      stopCamera();
    };
  }, []);

  // Take photo
  const takePhoto = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 300, 400);
    const img = canvasRef.current.toDataURL("image/jpeg");
    setPhoto(img);
    stopCamera();
  };

  // Upload to Firebase - Backend compatible format
  // Backend expects: citizenId, imageBefore, status, location (lat/lng), createdAt
  const upload = async () => {
    try {
      setLoading(true);

      // Validate inputs
      if (!photo) {
        alert("Please capture a photo first.");
        setLoading(false);
        return;
      }

      if (!storage) {
        alert("Firebase Storage is not configured. Please check your Firebase setup.");
        setLoading(false);
        return;
      }

      if (!db) {
        alert("Firestore is not configured. Please check your Firebase setup.");
        setLoading(false);
        return;
      }

      const user = auth?.currentUser;
      if (!user) {
        alert("Please login first");
        navigate("/");
        setLoading(false);
        return;
      }

      // Capture location at upload time (backend requirement)
      let currentLocation = location;
      if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
        // Try to get fresh location
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              pos => {
                currentLocation = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
                resolve();
              },
              reject,
              { enableHighAccuracy: true, timeout: 15000 }
            );
          });
        } catch (locError) {
          console.error("Location error:", locError);
          alert("Location is required. Please enable location permissions and try again.");
          setLoading(false);
          return;
        }
      }

      if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
        alert("Location is required. Please enable location permissions and try again.");
        setLoading(false);
        return;
      }

      // Generate reportId
      const reportId = `report_${Date.now()}_${user.uid.slice(0, 8)}`;

      console.log("Starting upload...", { reportId, hasPhoto: !!photo });

      // 1️⃣ Upload image to Firebase Storage - EXACT PATH FORMAT
      // Path: reports/before/{reportId}.jpg
      const imageRef = ref(storage, `reports/before/${reportId}.jpg`);
      
      console.log("Uploading to storage...", imageRef.fullPath);
      await uploadString(imageRef, photo, "data_url");
      console.log("Upload complete, getting download URL...");
      
      const imageBefore = await getDownloadURL(imageRef);
      console.log("Got download URL:", imageBefore);

      // 2️⃣ Save report in Firestore - EXACT FIELD NAMES
      // Backend will match this URL with the storage trigger
      const reportData = {
        citizenId: user.uid,  // Must be citizenId, not userId
        imageBefore: imageBefore,  // Must be imageBefore, not imageURL
        status: "pending",  // Backend will update this (pending → assigned/fake → verified)
        location: {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        createdAt: serverTimestamp()
      };

      console.log("Saving report to Firestore...", reportData);
      const reportDocRef = await addDoc(collection(db, "reports"), reportData);
      console.log("Report saved with ID:", reportDocRef.id);

      // Update user's totalReports
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          totalReports: increment(1)
        });
        console.log("User totalReports updated");
      } catch (userUpdateError) {
        console.error("Error updating user totalReports:", userUpdateError);
        // Don't fail the upload if user update fails
      }

      // 3️⃣ Reset + Redirect
      console.log("Upload successful! Redirecting...");
      setPhoto(null);
      stopCamera();
      navigate("/dashboard");

    } catch (error) {
      console.error("Upload failed", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = "Upload failed. ";
      if (error.code === "storage/unauthorized") {
        errorMessage += "Storage access denied. Please check Firebase Storage rules.";
      } else if (error.code === "storage/quota-exceeded") {
        errorMessage += "Storage quota exceeded.";
      } else if (error.code === "permission-denied") {
        errorMessage += "Permission denied. Please check Firestore rules.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="camera-page">
      <video ref={videoRef} autoPlay playsInline className="camera-view" />
      <canvas ref={canvasRef} width="300" height="400" hidden />

      {cameraLoading && !photo && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          zIndex: 15
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(16, 185, 129, 0.3)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <p style={{
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Starting camera...
          </p>
        </div>
      )}

      {!photo && (
        <>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              ← Back
            </button>
            {location && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                📍 Location captured
              </div>
            )}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            color: 'white',
            textAlign: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            📸 Tap to capture waste
          </div>
          <button 
            className="capture-btn" 
            onClick={takePhoto}
            aria-label="Capture photo"
          ></button>
        </>
      )}

      {photo && (
        <div className="preview">
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10
          }}>
            <button
              onClick={() => {
                setPhoto(null);
                startCamera();
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              ← Retake
            </button>
          </div>
          <img src={photo} alt="preview" />

          <div className="btn-row">
            <button 
              onClick={upload} 
              disabled={loading}
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Uploading...
                </>
              ) : (
                <>
                  ☁️ Upload Report
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
