import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function SweeperCamera() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      navigate("/sweeper/dashboard");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);

      // Fetch task data
      const taskDocRef = doc(db, "reports", taskId);
      const unsubscribeTask = onSnapshot(taskDocRef, (taskDoc) => {
        if (!taskDoc.exists()) {
          navigate("/sweeper/dashboard");
          return;
        }

        const data = taskDoc.data();
        if (data.assignedTo !== currentUser.uid) {
          navigate("/sweeper/dashboard");
          return;
        }

        const locationName = data.locationName || `Location ${taskId.slice(-4)}`;
        setTask({
          id: taskDoc.id,
          ...data,
          locationName
        });
      }, (error) => {
        console.error("Error fetching task:", error);
        navigate("/sweeper/dashboard");
      });

      return () => {
        unsubscribeTask();
      };
    });

    return () => unsubscribe();
  }, [navigate, taskId]);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
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

  useEffect(() => {
    startCamera();
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

  // Upload after-cleaning photo
  const uploadPhoto = async () => {
    try {
      setLoading(true);

      if (!photo) {
        alert("No photo captured. Please take a photo first.");
        setLoading(false);
        return;
      }

      if (!auth || !db || !storage) {
        alert("Firebase services are not configured.");
        setLoading(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Please login first");
        navigate("/");
        setLoading(false);
        return;
      }

      // Upload image to Firebase Storage
      const reportId = taskId;
      const imageRef = ref(storage, `reports/after/${reportId}.jpg`);
      await uploadString(imageRef, photo, "data_url");
      const imageAfter = await getDownloadURL(imageRef);

      // Update report status to verified
      await updateDoc(doc(db, "reports", reportId), {
        imageAfter: imageAfter,
        status: "verified",
        cleanedAt: serverTimestamp()
      });

      // Update sweeper's points and totalCleaned
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          points: increment(50), // Points for completing a task
          totalCleaned: increment(1)
        });
      } catch (userUpdateError) {
        console.error("Failed to update user stats:", userUpdateError);
      }

      // Update citizen's points
      if (task?.citizenId) {
        try {
          const citizenDocRef = doc(db, "users", task.citizenId);
          await updateDoc(citizenDocRef, {
            points: increment(50) // Points for verified report
          });
        } catch (citizenUpdateError) {
          console.error("Failed to update citizen points:", citizenUpdateError);
        }
      }

      // Reset and redirect
      setPhoto(null);
      navigate("/sweeper/dashboard");
      alert("Task completed successfully! +50 points");
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sweeper-camera-page">
      <div className="sweeper-camera-header">
        <div className="sweeper-camera-location-badge">
          <span className="sweeper-camera-badge-icon">☁️</span>
          <div>
            <div className="sweeper-camera-badge-label">Cleaning</div>
            <div className="sweeper-camera-badge-location">{task?.locationName || "Location"}</div>
          </div>
        </div>
        <button className="sweeper-camera-close-btn" onClick={() => navigate("/sweeper/dashboard")}>
          ×
        </button>
      </div>

      {!photo ? (
        <>
          <video ref={videoRef} autoPlay playsInline className="sweeper-camera-view" />
          <canvas ref={canvasRef} width="300" height="400" hidden />
          
          {cameraLoading && (
            <div className="sweeper-camera-loading">
              <div className="sweeper-camera-spinner"></div>
              <p>Starting camera...</p>
            </div>
          )}

          <div className="sweeper-camera-instruction">
            Take a photo after cleaning to complete the task
          </div>

          <button className="sweeper-camera-capture-btn" onClick={takePhoto}></button>
        </>
      ) : (
        <div className="sweeper-camera-preview">
          <div className="sweeper-camera-preview-header">
            <div className="sweeper-camera-location-badge">
              <span className="sweeper-camera-badge-icon">☁️</span>
              <div>
                <div className="sweeper-camera-badge-label">Cleaning</div>
                <div className="sweeper-camera-badge-location">{task?.locationName || "Location"}</div>
              </div>
            </div>
            <button className="sweeper-camera-close-btn" onClick={() => navigate("/sweeper/dashboard")}>
              ×
            </button>
          </div>
          <img src={photo} alt="After cleaning" className="sweeper-camera-preview-image" />
          <div className="sweeper-camera-preview-actions">
            <button className="sweeper-camera-retake-btn" onClick={() => { setPhoto(null); startCamera(); }}>
              <span>↻</span>
              Retake
            </button>
            <button className="sweeper-camera-upload-btn" onClick={uploadPhoto} disabled={loading}>
              {loading ? (
                <>
                  <span className="sweeper-upload-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>↑</span>
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
