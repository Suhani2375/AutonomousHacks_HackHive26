import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [loginMode, setLoginMode] = useState("user"); // "user" or "sweeper"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!auth) {
      alert("Firebase is not configured. Please update src/firebase.js with your Firebase credentials.");
      return;
    }
    
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user document exists, create if not (matching Firestore structure)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create user document based on login mode
        const role = loginMode === "sweeper" ? "sweeper" : "citizen";
        await setDoc(doc(db, "users", user.uid), {
          createdAt: serverTimestamp(),
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || (loginMode === "sweeper" ? "Sweeper" : "User"),
          points: 0,
          role: role,
          status: "pending",
          totalCleaned: 0,
          totalReports: 0
        });
        
        // Redirect based on role
        if (role === "sweeper") {
          navigate("/sweeper/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Redirect based on role
        const userData = userDoc.data();
        if (userData.role === "admin") {
          navigate("/admin/dashboard");
        } else if (userData.role === "sweeper") {
          navigate("/sweeper/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAdminModal = () => {
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!auth || !db) {
      alert("Firebase is not configured. Please update src/firebase.js with your Firebase credentials.");
      return;
    }

    if (!adminEmail || !adminPassword) {
      alert("Please enter admin email and password.");
      return;
    }

    setAdminLoading(true);

    try {
      // Try to sign in with admin credentials
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;

        // Check if admin user document exists, create/update if needed
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            createdAt: serverTimestamp(),
            email: adminEmail,
            name: "Admin User",
            username: adminEmail.split("@")[0] || "admin",
            points: 0,
            role: "admin",
            status: "approved",
            totalCleaned: 0,
            totalReports: 0
          });
        } else {
          // Ensure role is admin
          await setDoc(doc(db, "users", user.uid), {
            role: "admin",
            status: "approved"
          }, { merge: true });
        }

        closeAdminModal();
        navigate("/admin/dashboard");
      } catch (signInError) {
        // If admin doesn't exist (auth/user-not-found or auth/invalid-credential), try to create admin account
        if (signInError.code === "auth/user-not-found" || signInError.code === "auth/invalid-credential") {
          try {
            // Create admin account
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;
            
            // Create admin user document
            await setDoc(doc(db, "users", user.uid), {
              createdAt: serverTimestamp(),
              email: adminEmail,
              name: "Admin User",
              username: adminEmail.split("@")[0] || "admin",
              points: 0,
              role: "admin",
              status: "approved",
              totalCleaned: 0,
              totalReports: 0
            });

            alert("Admin account created successfully! Redirecting to admin dashboard...");
            closeAdminModal();
            navigate("/admin/dashboard");
          } catch (createError) {
            console.error("Create admin error:", createError);
            if (createError.code === "auth/email-already-in-use") {
              alert(`Admin account already exists but credentials don't match.\n\nPlease:\n1. Check if the email ${adminEmail} exists in Firebase Authentication\n2. Reset the password if needed\n3. Or use the correct password to sign in`);
            } else {
              alert(`Failed to create admin account: ${createError.message}`);
            }
          }
        } else if (signInError.code === "auth/wrong-password") {
          alert("Password is incorrect. Please check your password and try again.");
        } else {
          console.error("Sign in error:", signInError);
          alert(`Admin login failed: ${signInError.message}`);
        }
      }
    } catch (error) {
      console.error("Admin login error:", error);
      alert(`Admin login failed: ${error.message}`);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="app-name">CleanCity</h1>
          <p className="app-tagline">Municipal Garbage Reporting</p>
        </div>

        {!auth && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ Firebase not configured. Please update src/firebase.js with your Firebase credentials.
          </div>
        )}

        {/* User/Sweeper Toggle */}
        <div className="login-mode-toggle">
          <button
            type="button"
            className={`login-mode-btn ${loginMode === "user" ? "active" : ""}`}
            onClick={() => {
              setLoginMode("user");
              setEmail("");
              setPassword("");
            }}
          >
            <span className="login-mode-icon">👤</span>
            <span>User</span>
          </button>
          <button
            type="button"
            className={`login-mode-btn ${loginMode === "sweeper" ? "active" : ""}`}
            onClick={() => {
              setLoginMode("sweeper");
              setEmail("");
              setPassword("");
            }}
          >
            <span className="login-mode-icon">🧹</span>
            <span>Sweeper</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{loginMode === "sweeper" ? "Employee ID or Email" : "Email or Phone"}</label>
            <input
              id="email"
              type="text"
              placeholder={loginMode === "sweeper" ? "Enter your employee ID or email" : "Enter your email or phone"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button 
            type="button" 
            className="admin-login-btn" 
            onClick={openAdminModal}
            disabled={loading}
          >
            Sign in as Admin
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '8px' }}>
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'underline'
              }}
            >
              Sign Up here
            </button>
          </div>

          <a href="#" className="forgot-password">Forgot Password?</a>
        </form>

        <p className="footer-text">A Municipal Corporation Initiative</p>
      </div>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="admin-modal-overlay" onClick={closeAdminModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Admin Login</h2>
              <button className="admin-modal-close" onClick={closeAdminModal}>×</button>
            </div>
            <form onSubmit={handleAdminLogin} className="admin-modal-form">
              <div className="form-group">
                <label htmlFor="admin-email">Admin Email</label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="Enter admin email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  disabled={adminLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">Admin Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="admin-password"
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={adminLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    disabled={adminLoading}
                  >
                    {showAdminPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button type="submit" className="admin-modal-submit-btn" disabled={adminLoading}>
                {adminLoading ? "Signing in..." : "Sign In as Admin"}
              </button>

              <button 
                type="button" 
                className="admin-modal-cancel-btn" 
                onClick={closeAdminModal}
                disabled={adminLoading}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
