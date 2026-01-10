import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function SweeperTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      navigate("/sweeper/dashboard");
      return;
    }

    // Get current location for distance calculation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);

      // Fetch task/report data
      const taskDocRef = doc(db, "reports", taskId);
      const unsubscribeTask = onSnapshot(taskDocRef, (taskDoc) => {
        if (!taskDoc.exists()) {
          navigate("/sweeper/dashboard");
          return;
        }

        const data = taskDoc.data();
        
        // Check if task is assigned to this sweeper
        if (data.assignedTo !== currentUser.uid) {
          navigate("/sweeper/dashboard");
          return;
        }

        // Calculate distance
        if (currentLocation && data.location?.lat && data.location?.lng) {
          const dist = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            data.location.lat,
            data.location.lng
          );
          setDistance(dist);
        }

        const locationName = data.locationName || `Location ${taskId.slice(-4)}`;
        const locationAddress = data.locationAddress || `${data.location?.lat?.toFixed(4)}, ${data.location?.lng?.toFixed(4)}`;

        setTask({
          id: taskDoc.id,
          ...data,
          locationName,
          locationAddress
        });
        setLoading(false);
      }, (error) => {
        console.error("Error fetching task:", error);
        navigate("/sweeper/dashboard");
      });

      return () => {
        unsubscribeTask();
      };
    });

    return () => unsubscribe();
  }, [navigate, taskId, currentLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const timestamp = date.toDate ? date.toDate() : new Date(date);
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  };

  const handleNavigate = () => {
    if (task?.location?.lat && task?.location?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location.lat},${task.location.lng}`;
      window.open(url, '_blank');
    } else {
      alert("Location not available for navigation");
    }
  };

  const handleCleanNow = () => {
    navigate(`/sweeper/camera/${taskId}`);
  };

  const getPriorityColor = (priority) => {
    if (priority === "red" || priority === "high") return "#ef4444";
    if (priority === "yellow" || priority === "medium") return "#f59e0b";
    return "var(--primary)";
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="sweeper-task-detail-page">
        <div className="sweeper-task-detail-header">
          <button className="sweeper-back-btn" onClick={() => navigate("/sweeper/dashboard")}>
            ← Back
          </button>
          <div className="sweeper-task-detail-title">Task Details</div>
          <div></div>
        </div>
        <div className="sweeper-no-task">Task not found</div>
      </div>
    );
  }

  const priority = task.level || task.priority || "green";
  const priorityColor = getPriorityColor(priority);

  return (
    <div className="sweeper-task-detail-page">
      <div className="sweeper-task-detail-header">
        <button className="sweeper-back-btn" onClick={() => navigate("/sweeper/dashboard")}>
          ←
        </button>
        <div className="sweeper-task-detail-title">Task Details</div>
        <div className="sweeper-priority-badge" style={{ background: priorityColor }}>
          {priority === "red" || priority === "high" ? "High Priority" : priority === "yellow" || priority === "medium" ? "Medium Priority" : "Low Priority"}
        </div>
      </div>

      <div className="sweeper-task-detail-content">
        {task.imageBefore && (
          <div className="sweeper-task-image-container">
            <img src={task.imageBefore} alt="Garbage report" className="sweeper-task-image" />
          </div>
        )}

        <div className="sweeper-task-info">
          <h2 className="sweeper-task-location-name">{task.locationName}</h2>
          <div className="sweeper-task-location-details">
            <div className="sweeper-task-location-address">📍 {task.locationAddress}</div>
            <div className="sweeper-task-meta-info">
              Reported {formatTimeAgo(task.createdAt)} • {distance !== null ? `${distance.toFixed(1)} km away` : "Distance unknown"}
            </div>
          </div>
        </div>

        <div className="sweeper-task-actions">
          <button className="sweeper-navigate-btn" onClick={handleNavigate}>
            <span>✈️</span>
            Navigate
          </button>
          <button className="sweeper-clean-now-btn" onClick={handleCleanNow}>
            <span>✓</span>
            Clean Now
          </button>
        </div>
      </div>
    </div>
  );
}
