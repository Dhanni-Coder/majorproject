import { useState, useContext, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaUserShield, FaEnvelope, FaLock, FaUser, FaSignInAlt, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import '../styles/AuthPages.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'admin'
  });

  const [error, setError] = useState('');
  const { user, register, loading, isAuthenticated } = useContext(AuthContext);
  const [animateIn, setAnimateIn] = useState(false);

  const { name, email, password, password2, role } = formData;

  useEffect(() => {
    // Trigger animation after component mounts
    setAnimateIn(true);
  }, []);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!name || !email || !password || !password2) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Register user
    console.log('Registering user with role:', role);
    const result = await register({
      name,
      email,
      password,
      role
    });

    if (result.error) {
      setError(result.error);
    }
  };

  // Redirect if user is already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg"></div>

      {/* Floating Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="shape shape-4"></div>

      <div className={`auth-card ${animateIn ? 'animate-in' : ''}`} style={{
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
      }}>
        <div className="auth-header">
          <h1><FaUserShield className="icon" /> Admin Registration</h1>
          <p>Create a new admin account</p>
        </div>

        <div className="admin-notice">
          <FaInfoCircle className="icon" />
          <div>
            <p><strong>Note:</strong> This page is for admin registration only.</p>
            <p>Students and teachers are added by administrators from the dashboard.</p>
          </div>
        </div>

        {error && (
          <div className="auth-error">
            <FaExclamationCircle className="icon" /> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name"><FaUser className="icon" /> Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email"><FaEnvelope className="icon" /> Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password"><FaLock className="icon" /> Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Create a password (min. 6 characters)"
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password2"><FaLock className="icon" /> Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={password2}
              onChange={onChange}
              placeholder="Confirm your password"
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role"><FaUserShield className="icon" /> Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={onChange}
              required
            >
              <option value="admin">Admin</option>
            </select>
            <small className="form-text">This page is for admin registration only.</small>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : <><FaUserShield className="icon" /> Create Admin Account</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login"><FaSignInAlt className="icon" /> Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
