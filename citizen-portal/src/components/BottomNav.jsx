import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <div className="nav-icon">🏠</div>
        <div className="nav-label">Home</div>
      </button>
      <button
        className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
        onClick={() => navigate('/reports')}
      >
        <div className="nav-icon">📄</div>
        <div className="nav-label">Reports</div>
      </button>
      <button
        className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
        onClick={() => navigate('/leaderboard')}
      >
        <div className="nav-icon">🏆</div>
        <div className="nav-label">Leaderboard</div>
      </button>
    </div>
  );
}

export default BottomNav;

