import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { formatDate } from '../shared/utils';
import BottomNav from '../components/BottomNav';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setPoints(data.points || 0);
        }

        // Fetch reports count
        const reportsQuery = query(collection(db, 'reports'), where('citizenId', '==', currentUser.uid));
        const reportsSnapshot = await getDocs(reportsQuery);
        setReportsCount(reportsSnapshot.size);

        // Fetch recent activity
        const recentQuery = query(
          collection(db, 'reports'),
          where('citizenId', '==', currentUser.uid)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const activities = recentSnapshot.docs
          .slice(0, 3)
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserName = () => {
    if (userData?.name) return userData.name;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div>
            <div className="welcome-text">Welcome back</div>
            <div className="user-name">{getUserName()}</div>
          </div>
        </div>
        <button className="logout-button" onClick={handleSignOut}>→</button>
      </div>

      <button className="report-button" onClick={() => navigate('/report')}>
        <div className="camera-icon">📷</div>
        <div>Report Garbage</div>
      </button>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon reports-icon">📄</div>
          <div className="stat-value">{reportsCount}</div>
          <div className="stat-label">My Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon points-icon">🏆</div>
          <div className="stat-value">{points.toLocaleString()}</div>
          <div className="stat-label">My Points</div>
        </div>
      </div>

      <div className="recent-activity">
        <div className="section-title">RECENT ACTIVITY</div>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <div className="activity-title">
                    Report #{activity.id.slice(-4)} {activity.status === 'verified' ? 'Cleaned' : activity.status}
                  </div>
                  <div className="activity-details">
                    {activity.location?.address || 'Location not available'} • {formatDate(activity.createdAt)}
                  </div>
                </div>
                {activity.status === 'verified' && (
                  <div className="activity-points">+50 pts</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-activity">No recent activity</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Dashboard;

