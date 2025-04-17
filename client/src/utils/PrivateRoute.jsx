import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  // If still loading, show nothing
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If no specific roles are required or user has the required role
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // If user doesn't have the required role, redirect to dashboard
  return <Navigate to="/dashboard" />;
};

export default PrivateRoute;
