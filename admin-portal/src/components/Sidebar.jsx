import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../shared/firebase-config';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/reports', icon: '📋', label: 'Reports' },
    { path: '/approval', icon: '👥', label: 'User Approval' },
    { path: '/map', icon: '🗺️', label: 'Reports Map' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">🛡️</div>
        <div className="logo-text">
          <div className="logo-title">NeuroClean</div>
          <div className="logo-subtitle">Admin Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">A</div>
          <div className="user-details">
            <div className="user-name">Admin User</div>
            <div className="user-email">admin@municipality.gov</div>
          </div>
        </div>
        <button className="signout-button" onClick={handleSignOut}>
          <span>→</span> Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

