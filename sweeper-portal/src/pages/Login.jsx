import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../shared/firebase-config';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  // Helper function to get email from employee ID or email input
  const getEmail = (input) => {
    // If input contains @, it's already an email
    if (input.includes('@')) {
      return input;
    }
    // Otherwise, treat it as employee ID
    return `${input}@municipality.gov`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const email = getEmail(employeeId);
      
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          name: name || employeeId,
          role: 'sweeper',
          points: 0,
          status: 'pending', // New users need admin approval
          createdAt: new Date(),
          totalReports: 0,
          totalCleaned: 0
        });
        setError('');
        alert('Account created! Please wait for admin approval before logging in.');
        setIsSignUp(false);
        setEmployeeId('');
        setPassword('');
        setName('');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'sweeper') {
          await auth.signOut();
          throw new Error('Invalid sweeper credentials');
        }
        const userData = userDoc.data();
        if (userData.status !== 'approved') {
          await auth.signOut();
          throw new Error('Your account is pending approval. Please wait for admin approval.');
        }
        
        navigate('/dashboard');
      }
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
    
    if (!employeeId) {
      setError('Please enter your Employee ID or Email first');
      return;
    }

    try {
      const email = getEmail(employeeId);
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
          <div className="logo-icon">🗑️</div>
          <h1>NeuroClean</h1>
          <p>Sweeper Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {isSignUp && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label>Employee ID or Email</label>
            <input
              type="text"
              placeholder="Enter Employee ID or Email"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              You can use Employee ID (e.g., "emp123") or full email
            </small>
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
                  autoComplete={isSignUp ? "new-password" : "current-password"}
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
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          )}
        </form>

        <div className="login-links">
          {!isSignUp && !showForgotPassword && (
            <a 
              href="#" 
              className="forgot-password"
              onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}
            >
              Forgot Password?
            </a>
          )}
          <div className="toggle-signup">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }}>
                  Sign In
                </a>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }}>
                  Sign Up
                </a>
              </span>
            )}
          </div>
          <div className="other-links">
            <a href="http://localhost:8080" className="back-to-main">← Back to Main Page</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

