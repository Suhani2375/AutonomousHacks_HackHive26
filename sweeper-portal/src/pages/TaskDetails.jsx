import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { formatDate, getPriorityColor } from '../shared/utils';
import './TaskDetails.css';

function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = await getDoc(doc(db, 'reports', taskId));
        if (taskDoc.exists()) {
          setTask({ id: taskDoc.id, ...taskDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleNavigate = () => {
    // Open maps with location
    if (task?.location?.lat && task?.location?.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${task.location.lat},${task.location.lng}`,
        '_blank'
      );
    }
  };

  const handleCleanNow = async () => {
    // Check if task is already cleaned
    if (task.status === 'cleaned' || task.status === 'verified') {
      // Allow uploading another photo if already cleaned
      navigate(`/camera/${taskId}`);
    } else {
      // First time cleaning
      navigate(`/camera/${taskId}`);
    }
  };

  if (loading) {
    return (
      <div className="task-details-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-details-container">
        <div className="error">Task not found</div>
      </div>
    );
  }

  return (
    <div className="task-details-container">
      <div className="task-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
        <div
          className="priority-badge"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'} Priority
        </div>
      </div>

      <div className="task-info">
        <div className="info-row">
          <span className="info-label">Status:</span>
          <span className={`status-badge status-${task.status || 'assigned'}`}>
            {task.status === 'verified' ? '✅ Verified & Credits Awarded' : 
             task.status === 'cleaned' ? '🧹 Cleaned (Verifying...)' : 
             task.status === 'assigned' ? '📋 Assigned' : task.status || 'Assigned'}
          </span>
        </div>
        {task.status === 'verified' && (
          <div className="info-row credits-row">
            <span className="info-label">Credits:</span>
            <span className="credits-awarded">
              🎁 +2 credits awarded to you and the citizen!
            </span>
          </div>
        )}
        {task.cleaningQuality && (
          <div className="info-row">
            <span className="info-label">Cleaning Quality:</span>
            <span className={`quality-badge quality-${task.cleaningQuality?.toLowerCase() || 'good'}`}>
              {task.cleaningQuality || 'Good'}
            </span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Classification:</span>
          <span className={`classification-badge classification-${(task.classification || task.aiAnalysisDetails?.classification || 'unknown').toLowerCase()}`}>
            {(task.classification || task.aiAnalysisDetails?.classification || 'Unknown').toUpperCase()}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Waste Type:</span>
          <span className="info-value">{task.wasteType || task.aiAnalysisDetails?.wasteType || 'Unknown'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Severity:</span>
          <span className={`severity-badge severity-${(task.level || task.aiAnalysisDetails?.severity || 'green').toLowerCase()}`}>
            {task.level || task.aiAnalysisDetails?.severity || 'green'}
          </span>
        </div>
      </div>

      {task.imageBefore && (
        <div className="task-image-container">
          <img src={task.imageBefore} alt="Report" className="task-image" />
        </div>
      )}

      <div className="task-info">
        <div className="task-location">
          <h2>{task.location?.address || 'MG Road Junction'}</h2>
          <div className="location-details">
            <span>📍 {task.location?.address || 'Near City Mall, MG Road'}</span>
            <span>• Reported {formatDate(task.createdAt)}</span>
            {task.distance && <span>• {task.distance} km away</span>}
          </div>
        </div>

        <div className="task-actions">
          <button className="navigate-button" onClick={handleNavigate}>
            <span>✈️</span> Navigate
          </button>
          <button className="clean-button" onClick={handleCleanNow}>
            <span>✓</span> {task.status === 'cleaned' || task.status === 'verified' ? 'Upload Photo Again' : 'Clean Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;

