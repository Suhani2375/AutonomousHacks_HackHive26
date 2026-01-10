import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../shared/firebase-config';
import { formatDate } from '../shared/utils';
import Sidebar from '../components/Sidebar';
import './UserApproval.css';

function UserApproval() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      let q;
      if (filter === 'all') {
        q = query(collection(db, 'users'), where('status', '==', 'pending'));
      } else {
        q = query(
          collection(db, 'users'),
          where('status', '==', 'pending'),
          where('role', '==', filter === 'citizens' ? 'citizen' : 'sweeper')
        );
      }

      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved',
        approvedAt: new Date()
      });
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <div className="page-header">
          <h1>User Approval</h1>
          <p>Review and approve new user registrations</p>
        </div>

        <div className="approval-card">
          <div className="card-header">
            <h3>Pending Approvals ({users.length})</h3>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'citizens' ? 'active' : ''}`}
                onClick={() => setFilter('citizens')}
              >
                Citizens
              </button>
              <button
                className={`filter-btn ${filter === 'sweepers' ? 'active' : ''}`}
                onClick={() => setFilter('sweepers')}
              >
                Sweepers
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : users.length === 0 ? (
            <div className="no-users">No pending approvals</div>
          ) : (
            <table className="approval-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>ID Document</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-icon">{user.role === 'sweeper' ? '💼' : '👤'}</span>
                        <span>{user.name || user.email?.split('@')[0] || 'User'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div>{user.email}</div>
                        {user.phone && <div>{user.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'sweeper' ? 'Sweeper' : 'Citizen'}
                      </span>
                    </td>
                    <td>{user.idDocument || 'N/A'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(user.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleReject(user.id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserApproval;

