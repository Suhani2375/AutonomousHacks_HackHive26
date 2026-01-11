import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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
    // Get user location with proper permission handling
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log('Location obtained:', location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Show notification to user
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location permission denied. Please enable location access in your browser settings to see nearby tasks sorted by distance.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert('Location unavailable. Please check your GPS settings.');
          } else {
            alert('Unable to get your location. Tasks will still be shown but not sorted by distance.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }

    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Fetch assigned tasks - FIXED: Remove double orderBy to avoid index requirement
        // Sort in memory instead
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

        // Sort by priority first, then by createdAt
        tasksData.sort((a, b) => {
          const priorityDiff = (a.priority || 3) - (b.priority || 3);
          if (priorityDiff !== 0) return priorityDiff;
          
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                       a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                       b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bTime - aTime; // Newest first
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
          // Re-sort by distance if location is available
          tasksData.sort((a, b) => {
            // First by priority
            const priorityDiff = (a.priority || 3) - (b.priority || 3);
            if (priorityDiff !== 0) return priorityDiff;
            // Then by distance
            return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
          });
        }

        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Error loading tasks. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Set up real-time listener for new tasks
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, 'reports'),
        where('assignedSweeper', '==', user.uid),
        where('status', 'in', ['assigned', 'pending', 'cleaned'])
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by priority first, then by createdAt
        tasksData.sort((a, b) => {
          const priorityDiff = (a.priority || 3) - (b.priority || 3);
          if (priorityDiff !== 0) return priorityDiff;
          
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                       a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                       b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bTime - aTime;
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
          tasksData.sort((a, b) => {
            const priorityDiff = (a.priority || 3) - (b.priority || 3);
            if (priorityDiff !== 0) return priorityDiff;
            return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
          });
        }

        setTasks(tasksData);
        setLoading(false);
      }, (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
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

