import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to College Management System</h1>
        <p>A comprehensive solution for students, teachers, and administrators</p>

        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register Admin
            </Link>
            <Link to="/qr-login" className="btn btn-outline">
              QR Login
            </Link>
          </div>
        ) : (
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
            {user && user.role === 'admin' && (
              <Link to="/register" className="btn btn-secondary">
                Register Admin
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Key Features</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>QR Code Authentication</h3>
            <p>Secure and quick login with personalized QR codes</p>
          </div>

          <div className="feature-card">
            <h3>Role-Based Access</h3>
            <p>Tailored dashboards for students, teachers, and administrators</p>
          </div>

          <div className="feature-card">
            <h3>Secure System</h3>
            <p>Advanced security measures to protect user data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
