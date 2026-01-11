import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, arrayUnion, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../shared/firebase-config';
import './CameraCapture.css';

function CameraCapture() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'verified' | 'failed'
  const [verificationStatus, setVerificationStatus] = useState(null);
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
    setUploadStatus('uploading');
    try {
      // Upload image to Firebase Storage (this triggers onAfterCleanUpload Cloud Function)
      const timestamp = Date.now();
      const imageRef = ref(storage, `reports/${taskId}/${timestamp}_after.jpg`);
      await uploadBytes(imageRef, photo);
      const imageUrl = await getDownloadURL(imageRef);

      // Update report with after image
      const taskDoc = await getDoc(doc(db, 'reports', taskId));
      const currentStatus = taskDoc.data()?.status;
      
      await updateDoc(doc(db, 'reports', taskId), {
        imageAfter: imageUrl,
        status: 'cleaned', // Set to cleaned, AI will update to verified if successful
        cleanedAt: new Date(),
        history: arrayUnion({
          status: 'cleaned',
          time: serverTimestamp(),
          action: 'photo_uploaded'
        })
      });

      setUploadStatus('processing');
      setUploading(false);

      // Timeout after 15 seconds - navigate even if verification doesn't complete
      let timeoutId = setTimeout(() => {
        navigate('/dashboard');
      }, 15000);

      // Listen for AI verification status (Cloud Function will update status to 'verified')
      const unsubscribe = onSnapshot(
        doc(db, 'reports', taskId),
        (snapshot) => {
          const taskData = snapshot.data();
          if (taskData) {
            if (taskData.status === 'verified') {
              clearTimeout(timeoutId);
              setUploadStatus('verified');
              setVerificationStatus({
                verified: true,
                cleanlinessLevel: taskData.cleanlinessLevel || 'clean',
                cleaningQuality: taskData.cleaningQuality || 'good',
                description: taskData.aiComparisonDescription || 'Cleaning verified by AI'
              });
              unsubscribe();
              // Auto-navigate after showing success message
              setTimeout(() => {
                navigate('/dashboard');
              }, 3000);
            } else if (taskData.status === 'cleaned' && taskData.aiComparisonError) {
              clearTimeout(timeoutId);
              setUploadStatus('failed');
              setVerificationStatus({
                verified: false,
                error: taskData.aiComparisonError
              });
              unsubscribe();
            }
          }
        },
        (error) => {
          console.error('Error listening to task updates:', error);
          clearTimeout(timeoutId);
          // Even if listener fails, navigate after a delay
          setTimeout(() => {
            setUploadStatus('processing');
            navigate('/dashboard');
          }, 5000);
        }
      );
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadStatus('failed');
      setUploading(false);
      alert('Failed to upload photo. Please try again.');
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
      ) : uploadStatus === 'verified' ? (
        <div className="photo-preview">
          <div className="verification-success">
            <div className="success-icon">✅</div>
            <h2>Cleaning Verified!</h2>
            <p className="success-message">
              AI has verified your cleaning work. The area is {verificationStatus?.cleanlinessLevel || 'clean'}.
            </p>
            <div className="credits-info">
              <div className="credits-badge">
                <span>🎁</span>
                <div>
                  <strong>+2 Credits</strong>
                  <span>for you and the citizen!</span>
                </div>
              </div>
            </div>
            <p className="redirect-message">Redirecting to dashboard...</p>
          </div>
        </div>
      ) : uploadStatus === 'processing' ? (
        <div className="photo-preview">
          <div className="ai-processing">
            <div className="processing-spinner"></div>
            <h2>AI Verification in Progress</h2>
            <p>Comparing your cleaning photo with the original report...</p>
            <div className="processing-steps">
              <div className="step">✓ Photo uploaded</div>
              <div className="step active">⟳ AI analyzing images...</div>
              <div className="step">⏳ Verifying cleaning quality</div>
            </div>
            <p className="processing-hint">The citizen will receive credits once verified!</p>
          </div>
        </div>
      ) : uploadStatus === 'failed' ? (
        <div className="photo-preview">
          <img src={URL.createObjectURL(photo)} alt="Captured" className="preview-image" />
          <div className="upload-error">
            <p>⚠️ Verification failed. Please try again.</p>
            <div className="photo-actions">
              <button className="retake-button" onClick={retakePhoto}>
                <span>↻</span> Retake
              </button>
              <button className="upload-button" onClick={uploadPhoto} disabled={uploading}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="photo-preview">
          <img src={URL.createObjectURL(photo)} alt="Captured" className="preview-image" />
          <div className="photo-actions">
            <button className="retake-button" onClick={retakePhoto} disabled={uploading}>
              <span>↻</span> Retake
            </button>
            <button className="upload-button" onClick={uploadPhoto} disabled={uploading}>
              {uploading ? 'Uploading...' : '↑ Upload & Verify'}
            </button>
          </div>
          {uploading && (
            <div className="upload-info">
              <p>Uploading photo... AI will verify cleaning quality.</p>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default CameraCapture;

