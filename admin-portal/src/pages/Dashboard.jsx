import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { formatDate } from '../shared/utils';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalReports: 0,
    fakeReports: 0,
    resolvedToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    submitted: 0,
    resolved: 0,
    avgResolutionTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending approvals
        const pendingQuery = query(
          collection(db, 'users'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingCount = pendingSnapshot.size;

        // Fetch total reports
        const reportsQuery = query(collection(db, 'reports'));
        const reportsSnapshot = await getDocs(reportsQuery);
        const allReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalReports = allReports.length;

        // Fetch fake reports
        const fakeReports = allReports.filter(r => r.status === 'fake').length;

        // Fetch resolved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resolvedToday = allReports.filter(r => {
          if (!r.cleanedAt) return false;
          const cleanedDate = r.cleanedAt.toDate ? r.cleanedAt.toDate() : new Date(r.cleanedAt);
          return cleanedDate >= today && r.status === 'verified';
        }).length;

        setStats({
          pendingApprovals: pendingCount,
          totalReports,
          fakeReports,
          resolvedToday
        });

        // Fetch recent activity
        const activityQuery = query(
          collection(db, 'reports'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const activitySnapshot = await getDocs(activityQuery);
        const activities = activitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentActivity(activities);

        // Calculate weekly stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyReports = allReports.filter(r => {
          const reportDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
          return reportDate >= weekAgo;
        });
        const submitted = weeklyReports.length;
        const resolved = weeklyReports.filter(r => r.status === 'verified').length;
        
        setWeeklyStats({
          submitted,
          resolved,
          avgResolutionTime: 4.2 // This would be calculated from actual data
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Overview of municipal garbage reporting system</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orange">📋</div>
            <div className="stat-value">{stats.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-change">+5 today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">📄</div>
            <div className="stat-value">{stats.totalReports}</div>
            <div className="stat-label">Total Reports</div>
            <div className="stat-change">+32 this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">⚠️</div>
            <div className="stat-value">{stats.fakeReports}</div>
            <div className="stat-label">Fake Reports</div>
            <div className="stat-change">{((stats.fakeReports / stats.totalReports) * 100).toFixed(1)}% of total</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div className="stat-value">{stats.resolvedToday}</div>
            <div className="stat-label">Resolved Today</div>
            <div className="stat-change">+12% vs yesterday</div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section-card">
            <div className="section-header">
              <span className="section-icon">🕐</span>
              <h3>Recent Activity</h3>
            </div>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-dot" style={{ backgroundColor: activity.priority === 1 ? '#EF4444' : activity.priority === 2 ? '#F59E0B' : '#10B981' }}></div>
                  <div className="activity-text">
                    <div>New report submitted at {activity.location?.address || 'Location'}</div>
                    <div className="activity-time">{formatDate(activity.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <span className="section-icon">📈</span>
              <h3>Weekly Statistics</h3>
            </div>
            <div className="weekly-stats">
              <div className="weekly-stat-item">
                <div className="weekly-stat-label">Reports Submitted</div>
                <div className="weekly-stat-value">{weeklyStats.submitted}</div>
                <div className="progress-bar">
                  <div className="progress-fill blue" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div className="weekly-stat-item">
                <div className="weekly-stat-label">Reports Resolved</div>
                <div className="weekly-stat-value">{weeklyStats.resolved}</div>
                <div className="progress-bar">
                  <div className="progress-fill green" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="weekly-stat-item">
                <div className="weekly-stat-label">Avg Resolution Time</div>
                <div className="weekly-stat-value">{weeklyStats.avgResolutionTime} hrs</div>
                <div className="progress-bar">
                  <div className="progress-fill orange" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

