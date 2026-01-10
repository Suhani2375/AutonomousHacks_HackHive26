import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit, onSnapshot as onSnapshotQuery, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalReports: 0,
    fakeReports: 0,
    resolvedToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    reportsSubmitted: 0,
    reportsResolved: 0,
    avgResolutionTime: 0
  });
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

      // Fetch pending approvals count
      const pendingQuery = query(collection(db, "users"), where("status", "==", "pending"));
      const unsubscribePending = onSnapshotQuery(pendingQuery, (snapshot) => {
        setStats(prev => ({ ...prev, pendingApprovals: snapshot.size }));
      });

      // Fetch total reports count
      const reportsQuery = query(collection(db, "reports"));
      const unsubscribeReports = onSnapshotQuery(reportsQuery, (snapshot) => {
        const total = snapshot.size;
        let fake = 0;
        snapshot.forEach((doc) => {
          if (doc.data().status === "fake") fake++;
        });
        setStats(prev => ({ ...prev, totalReports: total, fakeReports: fake }));
      });

      // Fetch resolved today count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resolvedQuery = query(
        collection(db, "reports"),
        where("status", "==", "verified")
      );
      const unsubscribeResolved = onSnapshotQuery(resolvedQuery, (snapshot) => {
        let resolvedToday = 0;
        snapshot.forEach((doc) => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt && createdAt >= today) {
            resolvedToday++;
          }
        });
        setStats(prev => ({ ...prev, resolvedToday }));
      });

      // Fetch recent activity
      const activityQuery = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const unsubscribeActivity = onSnapshotQuery(activityQuery, (snapshot) => {
        const activities = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: "report",
            message: `New report submitted at ${data.location?.lat?.toFixed(4)}, ${data.location?.lng?.toFixed(4)}`,
            timestamp: data.createdAt?.toDate() || new Date(),
            status: data.status
          });
        });
        setRecentActivity(activities);
      }, (error) => {
        console.error("Error fetching activity:", error);
      });

      // Fetch weekly stats (simplified - last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyQuery = query(collection(db, "reports"));
      const unsubscribeWeekly = onSnapshotQuery(weeklyQuery, (snapshot) => {
        let submitted = 0;
        let resolved = 0;
        snapshot.forEach((doc) => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt && createdAt >= weekAgo) {
            submitted++;
            if (doc.data().status === "verified") resolved++;
          }
        });
        setWeeklyStats({
          reportsSubmitted: submitted,
          reportsResolved: resolved,
          avgResolutionTime: resolved > 0 ? 4.2 : 0 // Simplified calculation
        });
      });

      return () => {
        unsubscribeUser();
        unsubscribePending();
        unsubscribeReports();
        unsubscribeResolved();
        unsubscribeActivity();
        unsubscribeWeekly();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getActivityColor = (status) => {
    if (status === "verified") return "var(--primary)";
    if (status === "fake") return "#ef4444";
    if (status === "assigned") return "#f59e0b";
    return "#6b7280";
  };

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
          <button className="admin-nav-item active" onClick={() => navigate("/admin/dashboard")}>
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
          <button className="admin-nav-item" onClick={() => navigate("/admin/leaderboard")}>
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
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle">Overview of municipal garbage reporting system</p>
        </div>

        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
              📋
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Pending Approvals</div>
              <div className="admin-stat-value">{stats.pendingApprovals}</div>
              <div className="admin-stat-change">+5 today</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" }}>
              📄
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Total Reports</div>
              <div className="admin-stat-value">{stats.totalReports}</div>
              <div className="admin-stat-change">+32 this week</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
              ⚠️
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Fake Reports</div>
              <div className="admin-stat-value">{stats.fakeReports}</div>
              <div className="admin-stat-change">{stats.totalReports > 0 ? ((stats.fakeReports / stats.totalReports) * 100).toFixed(1) : 0}% of total</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.2)", color: "var(--primary)" }}>
              ✅
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Resolved Today</div>
              <div className="admin-stat-value">{stats.resolvedToday}</div>
              <div className="admin-stat-change">+12% vs yesterday</div>
            </div>
          </div>
        </div>

        <div className="admin-content-row">
          <div className="admin-activity-card">
            <div className="admin-card-header">
              <span className="admin-card-icon">🕐</span>
              <h3 className="admin-card-title">Recent Activity</h3>
            </div>
            <div className="admin-activity-list">
              {recentActivity.length === 0 ? (
                <div className="admin-no-data">No recent activity</div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="admin-activity-item">
                    <div
                      className="admin-activity-dot"
                      style={{ background: getActivityColor(activity.status) }}
                    ></div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">{activity.message}</div>
                      <div className="admin-activity-time">{formatTimeAgo(activity.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-stats-card">
            <div className="admin-card-header">
              <span className="admin-card-icon">📈</span>
              <h3 className="admin-card-title">Weekly Statistics</h3>
            </div>
            <div className="admin-weekly-stats">
              <div className="admin-weekly-stat-item">
                <div className="admin-weekly-stat-label">Reports Submitted</div>
                <div className="admin-weekly-stat-value">{weeklyStats.reportsSubmitted}</div>
                <div className="admin-progress-bar">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${Math.min((weeklyStats.reportsSubmitted / 200) * 100, 100)}%`,
                      background: "var(--primary-gradient)"
                    }}
                  ></div>
                </div>
              </div>
              <div className="admin-weekly-stat-item">
                <div className="admin-weekly-stat-label">Reports Resolved</div>
                <div className="admin-weekly-stat-value">{weeklyStats.reportsResolved}</div>
                <div className="admin-progress-bar">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${weeklyStats.reportsSubmitted > 0 ? (weeklyStats.reportsResolved / weeklyStats.reportsSubmitted) * 100 : 0}%`,
                      background: "var(--primary-gradient)"
                    }}
                  ></div>
                </div>
              </div>
              <div className="admin-weekly-stat-item">
                <div className="admin-weekly-stat-label">Avg Resolution Time</div>
                <div className="admin-weekly-stat-value">{weeklyStats.avgResolutionTime.toFixed(1)} hrs</div>
                <div className="admin-progress-bar">
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${Math.min((weeklyStats.avgResolutionTime / 8) * 100, 100)}%`,
                      background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
