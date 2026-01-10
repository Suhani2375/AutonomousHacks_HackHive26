import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // For admin login, we'll use email format: adminId@municipality.gov
      const email = `${adminId}@municipality.gov`;
      await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        await auth.signOut();
        throw new Error('Invalid admin credentials');
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!adminId) {
      setError('Please enter your Admin ID first');
      return;
    }

    try {
      const email = `${adminId}@municipality.gov`;
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Municipality Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label>Admin ID</label>
            <input
              type="text"
              placeholder="Enter your admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
            />
          </div>

          {!showForgotPassword && (
            <div className="form-group">
              <label>Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {showForgotPassword ? (
            <div>
              <button type="button" onClick={handleForgotPassword} className="signin-button">
                Send Reset Email
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }} 
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          )}
        </form>

        <div className="login-links">
          {!showForgotPassword && (
            <a 
              href="#" 
              className="forgot-password"
              onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}
            >
              Forgot Password?
            </a>
          )}
          <a href="http://localhost:8080" className="back-link">← Back to Main Page</a>
        </div>

        <div className="disclaimer">
          Municipality Corporation - Authorized Access Only
        </div>
      </div>
    </div>
  );
}

export default Login;

