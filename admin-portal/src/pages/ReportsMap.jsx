import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { getPriorityColor } from '../shared/utils';
import Sidebar from '../components/Sidebar';
import './ReportsMap.css';

function ReportsMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reports'));
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

  const getPriorityCounts = () => {
    const counts = { high: 0, medium: 0, low: 0 };
    reports.forEach(report => {
      if (report.priority === 1) counts.high++;
      else if (report.priority === 2) counts.medium++;
      else counts.low++;
    });
    return counts;
  };

  const getStatusCounts = () => {
    const counts = { pending: 0, assigned: 0, cleaned: 0 };
    reports.forEach(report => {
      if (report.status === 'pending') counts.pending++;
      else if (report.status === 'assigned') counts.assigned++;
      else if (report.status === 'cleaned' || report.status === 'verified') counts.cleaned++;
    });
    return counts;
  };

  const counts = getPriorityCounts();
  const statusCounts = getStatusCounts();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>Reports Map</h1>
          <p>Geographic distribution of garbage reports</p>
        </div>

        <div className="map-container">
          <div className="map-area">
            <div className="map-header">
              <div className="map-label">
                <div>City Overview</div>
                <div className="map-subtitle">Municipality Area</div>
              </div>
            </div>
            <div className="map-grid">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className="map-pin"
                  style={{
                    left: `${20 + (index * 12) % 60}%`,
                    top: `${20 + Math.floor((index * 12) / 60) * 15}%`,
                    color: getPriorityColor(report.priority)
                  }}
                  title={report.location?.address || 'Location'}
                >
                  📍
                </div>
              ))}
            </div>
          </div>

          <div className="map-sidebar">
            <div className="legend-section">
              <h3>Legend</h3>
              <div className="legend-item">
                <span className="legend-pin" style={{ color: '#EF4444' }}>📍</span>
                <div>
                  <div className="legend-label">High Priority</div>
                  <div className="legend-count">{counts.high} reports</div>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-pin" style={{ color: '#F59E0B' }}>📍</span>
                <div>
                  <div className="legend-label">Medium Priority</div>
                  <div className="legend-count">{counts.medium} reports</div>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-pin" style={{ color: '#10B981' }}>📍</span>
                <div>
                  <div className="legend-label">Low Priority</div>
                  <div className="legend-count">{counts.low} reports</div>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h3>Summary</h3>
              <div className="summary-item">
                <div className="summary-label">Total Reports</div>
                <div className="summary-value">{reports.length}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Pending</div>
                <div className="summary-value">{statusCounts.pending}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Assigned</div>
                <div className="summary-value">{statusCounts.assigned}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Cleaned</div>
                <div className="summary-value">{statusCounts.cleaned}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsMap;

