import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export default function Register() {
  const [registerMode, setRegisterMode] = useState("user"); // "user" or "sweeper"
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Validate password strength
  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least 1 uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least 1 lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least 1 number";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return "Password must contain at least 1 special character";
    }
    return "";
  };

  // Check username uniqueness
  const checkUsernameUnique = async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.trim() === "") {
      return false;
    }
    try {
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", usernameToCheck.toLowerCase().trim())
      );
      const snapshot = await getDocs(usernameQuery);
      return snapshot.empty; // Returns true if username is available
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!auth) {
      alert("Firebase is not configured. Please update src/firebase.js with your Firebase credentials.");
      return;
    }

    // Validate username
    if (!username || username.trim() === "") {
      setUsernameError("Username is required");
      return;
    }

    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // Check username uniqueness
    const isUsernameUnique = await checkUsernameUnique(username);
    if (!isUsernameUnique) {
      setUsernameError("Username is already taken. Please choose another.");
      return;
    }
    setUsernameError("");

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match!");
      return;
    }

    setPasswordError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: name
      });

      // Determine role based on registration mode
      const role = registerMode === "sweeper" ? "sweeper" : "citizen";
      
      console.log(`Registering as: ${role}`); // Debug log

      // Create user document in Firestore with exact structure
      await setDoc(doc(db, "users", user.uid), {
        createdAt: serverTimestamp(),
        email: user.email,
        name: name,
        username: username.toLowerCase().trim(),
        points: 0,
        role: role, // Set role as "citizen" or "sweeper"
        status: "pending",
        totalCleaned: 0,
        totalReports: 0
      });

      console.log(`User registered successfully with role: ${role}`); // Debug log

      // Redirect based on role
      if (role === "sweeper") {
        navigate("/sweeper/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. ";
      if (error.code === "auth/email-already-in-use") {
        errorMessage += "Email is already registered. Please sign in instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage += "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage += "Password is too weak.";
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
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
            className={`login-mode-btn ${registerMode === "user" ? "active" : ""}`}
            onClick={() => {
              setRegisterMode("user");
              setName("");
              setUsername("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setUsernameError("");
              setPasswordError("");
            }}
          >
            <span className="login-mode-icon">👤</span>
            <span>Citizen</span>
          </button>
          <button
            type="button"
            className={`login-mode-btn ${registerMode === "sweeper" ? "active" : ""}`}
            onClick={() => {
              setRegisterMode("sweeper");
              setName("");
              setUsername("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setUsernameError("");
              setPasswordError("");
            }}
          >
            <span className="login-mode-icon">🧹</span>
            <span>Sweeper</span>
          </button>
        </div>
        
        {/* Role Indicator */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          background: registerMode === "sweeper" ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `2px solid ${registerMode === "sweeper" ? '#f59e0b' : 'var(--primary)'}`
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            color: registerMode === "sweeper" ? '#f59e0b' : 'var(--primary)',
            margin: 0
          }}>
            Registering as: <strong>{registerMode === "sweeper" ? "Sweeper" : "Citizen"}</strong>
          </p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">{registerMode === "sweeper" ? "Employee ID or Username" : "Username"}</label>
            <input
              id="username"
              type="text"
              placeholder={registerMode === "sweeper" ? "Enter your employee ID or choose a username" : "Choose a username (min 3 characters)"}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError("");
              }}
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
            />
            {usernameError && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px'
              }}>
                {usernameError}
              </div>
            )}
            {!usernameError && registerMode === "user" && (
              <div style={{
                color: 'var(--text-light)',
                fontSize: '11px',
                marginTop: '4px'
              }}>
                Only letters, numbers, and underscores allowed
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) {
                    const error = validatePassword(e.target.value);
                    setPasswordError(error);
                  } else {
                    setPasswordError("");
                  }
                }}
                required
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {passwordError && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px'
              }}>
                {passwordError}
              </div>
            )}
            <div style={{
              color: 'var(--text-light)',
              fontSize: '11px',
              marginTop: '4px'
            }}>
              Must be 8+ characters with: 1 uppercase, 1 lowercase, 1 number, 1 special character
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value && e.target.value !== password) {
                  setPasswordError("Passwords do not match!");
                } else if (e.target.value === password && password) {
                  setPasswordError("");
                }
              }}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? "Creating account..." : `Sign Up as ${registerMode === "sweeper" ? "Sweeper" : "Citizen"}`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '8px' }}>
              Already have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
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
              Sign In instead
            </button>
          </div>
        </form>

        <p className="footer-text">A Municipal Corporation Initiative</p>
      </div>
    </div>
  );
}
