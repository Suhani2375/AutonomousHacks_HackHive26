import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { formatDate, getStatusColor } from '../shared/utils';
import BottomNav from '../components/BottomNav';
import './MyReports.css';

function MyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const q = query(
          collection(db, 'reports'),
          where('citizenId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const getPriorityColor = (priority) => {
    if (priority === 1) return '#EF4444';
    if (priority === 2) return '#F59E0B';
    return '#10B981';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      assigned: 'Assigned',
      cleaned: 'Cleaned',
      verified: 'Verified',
      fake: 'Fake'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="reports-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
          <h1>My Reports</h1>
        </div>
        <div className="loading">Loading...</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
        <h1>My Reports</h1>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="no-reports">No reports yet</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="report-card">
              <div
                className="report-indicator"
                style={{ backgroundColor: getPriorityColor(report.priority) }}
              />
              <div className="report-content">
                <div className="report-title">Report #{report.id.slice(-4)}</div>
                <div className="report-location">
                  📍 {report.location?.address || 'Location not available'}
                </div>
                <div className="report-date">{formatDate(report.createdAt)}</div>
              </div>
              <div
                className="report-status"
                style={{ backgroundColor: getStatusColor(report.status) + '20', color: getStatusColor(report.status) }}
              >
                {getStatusLabel(report.status)}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default MyReports;

