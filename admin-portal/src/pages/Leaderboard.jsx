import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import Sidebar from '../components/Sidebar';
import './Leaderboard.css';

function Leaderboard() {
  const [topCitizens, setTopCitizens] = useState([]);
  const [topSweepers, setTopSweepers] = useState([]);
  const [activeTab, setActiveTab] = useState('citizens');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch top citizens
      const citizensQuery = query(
        collection(db, 'users'),
        where('role', '==', 'citizen'),
        orderBy('points', 'desc'),
        limit(10)
      );
      const citizensSnapshot = await getDocs(citizensQuery);
      const citizens = citizensSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data()
      }));
      setTopCitizens(citizens);

      // Fetch top sweepers
      const sweepersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'sweeper'),
        orderBy('points', 'desc'),
        limit(10)
      );
      const sweepersSnapshot = await getDocs(sweepersQuery);
      const sweepers = sweepersSnapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data()
      }));
      setTopSweepers(sweepers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return '#FCD34D';
    if (rank === 2) return '#E5E7EB';
    if (rank === 3) return '#F97316';
    return 'transparent';
  };

  const currentList = activeTab === 'citizens' ? topCitizens : topSweepers;
  const top3 = currentList.slice(0, 3);
  const rest = currentList.slice(3);

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
        <div className="page-header">
          <h1>Leaderboard</h1>
          <p>Top performing citizens and sweepers by zone</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'citizens' ? 'active' : ''}`}
            onClick={() => setActiveTab('citizens')}
          >
            <span>👤</span> Top Citizens
          </button>
          <button
            className={`tab ${activeTab === 'sweepers' ? 'active' : ''}`}
            onClick={() => setActiveTab('sweepers')}
          >
            <span>💼</span> Top Sweepers
          </button>
        </div>

        {top3.length > 0 && (
          <div className="top-three">
            {top3[1] && (
              <div className="top-card second">
                <div className="medal-icon" style={{ color: getMedalColor(2) }}>🥈</div>
                <div className="top-avatar">{top3[1].name?.[0] || 'U'}</div>
                <div className="top-name">{top3[1].name || 'User'}</div>
                <div className="top-zone">{top3[1].zone || 'Zone'}</div>
                <div className="top-score">{top3[1].points?.toLocaleString() || 0}</div>
                <div className="top-reports">{top3[1].reportsCount || 0} reports submitted</div>
              </div>
            )}
            {top3[0] && (
              <div className="top-card first">
                <div className="medal-icon" style={{ color: getMedalColor(1) }}>🥇</div>
                <div className="top-avatar">{top3[0].name?.[0] || 'U'}</div>
                <div className="top-name">{top3[0].name || 'User'}</div>
                <div className="top-zone">{top3[0].zone || 'Zone'}</div>
                <div className="top-score">{top3[0].points?.toLocaleString() || 0}</div>
                <div className="top-reports">{top3[0].reportsCount || 0} reports submitted</div>
              </div>
            )}
            {top3[2] && (
              <div className="top-card third">
                <div className="medal-icon" style={{ color: getMedalColor(3) }}>🥉</div>
                <div className="top-avatar">{top3[2].name?.[0] || 'U'}</div>
                <div className="top-name">{top3[2].name || 'User'}</div>
                <div className="top-zone">{top3[2].zone || 'Zone'}</div>
                <div className="top-score">{top3[2].points?.toLocaleString() || 0}</div>
                <div className="top-reports">{top3[2].reportsCount || 0} reports submitted</div>
              </div>
            )}
          </div>
        )}

        <div className="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Zone</th>
                <th>Reports</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((user) => (
                <tr key={user.id}>
                  <td>{getRankIcon(user.rank)}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">{user.name?.[0] || 'U'}</div>
                      <span>{user.name || 'User'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="zone-badge">{user.zone || 'Zone'}</span>
                  </td>
                  <td>{user.reportsCount || 0}</td>
                  <td className="points-cell">{user.points?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;

