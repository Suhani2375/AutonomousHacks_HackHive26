import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function SweeperCaptureClean() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [captureLocation, setCaptureLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

      // Fetch task data if taskId is provided
      if (taskId) {
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
          setLoading(false);
        }, (error) => {
          console.error("Error fetching task:", error);
          navigate("/sweeper/dashboard");
        });

        return () => {
          unsubscribeTask();
        };
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, taskId]);

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        window.currentStream = stream;
      }
      setCameraLoading(false);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraLoading(false);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (window.currentStream) {
      window.currentStream.getTracks().forEach(track => track.stop());
      window.currentStream = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 300, 400);
    const img = canvasRef.current.toDataURL("image/jpeg");
    setPhoto(img);
    stopCamera();
  };

  // Get live location for capture
  const getLiveLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCaptureLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Location error:", error);
          setLocationLoading(false);
          alert("Location access required. Please enable location permissions.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const uploadCleanPhoto = async () => {
    try {
      setUploading(true);

      if (!photo || !task) {
        alert("Please capture a photo first.");
        setUploading(false);
        return;
      }

      if (!auth || !db || !storage) {
        alert("Firebase services are not configured.");
        setUploading(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Please login first");
        navigate("/");
        setUploading(false);
        return;
      }

      // Get fresh location at upload time (live location)
      let finalLocation = captureLocation;
      if (!finalLocation || !finalLocation.lat || !finalLocation.lng) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                finalLocation = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
                resolve();
              },
              reject,
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
          });
        } catch (locError) {
          console.error("Location error:", locError);
          alert("Location is required. Please enable location permissions and try again.");
          setUploading(false);
          return;
        }
      }

      if (!finalLocation || !finalLocation.lat || !finalLocation.lng) {
        alert("Location is required. Please enable location permissions and try again.");
        setUploading(false);
        return;
      }

      const reportId = task.id;
      const imageRef = ref(storage, `reports/after/${reportId}.jpg`);
      await uploadString(imageRef, photo, "data_url");
      const imageAfter = await getDownloadURL(imageRef);

      // Update report status to verified with live location
      await updateDoc(doc(db, "reports", reportId), {
        imageAfter: imageAfter,
        status: "verified",
        cleanedAt: serverTimestamp(),
        cleanedLocation: {
          lat: finalLocation.lat,
          lng: finalLocation.lng
        }
      });

      // Update sweeper's points and totalCleaned
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          points: increment(50),
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
            points: increment(50)
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
      setUploading(false);
    }
  };

  // Start camera and watch location when component mounts
  useEffect(() => {
    if (!loading && task) {
      startCamera();
      getLiveLocation();
      
      // Watch position for live location updates
      let watchId = null;
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setCaptureLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
            setLocationLoading(false);
          },
          (error) => {
            console.error("Location watch error:", error);
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
      
      return () => {
        stopCamera();
        if (watchId !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }
  }, [loading, task]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading task...</p>
      </div>
    );
  }

  return (
    <div className="sweeper-capture-clean-overlay">
      <div className="sweeper-capture-clean-container">
        {!photo ? (
          <>
            <div className="sweeper-capture-clean-header">
              <button
                onClick={() => {
                  stopCamera();
                  navigate("/sweeper/dashboard");
                }}
                className="sweeper-capture-clean-close"
              >
                ← Back
              </button>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {locationLoading ? (
                  <div className="sweeper-capture-clean-location" style={{ opacity: 0.7 }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '6px' }}></span>
                    Getting location...
                  </div>
                ) : captureLocation ? (
                  <div className="sweeper-capture-clean-location">
                    📍 Location captured
                  </div>
                ) : (
                  <div className="sweeper-capture-clean-location" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ Location needed
                  </div>
                )}
                {task && (
                  <div className="sweeper-capture-clean-location">
                    📋 {task.locationName}
                  </div>
                )}
              </div>
            </div>

            <video ref={videoRef} autoPlay playsInline className="sweeper-capture-clean-video" />
            <canvas ref={canvasRef} width="300" height="400" hidden />

            {cameraLoading && (
              <div className="sweeper-capture-clean-loading">
                <div className="sweeper-capture-clean-spinner"></div>
                <p>Starting camera...</p>
              </div>
            )}

            <div className="sweeper-capture-clean-instruction">
              📸 Take a photo after cleaning
              {captureLocation && (
                <div style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.9 }}>
                  📍 Live location: {captureLocation.lat.toFixed(6)}, {captureLocation.lng.toFixed(6)}
                </div>
              )}
            </div>

            <button 
              className="sweeper-capture-clean-capture-btn" 
              onClick={takePhoto}
              disabled={!captureLocation}
              style={{ opacity: captureLocation ? 1 : 0.5, cursor: captureLocation ? 'pointer' : 'not-allowed' }}
            ></button>
          </>
        ) : (
          <div className="sweeper-capture-clean-preview">
            <div className="sweeper-capture-clean-preview-header">
              <button
                onClick={() => {
                  setPhoto(null);
                  startCamera();
                  // Refresh location when retaking
                  getLiveLocation();
                }}
                className="sweeper-capture-clean-retake"
              >
                ← Retake
              </button>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {captureLocation && (
                  <div className="sweeper-capture-clean-location">
                    📍 Location: {captureLocation.lat.toFixed(4)}, {captureLocation.lng.toFixed(4)}
                  </div>
                )}
                {task && (
                  <div className="sweeper-capture-clean-location">
                    📋 {task.locationName}
                  </div>
                )}
              </div>
            </div>
            <img src={photo} alt="After cleaning" className="sweeper-capture-clean-preview-img" />
            <div className="sweeper-capture-clean-actions">
              <button
                className="sweeper-capture-clean-upload-btn"
                onClick={uploadCleanPhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="sweeper-upload-spinner"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    ☁️ Upload Clean Photo
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
