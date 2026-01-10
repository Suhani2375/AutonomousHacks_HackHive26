import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, onSnapshot as onSnapshotDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState([]);
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

      // Real-time listener for all reports
      let unsubscribeReports;
      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("citizenId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        
        unsubscribeReports = onSnapshot(reportsQuery, (reportsSnapshot) => {
          const reportsList = [];
          reportsSnapshot.forEach((doc) => {
            const data = doc.data();
            let locationStr = "Unknown Location";
            if (data.location?.lat && data.location?.lng) {
              locationStr = `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`;
            }
            reportsList.push({
              id: doc.id,
              reportNumber: doc.id.slice(-4) || doc.id,
              location: locationStr,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              level: data.level || "green"
            });
          });
          setReports(reportsList);
          setLoading(false);
        }, (error) => {
          console.error("Error listening to reports:", error);
          // Fallback: try without orderBy
          const fallbackQuery = query(
            collection(db, "reports"),
            where("citizenId", "==", currentUser.uid)
          );
          const fallbackUnsub = onSnapshot(fallbackQuery, (snapshot) => {
            const reportsList = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              let locationStr = "Unknown Location";
              if (data.location?.lat && data.location?.lng) {
                locationStr = `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`;
              }
              reportsList.push({
                id: doc.id,
                reportNumber: doc.id.slice(-4) || doc.id,
                location: locationStr,
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
                level: data.level || "green"
              });
            });
            reportsList.sort((a, b) => b.createdAt - a.createdAt);
            setReports(reportsList);
            setLoading(false);
          });
          return () => fallbackUnsub();
        });
      } catch (error) {
        console.error("Error setting up reports listener:", error);
        setReports([]);
        setLoading(false);
      }

      return () => {
        if (unsubscribeReports) unsubscribeReports();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reportDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = today - reportDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `Today, ${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const getStatusColor = (status) => {
    if (status === "verified") return "green";
    if (status === "assigned") return "blue";
    if (status === "fake") return "red";
    return "orange";
  };

  const getStatusLabel = (status) => {
    if (status === "verified") return "Cleaned";
    if (status === "assigned") return "Assigned";
    if (status === "fake") return "Rejected";
    return "Pending";
  };

  const getLevelColor = (level) => {
    if (level === "red") return "#ef4444";
    if (level === "yellow") return "#f59e0b";
    return "#10b981";
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
        <div className="reports-header">
          <h1 className="page-title">My Reports</h1>
        </div>

        <div className="reports-list">
          {reports.length === 0 ? (
            <div className="no-reports">No reports yet. Start reporting garbage!</div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="report-card">
                <div
                  className="report-indicator"
                  style={{ backgroundColor: getLevelColor(report.level) }}
                ></div>
                <div className="report-content">
                  <div className="report-header">
                    <h3 className="report-number">Report #{report.reportNumber}</h3>
                    <span
                      className={`status-badge status-${getStatusColor(report.status)}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <div className="report-location">
                    <span className="location-icon">📍</span>
                    {report.location}
                  </div>
                  <div className="report-date">{formatDate(report.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
