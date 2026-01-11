import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { getPriorityColor, formatDate, calculateDistance } from '../shared/utils';
import Sidebar from '../components/Sidebar';
import './Reports.css';

function Reports() {
  const [reports, setReports] = useState([]);
  const [sweepers, setSweepers] = useState([]);
  const [filter, setFilter] = useState('assigned'); // assigned, pending, all
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchSweepers();
  }, []);

  const fetchSweepers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'sweeper'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      const sweepersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSweepers(sweepersData);
    } catch (error) {
      console.error('Error fetching sweepers:', error);
    }
  };

  const fetchReports = async () => {
    try {
      let q;
      if (filter === 'all') {
        q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      } else if (filter === 'pending') {
        q = query(
          collection(db, 'reports'),
          where('status', '==', 'assigned'),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'reports'),
          where('status', 'in', ['assigned', 'pending']),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
      
      // LOCATION INTELLIGENCE: Group nearby reports
      const groups = groupReportsByLocation(reportsData);
      setGroupedReports(groups);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Group reports by location (within 100m)
  const groupReportsByLocation = (reportsList) => {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < reportsList.length; i++) {
      if (processed.has(reportsList[i].id)) continue;
      
      const group = [reportsList[i]];
      processed.add(reportsList[i].id);
      
      for (let j = i + 1; j < reportsList.length; j++) {
        if (processed.has(reportsList[j].id)) continue;
        
        if (reportsList[i].location && reportsList[j].location) {
          const distance = calculateDistance(
            reportsList[i].location.lat,
            reportsList[i].location.lng,
            reportsList[j].location.lat,
            reportsList[j].location.lng
          );
          
          // If within 100 meters, add to same group
          if (distance <= 0.1) { // 100 meters = 0.1 km
            group.push(reportsList[j]);
            processed.add(reportsList[j].id);
          }
        }
      }
      
      if (group.length > 1) {
        groups.push({
          reports: group,
          totalReports: group.length,
          highestPriority: Math.min(...group.map(r => r.priority || 3)),
          centerLocation: {
            lat: group.reduce((sum, r) => sum + (r.location?.lat || 0), 0) / group.length,
            lng: group.reduce((sum, r) => sum + (r.location?.lng || 0), 0) / group.length
          }
        });
      }
    }
    
    return groups;
  };

  const handleAssignSweeper = async (reportId, sweeperId) => {
    setAssigning(reportId);
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        assignedSweeper: sweeperId,
        status: 'assigned',
        assignedAt: new Date()
      });
      alert('Sweeper assigned successfully!');
      fetchReports();
    } catch (error) {
      console.error('Error assigning sweeper:', error);
      alert('Failed to assign sweeper. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  const getClassificationBadge = (classification) => {
    if (!classification || classification === 'none' || classification === 'unknown') {
      return <span className="badge badge-gray">Unknown</span>;
    }
    const colors = {
      dry: '#3B82F6', // blue
      wet: '#10B981', // green
      mixed: '#F59E0B' // orange
    };
    return (
      <span className="badge" style={{ backgroundColor: colors[classification.toLowerCase()] || '#6B7280' }}>
        {classification.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="loading">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Reports Management</h1>
          <p>Assign sweepers to garbage reports</p>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === 'assigned' ? 'active' : ''}
            onClick={() => setFilter('assigned')}
          >
            Assigned ({reports.filter(r => r.status === 'assigned' && r.assignedSweeper).length})
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending Assignment ({reports.filter(r => r.status === 'assigned' && !r.assignedSweeper).length})
          </button>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Reports ({reports.length})
          </button>
        </div>

        <div className="reports-list">
          {reports.length === 0 ? (
            <div className="empty-state">
              <p>No reports found</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div className="report-priority">
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: getPriorityColor(report.priority) }}
                    ></span>
                    <span className="priority-text">
                      {report.priority === 1 ? 'High' : report.priority === 2 ? 'Medium' : 'Low'} Priority
                    </span>
                  </div>
                  <div className="report-status">
                    <span className={`status-badge status-${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="report-body">
                  <div className="report-image">
                    {report.imageBefore && (
                      <img src={report.imageBefore} alt="Waste report" />
                    )}
                  </div>

                  <div className="report-details">
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {report.location?.address || 'Unknown Location'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Classification:</span>
                      <span className="detail-value">
                        {getClassificationBadge(report.classification || report.aiAnalysisDetails?.classification)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Waste Type:</span>
                      <span className="detail-value">
                        {report.wasteType || report.aiAnalysisDetails?.wasteType || 'Unknown'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Severity:</span>
                      <span className="detail-value">
                        <span className={`severity-badge severity-${report.level || report.aiAnalysisDetails?.severity || 'green'}`}>
                          {report.level || report.aiAnalysisDetails?.severity || 'green'}
                        </span>
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">AI Confidence:</span>
                      <span className="detail-value">
                        {((report.aiConfidence || report.aiAnalysisDetails?.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Reported:</span>
                      <span className="detail-value">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    {report.assignedSweeper && (
                      <div className="detail-row">
                        <span className="detail-label">Assigned To:</span>
                        <span className="detail-value">
                          {sweepers.find(s => s.id === report.assignedSweeper)?.name || 'Unknown Sweeper'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!report.assignedSweeper && report.status === 'assigned' && (
                  <div className="report-actions">
                    <label htmlFor={`sweeper-${report.id}`}>Assign Sweeper:</label>
                    <select
                      id={`sweeper-${report.id}`}
                      onChange={(e) => handleAssignSweeper(report.id, e.target.value)}
                      disabled={assigning === report.id}
                      defaultValue=""
                    >
                      <option value="">Select sweeper...</option>
                      {sweepers.map((sweeper) => (
                        <option key={sweeper.id} value={sweeper.id}>
                          {sweeper.name} ({sweeper.employeeId || sweeper.email})
                        </option>
                      ))}
                    </select>
                    {assigning === report.id && <span className="assigning">Assigning...</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;

