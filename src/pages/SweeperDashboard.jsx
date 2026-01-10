import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, where, orderBy, onSnapshot as onSnapshotQuery, limit, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function SweeperDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [assignedReports, setAssignedReports] = useState([]);
  const [completedReports, setCompletedReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks", "completed", "leaderboard"

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      navigate("/");
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

      // Fetch user data
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== "sweeper") {
            navigate("/dashboard");
            return;
          }
          setUserData(data);
        }
        setLoading(false);
      });

      // Fetch assigned reports (status: assigned)
      const assignedQuery = query(
        collection(db, "reports"),
        where("assignedTo", "==", currentUser.uid),
        where("status", "==", "assigned"),
        orderBy("createdAt", "desc")
      );

      const unsubscribeAssigned = onSnapshotQuery(assignedQuery, (snapshot) => {
        const reports = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Calculate distance if we have current location
          let distance = null;
          if (currentLocation && data.location?.lat && data.location?.lng) {
            distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              data.location.lat,
              data.location.lng
            );
          }

          // Get priority/level
          const priority = data.level || data.priority || "green";
          const priorityText = priority === "red" ? "High" : priority === "yellow" ? "Medium" : "Low";

          // Generate location name
          const locationName = data.locationName || `Location ${doc.id.slice(-4)}`;
          const locationAddress = data.locationAddress || `${data.location?.lat?.toFixed(4)}, ${data.location?.lng?.toFixed(4)}`;

          reports.push({
            id: doc.id,
            ...data,
            locationName,
            locationAddress,
            distance,
            priority,
            priorityText
          });
        });
        
        // Sort by priority (High first) then distance
        reports.sort((a, b) => {
          const priorityOrder = { red: 1, yellow: 2, green: 3 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
          }
          return 0;
        });

        setAssignedReports(reports);
      }, (error) => {
        console.error("Error fetching assigned reports:", error);
        setAssignedReports([]);
      });

      // Fetch completed reports (status: verified) with imageAfter
      const completedQuery = query(
        collection(db, "reports"),
        where("assignedTo", "==", currentUser.uid),
        where("status", "==", "verified"),
        orderBy("cleanedAt", "desc"),
        limit(50)
      );

      const unsubscribeCompleted = onSnapshotQuery(completedQuery, (snapshot) => {
        const reports = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.imageAfter) {
            const locationName = data.locationName || `Location ${doc.id.slice(-4)}`;
            reports.push({
              id: doc.id,
              ...data,
              locationName,
              cleanedAt: data.cleanedAt
            });
          }
        });
        setCompletedReports(reports);
      }, (error) => {
        console.error("Error fetching completed reports:", error);
        setCompletedReports([]);
      });

      // Fetch leaderboard (all sweepers sorted by totalCleaned or points)
      const fetchLeaderboard = async () => {
        try {
          const sweepersQuery = query(
            collection(db, "users"),
            where("role", "==", "sweeper"),
            orderBy("totalCleaned", "desc"),
            limit(20)
          );
          
          const snapshot = await getDocs(sweepersQuery);
          const sweepers = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            sweepers.push({
              id: doc.id,
              ...data,
              rank: sweepers.length + 1
            });
          });
          
          // Sort by totalCleaned, then by points
          sweepers.sort((a, b) => {
            if (b.totalCleaned !== a.totalCleaned) {
              return (b.totalCleaned || 0) - (a.totalCleaned || 0);
            }
            return (b.points || 0) - (a.points || 0);
          });
          
          // Update ranks
          sweepers.forEach((sweeper, index) => {
            sweeper.rank = index + 1;
          });
          
          setLeaderboard(sweepers);
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          // Fallback: try without orderBy if index doesn't exist
          try {
            const allSweepersQuery = query(
              collection(db, "users"),
              where("role", "==", "sweeper"),
              limit(20)
            );
            const snapshot = await getDocs(allSweepersQuery);
            const sweepers = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              sweepers.push({
                id: doc.id,
                ...data
              });
            });
            sweepers.sort((a, b) => {
              if (b.totalCleaned !== a.totalCleaned) {
                return (b.totalCleaned || 0) - (a.totalCleaned || 0);
              }
              return (b.points || 0) - (a.points || 0);
            });
            sweepers.forEach((sweeper, index) => {
              sweeper.rank = index + 1;
            });
            setLeaderboard(sweepers);
          } catch (fallbackError) {
            console.error("Fallback leaderboard fetch failed:", fallbackError);
            setLeaderboard([]);
          }
        }
      };

      // Fetch leaderboard periodically (every 30 seconds)
      fetchLeaderboard();
      const leaderboardInterval = setInterval(fetchLeaderboard, 30000);

      return () => {
        unsubscribeUser();
        unsubscribeAssigned();
        unsubscribeCompleted();
        clearInterval(leaderboardInterval);
      };
    });

    return () => unsubscribe();
  }, [navigate, currentLocation]);

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
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";
    const timestamp = date.toDate ? date.toDate() : new Date(date);
    return timestamp.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const getPriorityColor = (priority) => {
    if (priority === "red") return { bar: "#ef4444", tag: "#ef4444", text: "white" };
    if (priority === "yellow") return { bar: "#f59e0b", tag: "#f59e0b", text: "black" };
    return { bar: "#10b981", tag: "#10b981", text: "white" };
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const handleCaptureClean = (task) => {
    if (!task || !task.id) {
      console.error("No task selected for capture clean");
      alert("No task available. Please select a task first.");
      return;
    }
    // Navigate to capture clean page with task ID
    console.log("Navigating to capture clean for task:", task.id);
    navigate(`/sweeper/capture-clean/${task.id}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentUserRank = leaderboard.findIndex(s => s.id === user?.uid) + 1;
  const currentUserData = leaderboard.find(s => s.id === user?.uid);

  return (
    <div className="sweeper-dashboard-page">
      {/* Left Sidebar */}
      <div className="sweeper-sidebar">
        <div className="sweeper-sidebar-header">
          <div className="sweeper-logo">
            <div className="sweeper-logo-icon">🧹</div>
            <div>
              <div className="sweeper-logo-title">CleanCity</div>
              <div className="sweeper-logo-subtitle">Sweeper Portal</div>
            </div>
          </div>
        </div>
        
        <div className="sweeper-user-profile">
          <div className="sweeper-user-avatar">
            <span>{(userData?.username || userData?.name || user?.displayName || user?.email?.charAt(0) || "S").charAt(0).toUpperCase()}</span>
          </div>
          <div className="sweeper-user-info">
            <div className="sweeper-user-name">{userData?.username || userData?.name || "Sweeper"}</div>
            <div className="sweeper-user-email">{user?.email}</div>
          </div>
        </div>

        <nav className="sweeper-nav-sidebar">
          <button 
            className={`sweeper-nav-sidebar-item ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <span className="sweeper-nav-sidebar-icon">📋</span>
            <span>My Tasks</span>
            {assignedReports.length > 0 && (
              <span className="sweeper-nav-badge-sidebar">{assignedReports.length}</span>
            )}
          </button>
          <button 
            className={`sweeper-nav-sidebar-item ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <span className="sweeper-nav-sidebar-icon">✨</span>
            <span>Cleanups</span>
          </button>
          <button 
            className={`sweeper-nav-sidebar-item ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            <span className="sweeper-nav-sidebar-icon">🏆</span>
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* Capture Clean Feature in Sidebar */}
        <div className="sweeper-capture-clean-panel">
          {assignedReports.length > 0 ? (
            <button 
              className="sweeper-capture-clean-panel-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Capture Clean button clicked");
                console.log("Assigned reports:", assignedReports);
                // If only one task, use it directly; otherwise use the first one
                const selectedTask = assignedReports[0];
                console.log("Selected task:", selectedTask);
                if (selectedTask && selectedTask.id) {
                  console.log("Navigating to task:", selectedTask.id);
                  handleCaptureClean(selectedTask);
                } else {
                  console.error("Invalid task data:", selectedTask);
                  alert("Unable to start capture. Please try again.");
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="sweeper-capture-clean-panel-icon">📷</div>
              <div className="sweeper-capture-clean-panel-content">
                <div className="sweeper-capture-clean-panel-title">Capture Clean</div>
                <div className="sweeper-capture-clean-panel-subtitle">
                  {assignedReports.length} task{assignedReports.length > 1 ? 's' : ''} available
                </div>
              </div>
            </button>
          ) : (
            <div className="sweeper-capture-clean-panel-empty">
              <div className="sweeper-capture-clean-panel-icon">📷</div>
              <div className="sweeper-capture-clean-panel-content">
                <div className="sweeper-capture-clean-panel-title">Capture Clean</div>
                <div className="sweeper-capture-clean-panel-subtitle">No tasks assigned</div>
              </div>
            </div>
          )}
        </div>

        <div className="sweeper-sidebar-footer">
          <button className="sweeper-signout-btn" onClick={() => auth.signOut()}>
            <span>→</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="sweeper-content-wrapper">
        <div className="sweeper-tasks-header">
          <div className="sweeper-tasks-header-left">
            <h1 className="sweeper-tasks-title">
              {activeTab === "tasks" && "My Tasks"}
              {activeTab === "completed" && "My Cleanups"}
              {activeTab === "leaderboard" && "Sweeper Leaderboard"}
            </h1>
            <p className="sweeper-tasks-subtitle">
              {activeTab === "tasks" && `${assignedReports.length} pending`}
              {activeTab === "completed" && `${completedReports.length} completed`}
              {activeTab === "leaderboard" && (currentUserRank > 0 ? `Your Rank: #${currentUserRank}` : "Compete with others")}
            </p>
          </div>
        </div>

      {/* Assigned Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="sweeper-content-area">
          {assignedReports.length === 0 ? (
            <div className="sweeper-no-tasks-container">
              <div className="sweeper-empty-icon">📋</div>
              <div className="sweeper-no-tasks">No assigned tasks</div>
              <p className="sweeper-empty-subtitle">New tasks will appear here when assigned</p>
            </div>
          ) : (
            <div className="sweeper-tasks-list">
              {assignedReports.map((report) => {
                const colors = getPriorityColor(report.priority);
                return (
                  <div
                    key={report.id}
                    className="sweeper-task-item"
                    onClick={() => navigate(`/sweeper/task/${report.id}`)}
                  >
                    <div className="sweeper-task-priority-bar" style={{ background: colors.bar }}></div>
                    <div className="sweeper-task-content">
                      <div className="sweeper-task-name">{report.locationName}</div>
                      <div className="sweeper-task-address">{report.locationAddress}</div>
                      <div className="sweeper-task-distance">
                        📍 {report.distance !== null ? `${report.distance.toFixed(1)} km` : "Distance unknown"}
                      </div>
                    </div>
                    <div className="sweeper-task-priority-tag" style={{ background: colors.tag, color: colors.text }}>
                      {report.priorityText}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Cleanups Tab */}
      {activeTab === "completed" && (
        <div className="sweeper-content-area">
          {completedReports.length === 0 ? (
            <div className="sweeper-no-tasks-container">
              <div className="sweeper-empty-icon">✨</div>
              <div className="sweeper-no-tasks">No completed cleanups yet</div>
              <p className="sweeper-empty-subtitle">Complete tasks to see your cleanup gallery here</p>
            </div>
          ) : (
            <div className="sweeper-completed-grid">
              {completedReports.map((report) => (
                <div key={report.id} className="sweeper-completed-card">
                  <div className="sweeper-completed-image-wrapper">
                    <img 
                      src={report.imageAfter} 
                      alt="After cleaning" 
                      className="sweeper-completed-image"
                      onError={(e) => {
                        e.target.src = report.imageBefore || "https://via.placeholder.com/300x200?text=No+Image";
                      }}
                    />
                    <div className="sweeper-completed-badge">✓ Cleaned</div>
                  </div>
                  <div className="sweeper-completed-info">
                    <div className="sweeper-completed-location">{report.locationName}</div>
                    <div className="sweeper-completed-date">{formatDate(report.cleanedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="sweeper-content-area">
          {currentUserData && (
            <div className="sweeper-user-stats-card">
              <div className="sweeper-user-stats-header">
                <div className="sweeper-user-avatar-large">
                  {currentUserData.username?.[0]?.toUpperCase() || currentUserData.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div className="sweeper-user-stats-info">
                  <div className="sweeper-user-stats-name">{currentUserData.username || currentUserData.name || "Sweeper"}</div>
                  <div className="sweeper-user-stats-rank">Rank #{currentUserRank}</div>
                </div>
              </div>
              <div className="sweeper-user-stats-grid">
                <div className="sweeper-stat-item">
                  <div className="sweeper-stat-value">{currentUserData.totalCleaned || 0}</div>
                  <div className="sweeper-stat-label">Cleanups</div>
                </div>
                <div className="sweeper-stat-item">
                  <div className="sweeper-stat-value">{currentUserData.points || 0}</div>
                  <div className="sweeper-stat-label">Points</div>
                </div>
              </div>
            </div>
          )}

          {leaderboard.length === 0 ? (
            <div className="sweeper-no-tasks-container">
              <div className="sweeper-empty-icon">🏆</div>
              <div className="sweeper-no-tasks">No leaderboard data yet</div>
              <p className="sweeper-empty-subtitle">Complete tasks to compete!</p>
            </div>
          ) : (
            <div className="sweeper-leaderboard-list">
              {leaderboard.map((sweeper, index) => {
                const isCurrentUser = sweeper.id === user?.uid;
                return (
                  <div 
                    key={sweeper.id} 
                    className={`sweeper-leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="sweeper-leaderboard-rank">
                      {getRankEmoji(sweeper.rank)}
                    </div>
                    <div className="sweeper-leaderboard-avatar">
                      {sweeper.username?.[0]?.toUpperCase() || sweeper.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="sweeper-leaderboard-info">
                      <div className="sweeper-leaderboard-name">
                        {sweeper.username || sweeper.name || "Sweeper"}
                        {isCurrentUser && <span className="sweeper-you-badge">You</span>}
                      </div>
                      <div className="sweeper-leaderboard-stats">
                        {sweeper.totalCleaned || 0} cleanups • {sweeper.points || 0} points
                      </div>
                    </div>
                    <div className="sweeper-leaderboard-badge">
                      {sweeper.rank <= 3 ? (
                        <span className="sweeper-top-badge">Top {sweeper.rank}</span>
                      ) : (
                        <span className="sweeper-rank-number">#{sweeper.rank}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
