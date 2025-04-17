import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const { login, loading } = useContext(AuthContext);
  
  const { email, password } = formData;
  
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
    <div className="login-page">
      <div className="form-container">
        <h1>Login</h1>
        <p className="lead">Sign in to your account</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
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
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="form-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        
        <div className="alternative-login">
          <p>Or login with:</p>
          <Link to="/qr-login" className="btn btn-outline">
            QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
