import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaSignOutAlt, FaUser, FaQrcode, FaHome, FaClipboardCheck,
  FaBell, FaUserGraduate, FaGraduationCap, FaUserCog,
  FaUniversity, FaUserPlus, FaSignInAlt, FaIdCard,
  FaChartBar, FaBook, FaBars, FaTimes, FaChevronDown,
  FaCog, FaUserCircle, FaUserShield, FaChalkboardTeacher
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import '../styles/ModernNavbar.css';

const ModernNavbar = () => {
  const { isAuthenticated, user, logout, loading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('click', closeUserMenuOnOutsideClick);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Prevent body scrolling when mobile menu is open
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : 'auto';
  };

  // Toggle user menu
  const toggleUserMenu = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling

    // Toggle the menu state
    const newState = !userMenuOpen;
    setUserMenuOpen(newState);

    // If opening the menu, add a click event listener to the document
    if (newState) {
      setTimeout(() => {
        document.addEventListener('click', closeUserMenuOnOutsideClick);
      }, 100);
    }
  };

  // Close user menu when clicking outside
  const closeUserMenuOnOutsideClick = (e) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
      setUserMenuOpen(false);
      document.removeEventListener('click', closeUserMenuOnOutsideClick);
    }
  };

  // Get user role badge class
  const getUserRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'admin';
      case 'teacher':
        return 'teacher';
      case 'student':
        return 'student';
      default:
        return '';
    }
  };

  // Get user role icon
  const getUserRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield />;
      case 'teacher':
        return <FaChalkboardTeacher />;
      case 'student':
        return <FaUserGraduate />;
      default:
        return <FaUser />;
    }
  };

  // Admin navigation links
  const adminLinks = [
    { path: '/branches', icon: <FaGraduationCap className="modern-nav-icon" />, text: 'Branches' },
    { path: '/notices', icon: <FaBell className="modern-nav-icon" />, text: 'Notices' },
    { path: '/library', icon: <FaBook className="modern-nav-icon" />, text: 'Library' },
    { path: '/students', icon: <FaUserGraduate className="modern-nav-icon" />, text: 'Students' },
    { path: '/manage-users', icon: <FaUserCog className="modern-nav-icon" />, text: 'Manage Users' }
  ];

  // Teacher navigation links
  const teacherLinks = [
    { path: '/notices', icon: <FaBell className="modern-nav-icon" />, text: 'Notices' },
    { path: '/library', icon: <FaBook className="modern-nav-icon" />, text: 'Library' },
    { path: '/students', icon: <FaUserGraduate className="modern-nav-icon" />, text: 'Students' },
    { path: '/new-attendance', icon: <FaClipboardCheck className="modern-nav-icon" />, text: 'Modern Attendance' }
  ];

  // Student navigation links
  const studentLinks = [
    { path: '/notices', icon: <FaBell className="modern-nav-icon" />, text: 'Notices' },
    { path: '/library', icon: <FaBook className="modern-nav-icon" />, text: 'Library' },
    { path: '/my-attendance', icon: <FaClipboardCheck className="modern-nav-icon" />, text: 'My Attendance' },
    { path: '/id-card', icon: <FaIdCard className="modern-nav-icon" />, text: 'ID Card' }
  ];

  // Guest navigation links
  const guestLinks = [
    { path: '/register', icon: <FaUserPlus className="modern-nav-icon" />, text: 'Register Admin' },
    { path: '/login', icon: <FaSignInAlt className="modern-nav-icon" />, text: 'Login' },
    { path: '/qr-login', icon: <FaQrcode className="modern-nav-icon" />, text: 'QR Login' }
  ];

  // Get navigation links based on user role
  const getNavLinks = () => {
    if (!isAuthenticated) return guestLinks;

    switch (user.role) {
      case 'admin':
        return adminLinks;
      case 'teacher':
        return teacherLinks;
      case 'student':
        return studentLinks;
      default:
        return [];
    }
  };

  // User dropdown menu items - customize based on user role
  const getUserMenuItems = () => {
    const baseItems = [
      { path: '/profile', icon: <FaUser className="item-icon" />, text: 'Profile' },
      { path: '/qr-code', icon: <FaQrcode className="item-icon" />, text: 'QR Code' },
      { divider: true },
      { onClick: logout, icon: <FaSignOutAlt className="item-icon" />, text: 'Logout' }
    ];

    // Add role-specific items
    if (user && user.role === 'student') {
      // Insert ID Card option for students
      baseItems.splice(2, 0, { path: '/id-card', icon: <FaIdCard className="item-icon" />, text: 'ID Card' });
    }

    return baseItems;
  };

  return (
    <>
      <nav className="modern-navbar">
        <div className="modern-navbar-container">
          {/* Logo */}
          <Link to="/" className="modern-navbar-logo">
            <img src="/src/public/logo.webp" alt="College Logo" className="college-logo" />
            <div className="college-name">
              <span className="college-name-main">Government Polytechnic</span>
              <span className="college-name-sub">Dehradun</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="modern-navbar-menu">
            {/* Loading Indicator for Desktop */}
            {loading && (
              <div className="auth-loading">
                <div className="spinner"></div>
              </div>
            )}

            {!loading && (
              <ul className="modern-navbar-nav">
                {/* Replace Home with Dashboard for authenticated users */}
                {isAuthenticated ? (
                <li className="modern-nav-item">
                  <Link
                    to="/dashboard"
                    className={`modern-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    <FaChartBar className="modern-nav-icon" /> Dashboard
                  </Link>
                </li>
              ) : (
                <li className="modern-nav-item">
                  <Link
                    to="/"
                    className={`modern-nav-link ${isActive('/') ? 'active' : ''}`}
                  >
                    <FaHome className="modern-nav-icon" /> Home
                  </Link>
                </li>
              )}

              {/* Navigation Links based on user role */}
              {getNavLinks().map((link, index) => (
                <li key={index} className="modern-nav-item">
                  <Link
                    to={link.path}
                    className={`modern-nav-link ${isActive(link.path) ? 'active' : ''}`}
                  >
                    {link.icon} {link.text}
                  </Link>
                </li>
              ))}
              </ul>
            )}

            {/* User Menu (Desktop) */}
            {!loading && isAuthenticated && user && (
              <div className="modern-navbar-actions">
                <div className="modern-dropdown" ref={userMenuRef}>
                  <button
                    type="button"
                    className="modern-nav-link modern-dropdown-toggle"
                    onClick={toggleUserMenu}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {user.profilePicture ? (
                      <img
                        src={`http://localhost:5000${user.profilePicture}`}
                        alt={user.name}
                        className="modern-nav-profile-image"
                      />
                    ) : (
                      <FaUserCircle className="modern-nav-icon" />
                    )}
                    <span>{user.name}</span>
                    <FaChevronDown className={`dropdown-icon ${userMenuOpen ? 'open' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  <div className={`modern-dropdown-menu ${userMenuOpen ? 'open' : ''}`}>
                    <div className="user-menu-section">
                      <div className="user-menu-info">
                        {user.profilePicture ? (
                          <img
                            src={`http://localhost:5000${user.profilePicture}`}
                            alt={user.name}
                            className="user-menu-avatar"
                          />
                        ) : (
                          <FaUserCircle size={40} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
                        )}
                        <div>
                          <div className="user-menu-name">{user.name}</div>
                          <div className="user-menu-email">{user.email}</div>
                        </div>
                      </div>
                      <div className={`user-role-badge ${getUserRoleBadgeClass(user.role)}`}>
                        {getUserRoleIcon(user.role)} {user.role}
                      </div>
                    </div>

                    {/* Menu items */}
                    {getUserMenuItems().map((item, index) => (
                      item.divider ? (
                        <div key={`divider-${index}`} className="modern-dropdown-divider"></div>
                      ) : (
                        <Link
                          key={index}
                          to={item.path || '#'}
                          className={`modern-dropdown-item ${item.path && isActive(item.path) ? 'active' : ''}`}
                          onClick={(e) => {
                            if (item.onClick) {
                              e.preventDefault();
                              item.onClick();
                            }
                            setUserMenuOpen(false); // Close menu after click
                          }}
                        >
                          {item.icon} {item.text}
                        </Link>
                      )
                    ))}
                  </div>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button className="modern-navbar-toggle" onClick={toggleMobileMenu}>
              <FaBars />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div
        className={`modern-mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Mobile Menu */}
      <div className={`modern-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="modern-mobile-menu-header">
          <Link to="/" className="modern-navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <img src="/src/public/logo.webp" alt="College Logo" className="college-logo" />
            <div className="college-name">
              <span className="college-name-main">Government Polytechnic</span>
              <span className="college-name-sub">Dehradun</span>
            </div>
          </Link>
          <button className="modern-mobile-menu-close" onClick={toggleMobileMenu}>
            <FaTimes />
          </button>
        </div>

        {/* User Info in Mobile Menu */}
        {!loading && isAuthenticated && user && (
          <div className="user-menu-section">
            <div className="user-menu-info">
              {user.profilePicture ? (
                <img
                  src={`http://localhost:5000${user.profilePicture}`}
                  alt={user.name}
                  className="user-menu-avatar"
                />
              ) : (
                <FaUserCircle size={40} style={{ marginRight: '0.75rem', color: 'var(--primary-color)' }} />
              )}
              <div>
                <div className="user-menu-name">{user.name}</div>
                <div className="user-menu-email">{user.email}</div>
              </div>
            </div>
            <div className={`user-role-badge ${getUserRoleBadgeClass(user.role)}`}>
              {getUserRoleIcon(user.role)} {user.role}
            </div>
          </div>
        )}

        {/* Loading Indicator for Mobile */}
        {loading && (
          <div className="auth-loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Mobile Navigation Links */}
        <ul className="modern-mobile-nav">
          {!loading && isAuthenticated ? (
            <li className="modern-mobile-nav-item">
              <Link
                to="/dashboard"
                className={`modern-mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaChartBar className="modern-mobile-nav-icon" /> Dashboard
              </Link>
            </li>
          ) : (
            <li className="modern-mobile-nav-item">
              <Link
                to="/"
                className={`modern-mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaHome className="modern-mobile-nav-icon" /> Home
              </Link>
            </li>
          )}

          {/* Navigation Links based on user role */}
          {getNavLinks().map((link, index) => (
            <li key={index} className="modern-mobile-nav-item">
              <Link
                to={link.path}
                className={`modern-mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {React.cloneElement(link.icon, { className: "modern-mobile-nav-icon" })} {link.text}
              </Link>
            </li>
          ))}

          {/* User Menu Items in Mobile Menu */}
          {!loading && isAuthenticated && user && (
            <>
              <div className="dropdown-category">Account</div>
              {getUserMenuItems().map((item, index) => (
                !item.divider && (
                  <li key={`mobile-${index}`} className="modern-mobile-nav-item">
                    <Link
                      to={item.path || '#'}
                      className={`modern-mobile-nav-link ${item.path && isActive(item.path) ? 'active' : ''}`}
                      onClick={(e) => {
                        if (item.onClick) {
                          e.preventDefault();
                          item.onClick();
                        }
                        setMobileMenuOpen(false);
                      }}
                    >
                      {React.cloneElement(item.icon, { className: "modern-mobile-nav-icon" })} {item.text}
                    </Link>
                  </li>
                )
              ))}
            </>
          )}
        </ul>

        {/* Theme Toggle in Mobile Menu */}
        <div className="mobile-theme-toggle">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};

export default ModernNavbar;



