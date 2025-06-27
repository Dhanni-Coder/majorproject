import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaSignInAlt, FaEnvelope, FaLock, FaQrcode, FaUserPlus, FaExclamationCircle } from 'react-icons/fa';
import '../styles/AuthPages.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const { login, loading } = useContext(AuthContext);
  const [animateIn, setAnimateIn] = useState(false);

  const { email, password } = formData;

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
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Login user
    const result = await login({
      email,
      password
    });

    if (result.error) {
      setError(result.error);
    }
  };

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
          <h1><FaSignInAlt className="icon" /> Login</h1>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className="auth-error">
            <FaExclamationCircle className="icon" /> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email"><FaEnvelope className="icon" /> Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : <><FaSignInAlt className="icon" /> Login</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register"><FaUserPlus className="icon" /> Register</Link>
          </p>
        </div>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        <div className="alt-auth">
          <Link to="/qr-login" className="alt-auth-btn">
            <FaQrcode className="icon" /> Login with QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
