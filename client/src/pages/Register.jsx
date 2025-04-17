import { useState, useContext, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

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

  const { name, email, password, password2, role } = formData;

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
    <div className="register-page">
      <div className="form-container">
        <h1>Admin Registration</h1>
        <p className="lead">Create a new admin account</p>
        <div className="admin-notice">
          <p><strong>Note:</strong> This page is for admin registration only.</p>
          <p>Students and teachers are added by administrators from the dashboard.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Enter your name"
              required
            />
          </div>

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
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
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
            <label htmlFor="role">Role</label>
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="form-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
