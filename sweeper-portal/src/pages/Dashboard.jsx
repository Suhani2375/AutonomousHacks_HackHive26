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
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Get user location with proper notification
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationError(null);
          console.log('Location obtained:', location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied. Please enable location permissions to see nearby tasks.');
          // Show notification to user
          alert('⚠️ Location access is required to show nearby tasks sorted by distance. Please enable location permissions in your browser settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // Fetch assigned tasks - simplified query to avoid index issues
        // First get all assigned tasks
        const q1 = query(
          collection(db, 'reports'),
          where('assignedSweeper', '==', user.uid),
          where('status', '==', 'assigned')
        );
        
        // Get cleaned tasks separately
        const q2 = query(
          collection(db, 'reports'),
          where('assignedSweeper', '==', user.uid),
          where('status', '==', 'cleaned')
        );

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        let tasksData = [
          ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ];

        // Sort by priority first (in memory)
        tasksData.sort((a, b) => {
          const priorityA = a.priority || 3;
          const priorityB = b.priority || 3;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          // Then by creation date
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                       a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                       b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
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
          // Re-sort by distance if location is available
          tasksData.sort((a, b) => {
            // First by priority
            const priorityA = a.priority || 3;
            const priorityB = b.priority || 3;
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            // Then by distance
            return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
          });
        }

        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Try fallback query without status filter
        try {
          const fallbackQuery = query(
            collection(db, 'reports'),
            where('assignedSweeper', '==', user.uid)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          let fallbackTasks = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Filter in memory
          fallbackTasks = fallbackTasks.filter(task => 
            task.status === 'assigned' || task.status === 'cleaned'
          );
          
          // Sort in memory
          fallbackTasks.sort((a, b) => {
            const priorityA = a.priority || 3;
            const priorityB = b.priority || 3;
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                         a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                         b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
            return dateB - dateA;
          });

          if (userLocation) {
            fallbackTasks = fallbackTasks.map(task => ({
              ...task,
              distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                task.location?.lat || 0,
                task.location?.lng || 0
              )
            }));
            fallbackTasks.sort((a, b) => {
              const priorityA = a.priority || 3;
              const priorityB = b.priority || 3;
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
            });
          }

          setTasks(fallbackTasks);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
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

      {locationError && (
        <div className="location-warning" style={{
          margin: '0 20px 16px',
          padding: '12px 16px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          color: '#92400E',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          <span>{locationError}</span>
        </div>
      )}

      {userLocation && !locationError && (
        <div className="location-success" style={{
          margin: '0 20px 16px',
          padding: '8px 16px',
          backgroundColor: '#D1FAE5',
          border: '1px solid #10B981',
          borderRadius: '8px',
          color: '#065F46',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📍</span>
          <span>Location enabled - Tasks sorted by distance</span>
        </div>
      )}

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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
              No tasks available
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', maxWidth: '300px', margin: '0 auto' }}>
              {tasks.length === 0 
                ? 'You don\'t have any assigned tasks yet. Tasks will appear here when assigned by an admin.'
                : 'No tasks match the selected filter. Try selecting a different priority.'}
            </div>
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

