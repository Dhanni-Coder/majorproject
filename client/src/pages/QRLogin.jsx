import { Link } from 'react-router-dom';
import QRScanner from '../components/QRScanner';

const QRLogin = () => {
  return (
    <div className="qr-login-page">
      <div className="qr-login-container">
        <h1>QR Code Login</h1>
        <p className="lead">Scan your QR code to login</p>
        
        <QRScanner />
        
        <div className="alternative-login">
          <p>Or login with:</p>
          <Link to="/login" className="btn btn-outline">
            Email & Password
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QRLogin;
