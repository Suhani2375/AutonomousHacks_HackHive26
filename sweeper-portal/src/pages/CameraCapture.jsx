import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../shared/firebase-config';
import './CameraCapture.css';

function CameraCapture() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
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

  const uploadPhoto = async () => {
    if (!photo) return;

    setUploading(true);
    try {
      // Upload image to Firebase Storage
      // CRITICAL: File name must end with "_after.jpg" for AI processing
      const timestamp = Date.now();
      const fileName = `${timestamp}_after.jpg`;
      const imageRef = ref(storage, `reports/${taskId}/${fileName}`);
      
      console.log('Uploading after-clean image:', `reports/${taskId}/${fileName}`);
      
      await uploadBytes(imageRef, photo);
      const imageUrl = await getDownloadURL(imageRef);
      
      console.log('Image uploaded successfully:', imageUrl);
      console.log('AI will process this image automatically...');

      // Update report with after image
      // If already cleaned, keep status as cleaned, otherwise set to cleaned
      const taskDoc = await getDoc(doc(db, 'reports', taskId));
      const currentStatus = taskDoc.data()?.status;
      
      await updateDoc(doc(db, 'reports', taskId), {
        imageAfter: imageUrl,
        status: currentStatus === 'verified' ? 'verified' : 'cleaned',
        cleanedAt: new Date(),
        afterImageUploadedAt: new Date(),
        history: arrayUnion({
          status: currentStatus === 'verified' ? 'verified' : 'cleaned',
          time: serverTimestamp(),
          action: 'photo_uploaded',
          note: 'After-clean image uploaded. AI verification in progress...'
        })
      });

      // Show success message
      alert('✅ Photo uploaded successfully! AI is verifying the cleaning...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(`Failed to upload photo: ${error.message}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="camera-capture-container">
      <div className="camera-header">
        <div className="task-label">
          <span>Cleaning</span>
          <span>MG Road Junction</span>
        </div>
        <button className="close-button" onClick={() => navigate(`/task/${taskId}`)}>✕</button>
      </div>

      {!photo ? (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video"
          />
          <div className="camera-instructions">
            Take a photo after cleaning to complete the task
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
            <button className="upload-button" onClick={uploadPhoto} disabled={uploading}>
              {uploading ? 'Uploading...' : '↑ Upload'}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default CameraCapture;

