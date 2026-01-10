import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import BottomNav from '../components/BottomNav';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('points', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          rank: index + 1,
          ...doc.data()
        }));
        setTopUsers(users);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

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

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
          <h1>Leaderboard</h1>
        </div>
        <div className="loading">Loading...</div>
        <BottomNav />
      </div>
    );
  }

  const top3 = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
        <h1>Leaderboard</h1>
      </div>

      {top3.length > 0 && (
        <div className="top-three">
          {top3[1] && (
            <div className="top-card second">
              <div className="medal-icon" style={{ color: getMedalColor(2) }}>🥈</div>
              <div className="top-avatar">{top3[1].name?.[0] || 'U'}</div>
              <div className="top-name">{top3[1].name || 'User'}</div>
              <div className="top-score">{top3[1].points?.toLocaleString() || 0}</div>
            </div>
          )}
          {top3[0] && (
            <div className="top-card first">
              <div className="medal-icon" style={{ color: getMedalColor(1) }}>🥇</div>
              <div className="top-avatar">{top3[0].name?.[0] || 'U'}</div>
              <div className="top-name">{top3[0].name || 'User'}</div>
              <div className="top-score">{top3[0].points?.toLocaleString() || 0}</div>
            </div>
          )}
          {top3[2] && (
            <div className="top-card third">
              <div className="medal-icon" style={{ color: getMedalColor(3) }}>🥉</div>
              <div className="top-avatar">{top3[2].name?.[0] || 'U'}</div>
              <div className="top-name">{top3[2].name || 'User'}</div>
              <div className="top-score">{top3[2].points?.toLocaleString() || 0}</div>
            </div>
          )}
        </div>
      )}

      <div className="leaderboard-list">
        {rest.map((user) => (
          <div key={user.id} className="leaderboard-item">
            <div className="rank">{getRankIcon(user.rank)}</div>
            <div className="user-avatar-small">{user.name?.[0] || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user.name || 'User'}</div>
            </div>
            <div className="user-score">{user.points?.toLocaleString() || 0}</div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

export default Leaderboard;

