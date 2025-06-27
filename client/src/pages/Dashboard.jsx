import { useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [redirected, setRedirected] = useState(false);
  const location = useLocation();

  // Check if we're coming from a login redirect
  useEffect(() => {
    // If we're already on the dashboard page, we don't want to redirect again
    // This prevents the double redirection issue
    if (location.pathname === '/dashboard') {
      setRedirected(true);
    }
  }, [location]);

  // Show loading spinner if user data is not yet loaded
  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Only redirect if we haven't already redirected
  // This prevents the double redirection issue
  if (!redirected) {
    // Redirect users to their role-specific dashboards
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher-dashboard" replace />;
      case 'student':
        return <Navigate to="/student-dashboard" replace />;
      default:
        return (
          <div className="container">
            <div className="alert alert-danger">
              Unknown user role. Please contact an administrator.
            </div>
          </div>
        );
    }
  }

  // If we've already redirected, just show a loading message
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Redirecting to your dashboard...</p>
    </div>
  );
};

export default Dashboard;
