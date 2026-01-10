import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, onSnapshot as onSnapshotDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      navigate("/");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      setUser(currentUser);
      setCurrentUserId(currentUser.uid);

      // Fetch user data
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshotDoc(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === "admin") {
            navigate("/admin/dashboard");
            return;
          }
          if (data.role === "sweeper") {
            navigate("/sweeper/dashboard");
            return;
          }
          setUserData(data);
        }
      });

      // Real-time listener for leaderboard
      const usersQuery = query(
        collection(db, "users"),
        orderBy("points", "desc"),
        limit(10)
      );

      const unsubscribeLeaderboard = onSnapshot(usersQuery, (usersSnapshot) => {
        const leaderboardList = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.role === "citizen") {
            leaderboardList.push({
              id: doc.id,
              name: data.name || "Anonymous",
              points: data.points || 0,
              initials: (data.name || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            });
          }
        });
        setLeaderboard(leaderboardList);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to leaderboard:", error);
        setLeaderboard([]);
        setLoading(false);
      });

      return () => {
        unsubscribeLeaderboard();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getTopThree = () => {
    return leaderboard.slice(0, 3);
  };

  const getRest = () => {
    return leaderboard.slice(3);
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
        <div className="leaderboard-header">
          <h1 className="page-title">Leaderboard</h1>
        </div>

        {leaderboard.length > 0 && (
          <>
            <div className="top-three-section">
              {getTopThree().map((user, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;
                return (
                  <div key={user.id} className={`top-user-card ${isFirst ? "first" : ""}`}>
                    <div className="top-user-avatar">
                      {user.initials}
                    </div>
                    {getMedalIcon(rank) && (
                      <div className="medal-icon">{getMedalIcon(rank)}</div>
                    )}
                    <div className="top-user-name">{user.name}</div>
                    <div className="top-user-points">{user.points.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            <div className="leaderboard-list">
              {getTopThree().map((user, index) => {
                const rank = index + 1;
                return (
                  <div key={user.id} className="leaderboard-item">
                    <div className="leaderboard-medal">{getMedalIcon(rank)}</div>
                    <div className="leaderboard-avatar">{user.initials}</div>
                    <div className="leaderboard-name">{user.name}</div>
                    <div className="leaderboard-points">{user.points.toLocaleString()}</div>
                  </div>
                );
              })}
              {getRest().map((user, index) => {
                const rank = index + 4;
                return (
                  <div key={user.id} className="leaderboard-item">
                    <div className="leaderboard-rank">{rank}</div>
                    <div className="leaderboard-avatar">{user.initials}</div>
                    <div className="leaderboard-name">{user.name}</div>
                    <div className="leaderboard-points">{user.points.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {leaderboard.length === 0 && (
          <div className="no-leaderboard">No leaderboard data available</div>
        )}
      </div>
    </div>
  );
}
