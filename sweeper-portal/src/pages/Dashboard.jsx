import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { calculateDistance, getPriorityColor } from '../shared/utils';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, assigned: 0 });

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch assigned tasks (removed orderBy to avoid index issues)
        const q = query(
          collection(db, 'reports'),
          where('assignedSweeper', '==', user.uid),
          where('status', 'in', ['assigned', 'pending', 'cleaned'])
        );
        const snapshot = await getDocs(q);
        let tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort in memory by priority and date
        tasksData.sort((a, b) => {
          const priorityA = a.priority || 3;
          const priorityB = b.priority || 3;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return dateB - dateA;
        });

        // Calculate distances if location available
        if (userLocation) {
          tasksData = tasksData.map(task => ({
            ...task,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              task.location?.lat || 0,
              task.location?.lng || 0
            )
          }));
          tasksData.sort((a, b) => parseFloat(a.distance || 999) - parseFloat(b.distance || 999));
        }

        setTasks(tasksData);

        // Calculate stats
        const completedCount = tasksData.filter(t => t.status === 'cleaned').length;
        const assignedCount = tasksData.filter(t => t.status === 'assigned' || t.status === 'pending').length;
        setStats({
          total: tasksData.length,
          completed: completedCount,
          assigned: assignedCount
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, userLocation]);

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    const priorityMap = { high: 1, medium: 2, low: 3 };
    return tasks.filter(task => task.priority === priorityMap[filter]);
  };

  const getPriorityLabel = (priority) => {
    if (priority === 1) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {userData?.name || 'Sweeper'}!</h1>
          <p>Your task dashboard</p>
        </div>
        <button className="logout-button" onClick={handleSignOut} title="Sign Out">
          →
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.assigned}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          High
        </button>
        <button
          className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
          onClick={() => setFilter('medium')}
        >
          Medium
        </button>
        <button
          className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
          onClick={() => setFilter('low')}
        >
          Low
        </button>
      </div>

      <div className="tasks-list">
        {getFilteredTasks().length === 0 ? (
          <div className="no-tasks">
            <div className="no-tasks-icon">🧹</div>
            <h2>No Tasks Available</h2>
            <p>You don't have any {filter !== 'all' ? filter : ''} tasks assigned right now.</p>
            <p className="no-tasks-hint">Tasks will appear here once they are assigned to you by the admin.</p>
          </div>
        ) : (
          getFilteredTasks().map((task) => (
            <div
              key={task.id}
              className="task-card"
              onClick={() => navigate(`/task/${task.id}`)}
            >
              <div
                className="task-indicator"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
              <div className="task-content">
                <div className="task-title">{task.location?.address || 'Location'}</div>
                <div className="task-details">
                  <span>📍 {task.location?.address || 'Unknown'}</span>
                  {task.distance && <span>• {task.distance} km away</span>}
                </div>
                <div className="task-meta">
                  <span className="task-priority" style={{ color: getPriorityColor(task.priority) }}>
                    {getPriorityLabel(task.priority)} Priority
                  </span>
                  <span className="task-status" style={{ 
                    color: task.status === 'cleaned' ? '#10B981' : '#3B82F6',
                    fontSize: '12px'
                  }}>
                    {task.status === 'cleaned' ? '✓ Completed' : '● Active'}
                  </span>
                </div>
              </div>
              <div
                className="task-badge"
                style={{
                  backgroundColor: getPriorityColor(task.priority) + '20',
                  color: getPriorityColor(task.priority)
                }}
              >
                {getPriorityLabel(task.priority)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;

