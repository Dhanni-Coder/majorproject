import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRScannerModern from '../components/QRScannerModern';
import { FaQrcode, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import '../styles/AuthPages.css';
import '../styles/QRCode.css';

/**
 * QR Code Login Page
 * Allows users to login by scanning a QR code or entering QR data manually
 */
const QRLogin = () => {
  // Animation state
  const [animateIn, setAnimateIn] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setAnimateIn(true);

    // Set page title
    document.title = 'QR Code Login | College Management System';

    return () => {
      // Reset title on unmount
      document.title = 'College Management System';
    };
  }, []);

  return (
    <div className="auth-page">
      {/* Animated Background Elements */}
      <div className="auth-bg"></div>
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="shape shape-4"></div>

      {/* Main Content Card */}
      <div
        className={`auth-card ${animateIn ? 'animate-in' : ''}`}
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
        }}
      >
        {/* Header */}
        <div className="auth-header">
          <h1><FaQrcode className="icon" /> QR Code Login</h1>
          <p>Scan your QR code to login</p>
        </div>

        {/* QR Scanner Component */}
        <div className="qr-scanner-container" style={{ margin: '1rem 0', width: '100%' }}>
          <QRScannerModern />
        </div>

        {/* Alternative Login Options */}
        <div className="auth-divider">
          <span>Or</span>
        </div>

        <div className="alt-auth">
          <Link to="/login" className="alt-auth-btn">
            <FaEnvelope className="icon" /> Login with Email
          </Link>
        </div>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <Link to="/" className="back-link">
            <FaArrowLeft className="icon" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QRLogin;
