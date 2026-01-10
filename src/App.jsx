import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Leaderboard from "./pages/Leaderboard";
import Report from "./pages/Report";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserApproval from "./pages/AdminUserApproval";
import AdminReportsMap from "./pages/AdminReportsMap";
import AdminLeaderboard from "./pages/AdminLeaderboard";
import SweeperDashboard from "./pages/SweeperDashboard";
import SweeperTaskDetail from "./pages/SweeperTaskDetail";
import SweeperCamera from "./pages/SweeperCamera";
import SweeperCaptureClean from "./pages/SweeperCaptureClean";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "citizen");
          } else {
            setUserRole("citizen");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("citizen");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return "/";
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "sweeper") return "/sweeper/dashboard";
    return "/dashboard";
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to={getDefaultRoute()} /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to={getDefaultRoute()} /> : <Register />}
        />
        {/* Citizen Routes */}
        <Route
          path="/dashboard"
          element={user && userRole === "citizen" ? <Dashboard /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/reports"
          element={user && userRole === "citizen" ? <Reports /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/leaderboard"
          element={user && userRole === "citizen" ? <Leaderboard /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/report"
          element={user && userRole === "citizen" ? <Report /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={user && userRole === "admin" ? <AdminDashboard /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/approvals"
          element={user && userRole === "admin" ? <AdminUserApproval /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/map"
          element={user && userRole === "admin" ? <AdminReportsMap /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/leaderboard"
          element={user && userRole === "admin" ? <AdminLeaderboard /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        {/* Sweeper Routes */}
        <Route
          path="/sweeper/dashboard"
          element={user && userRole === "sweeper" ? <SweeperDashboard /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/sweeper/task/:taskId"
          element={user && userRole === "sweeper" ? <SweeperTaskDetail /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/sweeper/camera/:taskId"
          element={user && userRole === "sweeper" ? <SweeperCamera /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
        <Route
          path="/sweeper/capture-clean/:taskId"
          element={user && userRole === "sweeper" ? <SweeperCaptureClean /> : user ? <Navigate to={getDefaultRoute()} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
