import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, onSnapshot as onSnapshotQuery, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminLeaderboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab] = useState("citizens"); // citizens or sweepers
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

      // Fetch user data
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== "admin") {
            navigate("/dashboard");
            return;
          }
          setUserData(data);
        }
        setLoading(false);
      });

      // Fetch leaderboard based on tab
      const roleFilter = tab === "citizens" ? "citizen" : "sweeper";
      const leaderboardQuery = query(
        collection(db, "users"),
        where("role", "==", roleFilter),
        orderBy("points", "desc"),
        limit(10)
      );

      const unsubscribeLeaderboard = onSnapshotQuery(leaderboardQuery, (snapshot) => {
        const leaderboardList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          leaderboardList.push({
            id: doc.id,
            name: data.name || data.username || "Anonymous",
            points: data.points || 0,
            totalReports: data.totalReports || 0,
            zone: data.zone || "Unassigned"
          });
        });
        setLeaderboard(leaderboardList);
      }, (error) => {
        console.error("Error fetching leaderboard:", error);
        setLeaderboard([]);
      });

      return () => {
        unsubscribeUser();
        unsubscribeLeaderboard();
      };
    });

    return () => unsubscribe();
  }, [navigate, tab]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">🛡️</div>
          <div>
            <div className="admin-logo-title">CleanCity</div>
            <div className="admin-logo-subtitle">Admin Portal</div>
          </div>
        </div>
        <nav className="admin-nav">
          <button className="admin-nav-item" onClick={() => navigate("/admin/dashboard")}>
            <span className="admin-nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin/approvals")}>
            <span className="admin-nav-icon">👥</span>
            <span>User Approval</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin/map")}>
            <span className="admin-nav-icon">🗺️</span>
            <span>Reports Map</span>
          </button>
          <button className="admin-nav-item active" onClick={() => navigate("/admin/leaderboard")}>
            <span className="admin-nav-icon">🏆</span>
            <span>Leaderboard</span>
          </button>
        </nav>
        <div className="admin-user-profile">
          <div className="admin-user-avatar">
            <span>{(userData?.name || user?.email?.charAt(0) || "A").charAt(0).toUpperCase()}</span>
          </div>
          <div className="admin-user-info">
            <div className="admin-user-name">{userData?.name || user?.email || "Admin User"}</div>
            <div className="admin-user-email">{user?.email}</div>
          </div>
          <button className="admin-signout-btn" onClick={() => auth.signOut()}>
            <span>→</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-title">Leaderboard</h1>
          <p className="admin-subtitle">Top performing citizens and sweepers by zone</p>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "citizens" ? "active" : ""}`}
            onClick={() => setTab("citizens")}
          >
            <span>👤</span>
            Top Citizens
          </button>
          <button
            className={`admin-tab ${tab === "sweepers" ? "active" : ""}`}
            onClick={() => setTab("sweepers")}
          >
            <span>💼</span>
            Top Sweepers
          </button>
        </div>

        <div className="admin-leaderboard-cards">
          {leaderboard.slice(0, 3).map((user, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
            const borderColor = rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : "#f97316";
            
            return (
              <div key={user.id} className="admin-leaderboard-card" style={{ borderColor }}>
                <div className="admin-leaderboard-medal">{medal}</div>
                <div className="admin-leaderboard-avatar">👤</div>
                <div className="admin-leaderboard-name">{user.name}</div>
                <div className="admin-leaderboard-zone">{user.zone}</div>
                <div className="admin-leaderboard-points">{user.points.toLocaleString()}</div>
                <div className="admin-leaderboard-label">points</div>
                <div className="admin-leaderboard-reports">{user.totalReports} reports submitted</div>
              </div>
            );
          })}
        </div>

        {leaderboard.length > 3 && (
          <div className="admin-leaderboard-table">
            <div className="admin-table-header">
              <div className="admin-table-col">Rank</div>
              <div className="admin-table-col">Name</div>
              <div className="admin-table-col">Zone</div>
              <div className="admin-table-col">Reports</div>
              <div className="admin-table-col">Points</div>
            </div>
            {leaderboard.slice(3).map((user, index) => (
              <div key={user.id} className="admin-table-row">
                <div className="admin-table-col">{index + 4}</div>
                <div className="admin-table-col">
                  <div className="admin-user-cell">
                    <span className="admin-user-icon">👤</span>
                    <span>{user.name}</span>
                  </div>
                </div>
                <div className="admin-table-col">
                  <span className="admin-zone-badge">{user.zone}</span>
                </div>
                <div className="admin-table-col">{user.totalReports}</div>
                <div className="admin-table-col admin-points-value">{user.points.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
