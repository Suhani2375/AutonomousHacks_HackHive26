import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './shared/firebase-config';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportGarbage from './pages/ReportGarbage';
import MyReports from './pages/MyReports';
import Leaderboard from './pages/Leaderboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      }, (error) => {
        console.error('Auth error:', error);
        setError(error.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('App initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading CleanCity...</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Please wait</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', padding: '20px' }}>
        <div style={{ fontSize: '18px', color: '#ef4444', marginBottom: '10px' }}>Error Loading App</div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/report" element={user ? <ReportGarbage /> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <MyReports /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
