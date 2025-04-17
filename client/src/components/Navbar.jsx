import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaUser, FaQrcode, FaHome, FaClipboardCheck, FaBell, FaUserGraduate, FaGraduationCap, FaUserCog } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const authLinks = (
    <ul className="navbar-nav">
      <li className="nav-item">
        <Link to="/dashboard" className="nav-link">
          <FaHome className="icon" /> Dashboard
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/branches" className="nav-link">
          <FaGraduationCap className="icon" /> Branches
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/notices" className="nav-link">
          <FaBell className="icon" /> Notices
        </Link>
      </li>
      {user && user.role !== 'student' && (
        <>
          <li className="nav-item">
            <Link to="/students" className="nav-link">
              <FaUserGraduate className="icon" /> View Students
            </Link>
          </li>
          {user.role === 'teacher' && (
            <li className="nav-item">
              <Link to="/take-attendance" className="nav-link">
                <FaClipboardCheck className="icon" /> Take Attendance
              </Link>
            </li>
          )}
        </>
      )}
      {user && user.role === 'admin' && (
        <li className="nav-item">
          <Link to="/manage-users" className="nav-link">
            <FaUserCog className="icon" /> Manage Users
          </Link>
        </li>
      )}
      {user && user.role === 'student' && (
        <li className="nav-item">
          <Link to="/my-attendance" className="nav-link">
            <FaClipboardCheck className="icon" /> My Attendance
          </Link>
        </li>
      )}
      <li className="nav-item">
        <Link to="/profile" className="nav-link">
          <FaUser className="icon" /> Profile
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/qr-code" className="nav-link">
          <FaQrcode className="icon" /> QR Code
        </Link>
      </li>
      <li className="nav-item">
        <a onClick={logout} href="#!" className="nav-link">
          <FaSignOutAlt className="icon" /> Logout
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="navbar-nav">
      <li className="nav-item">
        <Link to="/register" className="nav-link">
          Register Admin
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/login" className="nav-link">
          Login
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/qr-login" className="nav-link">
          <FaQrcode className="icon" /> QR Login
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          College Management System
        </Link>
        <div className="navbar-menu">
          {isAuthenticated ? authLinks : guestLinks}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
