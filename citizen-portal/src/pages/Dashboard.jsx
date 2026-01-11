import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
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
        // Fetch user document
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setPoints(data.points || 0);
          console.log('✅ User data loaded, points:', data.points || 0);
        } else {
          // If user doc doesn't exist, create it
          console.log('⚠️ User document not found, will be created on first report');
        }

        // Fetch reports count
        const reportsQuery = query(collection(db, 'reports'), where('citizenId', '==', currentUser.uid));
        const reportsSnapshot = await getDocs(reportsQuery);
        setReportsCount(reportsSnapshot.size);

        // Fetch recent activity with real-time updates
        const recentQuery = query(
          collection(db, 'reports'),
          where('citizenId', '==', currentUser.uid)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const activities = recentSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) || 0;
            const bTime = b.createdAt?.toMillis() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) || 0;
            return bTime - aTime;
          })
          .slice(0, 3);
        setRecentActivity(activities);
        console.log('✅ Recent activity loaded:', activities.length, 'items');
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      }
    };

    fetchUserData();
    
    // Set up real-time listener for user points updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid), 
      (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          const newPoints = data.points || 0;
          console.log('🔄 Points updated in real-time:', newPoints);
          setPoints(newPoints);
          setUserData(data);
        }
      },
      (error) => {
        console.error('❌ Error in real-time listener:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
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
                    {activity.classification && (
                      <span className="activity-classification" style={{
                        backgroundColor: activity.classification === 'dry' ? '#3B82F6' : 
                                       activity.classification === 'wet' ? '#10B981' : 
                                       activity.classification === 'mixed' ? '#F59E0B' : '#6B7280',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        marginLeft: '8px',
                        textTransform: 'uppercase'
                      }}>
                        {activity.classification}
                      </span>
                    )}
                    {activity.level && (
                      <span className="activity-severity" style={{
                        backgroundColor: activity.level === 'red' ? '#EF4444' : 
                                       activity.level === 'yellow' ? '#F59E0B' : '#10B981',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        marginLeft: '8px',
                        textTransform: 'uppercase'
                      }}>
                        {activity.level}
                      </span>
                    )}
                  </div>
                  <div className="activity-details">
                    {activity.location?.address || 'Location not available'} • {formatDate(activity.createdAt)}
                    {activity.wasteType && ` • ${activity.wasteType}`}
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

