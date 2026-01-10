import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, query, where, onSnapshot as onSnapshotQuery, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminUserApproval() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filter, setFilter] = useState("all"); // all, citizens, sweepers
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

      // Fetch pending users
      let usersQuery;
      if (filter === "citizens") {
        usersQuery = query(collection(db, "users"), where("status", "==", "pending"), where("role", "==", "citizen"));
      } else if (filter === "sweepers") {
        usersQuery = query(collection(db, "users"), where("status", "==", "pending"), where("role", "==", "sweeper"));
      } else {
        usersQuery = query(collection(db, "users"), where("status", "==", "pending"));
      }

      const unsubscribePending = onSnapshotQuery(usersQuery, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          users.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setPendingUsers(users);
      }, (error) => {
        console.error("Error fetching pending users:", error);
        setPendingUsers([]);
      });

      return () => {
        unsubscribeUser();
        unsubscribePending();
      };
    });

    return () => unsubscribe();
  }, [navigate, filter]);

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "approved"
      });
      alert("User approved successfully!");
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user. Please try again.");
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("Are you sure you want to reject this user?")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "rejected"
      });
      alert("User rejected successfully!");
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user. Please try again.");
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const timestamp = date.toDate ? date.toDate() : new Date(date);
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
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
          <button className="admin-nav-item" onClick={() => navigate("/admin/dashboard")}>
            <span className="admin-nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className="admin-nav-item active" onClick={() => navigate("/admin/approvals")}>
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
          <h1 className="admin-title">User Approval</h1>
          <p className="admin-subtitle">Review and approve new user registrations</p>
        </div>

        <div className="admin-approval-card">
          <div className="admin-approval-header">
            <h3 className="admin-approval-title">Pending Approvals ({pendingUsers.length})</h3>
            <div className="admin-filter-buttons">
              <button
                className={`admin-filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`admin-filter-btn ${filter === "citizens" ? "active" : ""}`}
                onClick={() => setFilter("citizens")}
              >
                Citizens
              </button>
              <button
                className={`admin-filter-btn ${filter === "sweepers" ? "active" : ""}`}
                onClick={() => setFilter("sweepers")}
              >
                Sweepers
              </button>
            </div>
          </div>

          <div className="admin-approval-table">
            <div className="admin-table-header">
              <div className="admin-table-col">User</div>
              <div className="admin-table-col">Contact</div>
              <div className="admin-table-col">Role</div>
              <div className="admin-table-col">ID Document</div>
              <div className="admin-table-col">Registered</div>
              <div className="admin-table-col">Actions</div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="admin-no-data">No pending approvals</div>
            ) : (
              pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="admin-table-row">
                  <div className="admin-table-col">
                    <div className="admin-user-cell">
                      <span className="admin-user-icon">{pendingUser.role === "sweeper" ? "💼" : "👤"}</span>
                      <span>{pendingUser.name || pendingUser.username || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="admin-table-col">
                    <div className="admin-contact-cell">
                      <div>{pendingUser.email || "N/A"}</div>
                      {pendingUser.phone && <div>{pendingUser.phone}</div>}
                    </div>
                  </div>
                  <div className="admin-table-col">
                    <span className={`admin-role-badge ${pendingUser.role === "sweeper" ? "sweeper" : "citizen"}`}>
                      {pendingUser.role === "sweeper" ? "Sweeper" : "Citizen"}
                    </span>
                  </div>
                  <div className="admin-table-col">{pendingUser.idDocument || "Aadhaar"}</div>
                  <div className="admin-table-col">{formatTimeAgo(pendingUser.createdAt)}</div>
                  <div className="admin-table-col">
                    <div className="admin-action-buttons">
                      <button
                        className="admin-approve-btn"
                        onClick={() => handleApprove(pendingUser.id)}
                      >
                        <span>✓</span>
                        Approve
                      </button>
                      <button
                        className="admin-reject-btn"
                        onClick={() => handleReject(pendingUser.id)}
                      >
                        <span>✕</span>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
