import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import NoticeWidget from '../components/NoticeWidget';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Different dashboard content based on user role
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p className="stat-value">120</p>
              </div>
              <div className="stat-card">
                <h3>Total Teachers</h3>
                <p className="stat-value">15</p>
              </div>
              <div className="stat-card">
                <h3>Total Courses</h3>
                <p className="stat-value">25</p>
              </div>
            </div>
          </div>
        );

      case 'teacher':
        return (
          <div className="teacher-dashboard">
            <h2>Teacher Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>My Courses</h3>
                <p className="stat-value">5</p>
              </div>
              <div className="stat-card">
                <h3>Total Students</h3>
                <p className="stat-value">75</p>
              </div>
              <div className="stat-card">
                <h3>Upcoming Classes</h3>
                <p className="stat-value">3</p>
              </div>
            </div>

            <div className="dashboard-quick-links">
              <h3>Quick Links</h3>
              <div className="quick-links">
                <Link to="/take-attendance" className="quick-link-card">
                  <h4>Take Attendance</h4>
                  <p>Mark attendance for students in your class</p>
                </Link>
                <Link to="/students" className="quick-link-card">
                  <h4>View Students</h4>
                  <p>Manage students in your branch</p>
                </Link>
                <Link to="/notices" className="quick-link-card">
                  <h4>Manage Notices</h4>
                  <p>Create and view notices for students</p>
                </Link>
              </div>
            </div>
          </div>
        );

      case 'student':
      default:
        return (
          <div className="student-dashboard">
            <h2>Student Dashboard</h2>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>My Courses</h3>
                <p className="stat-value">6</p>
              </div>
              <div className="stat-card">
                <h3>Assignments Due</h3>
                <p className="stat-value">4</p>
              </div>
              <div className="stat-card">
                <h3>Average Grade</h3>
                <p className="stat-value">85%</p>
              </div>
            </div>

            <div className="dashboard-quick-links">
              <h3>Quick Links</h3>
              <div className="quick-links">
                <Link to="/my-attendance" className="quick-link-card">
                  <h4>View My Attendance</h4>
                  <p>Check your attendance records and monthly statistics</p>
                </Link>
                <Link to="/notices" className="quick-link-card">
                  <h4>View Notices</h4>
                  <p>Stay updated with the latest announcements</p>
                </Link>
                <Link to="/qr-code" className="quick-link-card">
                  <h4>My QR Code</h4>
                  <p>Access your personal QR code for attendance</p>
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <p>Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          {renderDashboardContent()}
        </div>

        <div className="dashboard-sidebar">
          <NoticeWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
