import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, onSnapshot as onSnapshotQuery } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminReportsMap() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
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

      // Fetch all reports
      const reportsQuery = query(collection(db, "reports"));
      const unsubscribeReports = onSnapshotQuery(reportsQuery, (snapshot) => {
        const reportsList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location?.lat && data.location?.lng) {
            reportsList.push({
              id: doc.id,
              ...data,
              priority: data.level || "green"
            });
          }
        });
        setReports(reportsList);
      }, (error) => {
        console.error("Error fetching reports:", error);
        setReports([]);
      });

      return () => {
        unsubscribeUser();
        unsubscribeReports();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const getPriorityCounts = () => {
    const counts = { high: 0, medium: 0, low: 0 };
    reports.forEach((report) => {
      if (report.priority === "red" || report.level === "red") counts.high++;
      else if (report.priority === "yellow" || report.level === "yellow") counts.medium++;
      else counts.low++;
    });
    return counts;
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, assigned: 0, cleaned: 0 };
    reports.forEach((report) => {
      if (report.status === "pending") counts.pending++;
      else if (report.status === "assigned") counts.assigned++;
      else if (report.status === "verified") counts.cleaned++;
    });
    return counts;
  };

  const priorityCounts = getPriorityCounts();
  const statusCounts = getStatusCounts();

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
          <button className="admin-nav-item active" onClick={() => navigate("/admin/map")}>
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
          <h1 className="admin-title">Reports Map</h1>
          <p className="admin-subtitle">Geographic distribution of garbage reports</p>
        </div>

        <div className="admin-map-container">
          <div className="admin-map-view">
            <div className="admin-map-header">
              <h3>City Overview</h3>
              <p>Municipality Area</p>
            </div>
            <div className="admin-map-grid">
              {reports.slice(0, 10).map((report, index) => {
                const top = 20 + (index % 5) * 15;
                const left = 15 + (index % 3) * 30;
                const color = report.priority === "red" || report.level === "red" ? "#ef4444" :
                              report.priority === "yellow" || report.level === "yellow" ? "#f59e0b" : "var(--primary)";
                return (
                  <div
                    key={report.id}
                    className="admin-map-marker"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      background: color
                    }}
                    title={`Report #${report.id.slice(-4)} - ${report.status}`}
                  >
                    📍
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-map-sidebar">
            <div className="admin-legend-card">
              <h3 className="admin-legend-title">Legend</h3>
              <div className="admin-legend-items">
                <div className="admin-legend-item">
                  <div className="admin-legend-marker" style={{ background: "#ef4444" }}>📍</div>
                  <div>
                    <div className="admin-legend-label">High Priority</div>
                    <div className="admin-legend-count">{priorityCounts.high} reports</div>
                  </div>
                </div>
                <div className="admin-legend-item">
                  <div className="admin-legend-marker" style={{ background: "#f59e0b" }}>📍</div>
                  <div>
                    <div className="admin-legend-label">Medium Priority</div>
                    <div className="admin-legend-count">{priorityCounts.medium} reports</div>
                  </div>
                </div>
                <div className="admin-legend-item">
                  <div className="admin-legend-marker" style={{ background: "var(--primary)" }}>📍</div>
                  <div>
                    <div className="admin-legend-label">Low Priority</div>
                    <div className="admin-legend-count">{priorityCounts.low} reports</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-summary-card">
              <h3 className="admin-summary-title">Summary</h3>
              <div className="admin-summary-items">
                <div className="admin-summary-item">
                  <span>Total Reports</span>
                  <span className="admin-summary-value">{reports.length}</span>
                </div>
                <div className="admin-summary-item">
                  <span>Pending</span>
                  <span className="admin-summary-value">{statusCounts.pending}</span>
                </div>
                <div className="admin-summary-item">
                  <span>Assigned</span>
                  <span className="admin-summary-value">{statusCounts.assigned}</span>
                </div>
                <div className="admin-summary-item">
                  <span>Cleaned</span>
                  <span className="admin-summary-value">{statusCounts.cleaned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
