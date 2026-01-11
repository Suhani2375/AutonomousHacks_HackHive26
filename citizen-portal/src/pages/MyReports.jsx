import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { formatDate, getStatusColor } from '../shared/utils';
import BottomNav from '../components/BottomNav';
import './MyReports.css';

function MyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('🔍 Setting up real-time listener for user:', user.uid);

    // Set up real-time listener (no index required)
    const q = query(
      collection(db, 'reports'),
      where('citizenId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by createdAt in memory
        reportsData.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                       a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 
                       a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                       b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 
                       b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime; // Descending (newest first)
        });
        
        console.log('✅ Real-time update: Found', reportsData.length, 'reports for user:', user.uid);
        console.log('📋 Report IDs:', reportsData.map(r => r.id.slice(-4)));
        setReports(reportsData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error in real-time listener:', error);
        // Fallback to one-time fetch
        const fetchReports = async () => {
          try {
            const snapshot = await getDocs(q);
            let reportsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            reportsData.sort((a, b) => {
              const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                           a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
              const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                           b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
              return bTime - aTime;
            });
            
            console.log('✅ Fallback fetch found:', reportsData.length, 'reports');
            setReports(reportsData);
          } catch (fetchError) {
            console.error('❌ Fallback fetch failed:', fetchError);
          } finally {
            setLoading(false);
          }
        };
        fetchReports();
      }
    );

    return () => {
      console.log('🧹 Cleaning up real-time listener');
      unsubscribe();
    };
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
            <div 
              key={report.id} 
              className="report-card"
              onClick={() => navigate(`/report/${report.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="report-indicator"
                style={{ backgroundColor: getPriorityColor(report.priority) }}
              />
              <div className="report-content">
                <div className="report-title">
                  Report #{report.id.slice(-4)}
                  {report.classification && (
                    <span className="classification-badge" style={{
                      backgroundColor: report.classification === 'dry' ? '#3B82F6' : 
                                     report.classification === 'wet' ? '#10B981' : 
                                     report.classification === 'mixed' ? '#F59E0B' : '#6B7280',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      marginLeft: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {report.classification}
                    </span>
                  )}
                  {report.level && (
                    <span className="severity-badge" style={{
                      backgroundColor: report.level === 'red' ? '#EF4444' : 
                                     report.level === 'yellow' ? '#F59E0B' : '#10B981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      marginLeft: '8px',
                      textTransform: 'uppercase'
                    }}>
                      {report.level}
                    </span>
                  )}
                </div>
                <div className="report-location">
                  📍 {report.location?.address || 'Location not available'}
                </div>
                <div className="report-meta">
                  <span className="report-date">{formatDate(report.createdAt)}</span>
                  {report.wasteType && <span className="report-waste-type"> • {report.wasteType}</span>}
                  {report.aiConfidence && (
                    <span className="report-confidence"> • AI: {Math.round(report.aiConfidence * 100)}%</span>
                  )}
                </div>
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

