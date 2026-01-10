import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, setDoc, collection, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      navigate("/");
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);
      setLoading(true);

      const userDocRef = doc(db, "users", currentUser.uid);

      // Real-time listener for user data
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Redirect based on role
          if (data.role === "admin") {
            navigate("/admin/dashboard");
            return;
          }
          if (data.role === "sweeper") {
            navigate("/sweeper/dashboard");
            return;
          }
          // Prioritize username field first, then name, then displayName, then email
          const displayName = data.username || data.name || currentUser.displayName || currentUser.email?.split("@")[0];
          setUserData({
            ...data,
            username: data.username || null, // Keep original username from Firebase
            name: data.name || displayName,
            displayName: displayName || "User"
          });
          console.log("User data from Firebase:", { username: data.username, name: data.name, displayName });
        } else {
          // Create user document if it doesn't exist
          setDoc(userDocRef, {
            createdAt: serverTimestamp(),
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            points: 0,
            role: "citizen",
            status: "pending",
            totalCleaned: 0,
            totalReports: 0
          }).catch((error) => {
            console.error("Error creating user doc:", error);
            setUserData({
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
              points: 0,
              totalReports: 0
            });
            setLoading(false);
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user data:", error);
        setUserData({
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
          points: 0,
          totalReports: 0
        });
        setLoading(false);
      });

      // Real-time listener for recent reports
      let unsubscribeReports;
      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("citizenId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        unsubscribeReports = onSnapshot(reportsQuery, (reportsSnapshot) => {
          const activities = [];
          reportsSnapshot.forEach((doc) => {
            const data = doc.data();
            let locationStr = "Unknown Location";
            if (data.location?.lat && data.location?.lng) {
              locationStr = `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`;
            }
            
            activities.push({
              id: doc.id,
              reportNumber: doc.id.slice(-4) || doc.id,
              location: locationStr,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              points: data.status === "verified" ? 50 : data.status === "assigned" ? 2 : 0
            });
          });
          setRecentActivity(activities);
        }, (error) => {
          console.error("Error listening to reports:", error);
          // Fallback: try without orderBy
          const fallbackQuery = query(
            collection(db, "reports"),
            where("citizenId", "==", currentUser.uid),
            limit(5)
          );
          const fallbackUnsub = onSnapshot(fallbackQuery, (snapshot) => {
            const activities = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              let locationStr = "Unknown Location";
              if (data.location?.lat && data.location?.lng) {
                locationStr = `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`;
              }
              activities.push({
                id: doc.id,
                reportNumber: doc.id.slice(-4) || doc.id,
                location: locationStr,
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
                points: data.status === "verified" ? 50 : data.status === "assigned" ? 2 : 0
              });
            });
            activities.sort((a, b) => b.createdAt - a.createdAt);
            setRecentActivity(activities);
          });
          return () => fallbackUnsub();
        });
      } catch (error) {
        console.error("Error setting up reports listener:", error);
        setRecentActivity([]);
      }

      return () => {
        unsubscribeUser();
        if (unsubscribeReports) unsubscribeReports();
      };
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getStatusText = (status) => {
    if (status === "verified") return "Cleaned";
    if (status === "assigned") return "Assigned";
    if (status === "fake") return "Rejected";
    return "Pending";
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Left Sidebar */}
      <div className="citizen-sidebar">
        <div className="citizen-sidebar-header">
          <div className="citizen-logo">
            <div className="citizen-logo-icon">🗑️</div>
            <div>
              <div className="citizen-logo-title">CleanCity</div>
              <div className="citizen-logo-subtitle">Citizen Portal</div>
            </div>
          </div>
        </div>
        
        <div className="citizen-user-profile">
          <div className="citizen-user-avatar">
            <span>{(userData?.username || userData?.name || user?.displayName || user?.email?.charAt(0) || "U").charAt(0).toUpperCase()}</span>
          </div>
          <div className="citizen-user-info">
            <div className="citizen-user-name">{userData?.username || userData?.name || user?.displayName || "User"}</div>
            <div className="citizen-user-email">{user?.email}</div>
          </div>
        </div>

        <nav className="citizen-nav">
          <button 
            className={`citizen-nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <span className="citizen-nav-icon">🏠</span>
            <span>Dashboard</span>
          </button>
          <button 
            className={`citizen-nav-item ${location.pathname === "/reports" ? "active" : ""}`}
            onClick={() => navigate("/reports")}
          >
            <span className="citizen-nav-icon">📋</span>
            <span>My Reports</span>
          </button>
          <button 
            className={`citizen-nav-item ${location.pathname === "/leaderboard" ? "active" : ""}`}
            onClick={() => navigate("/leaderboard")}
          >
            <span className="citizen-nav-icon">🏆</span>
            <span>Leaderboard</span>
          </button>
          <button 
            className={`citizen-nav-item ${location.pathname === "/report" ? "active" : ""}`}
            onClick={() => navigate("/report")}
          >
            <span className="citizen-nav-icon">📷</span>
            <span>Report Garbage</span>
          </button>
        </nav>

        <div className="citizen-sidebar-footer">
          <button className="citizen-signout-btn" onClick={() => auth.signOut()}>
            <span>→</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h2 className="user-name">
              Hello, <span className="username-highlight">{userData?.username || userData?.name || user?.displayName || user?.email?.split("@")[0] || "User"}</span>
            </h2>
            <p className="welcome-text">Welcome back! 👋</p>
          </div>
        </div>

        <button className="report-garbage-btn" onClick={() => navigate("/report")}>
          <div className="camera-icon">📷</div>
          <span>Report Garbage</span>
        </button>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon reports-icon">📄</div>
            <div className="stat-value">{userData?.totalReports || 0}</div>
            <div className="stat-label">My Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon points-icon">🏆</div>
            <div className="stat-value">{userData?.points || 0}</div>
            <div className="stat-label">My Points</div>
          </div>
        </div>

        <div className="recent-activity-section">
          <h3 className="section-title">RECENT ACTIVITY</h3>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="no-activity">No recent activity</div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-indicator"></div>
                  <div className="activity-content">
                    <div className="activity-title">
                      Report #{activity.reportNumber} {getStatusText(activity.status)}
                    </div>
                    <div className="activity-meta">
                      {activity.location} • {formatTimeAgo(activity.createdAt)}
                    </div>
                  </div>
                  {activity.points > 0 && (
                    <div className="activity-points">+{activity.points} pts</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
