import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { calculateDistance, getPriorityColor } from '../shared/utils';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Fetch assigned tasks (including cleaned tasks that can be re-uploaded)
        const q = query(
          collection(db, 'reports'),
          where('assignedSweeper', '==', user.uid),
          where('status', 'in', ['assigned', 'pending', 'cleaned']),
          orderBy('priority', 'asc'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        let tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

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
          tasksData.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        }

        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
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
          <h1>Nearby Tasks</h1>
          <p>Tasks assigned to you</p>
        </div>
        <button className="logout-button" onClick={handleSignOut} title="Sign Out">
          →
        </button>
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
          <div className="no-tasks">No tasks available</div>
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

