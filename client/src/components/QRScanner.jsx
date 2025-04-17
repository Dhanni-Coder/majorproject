import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import QRCodeScanner from './QRCodeScanner';

const QRScanner = () => {
  const [error, setError] = useState('');
  const [qrInput, setQrInput] = useState('');
  const { loginWithQR } = useContext(AuthContext);

  const handleQRCodeScan = async (decodedText) => {
    try {
      // Process the QR code data
      setError('');
      console.log('Processing QR code:', decodedText);
      const result = await loginWithQR(decodedText);

      if (result && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('QR processing error:', err);
      setError('Failed to process QR code: ' + err.message);
    }
  };

  const handleQRCodeError = (errorMessage) => {
    // Only set error for significant errors, not for normal scanning errors
    if (errorMessage.includes('Camera access denied') ||
        errorMessage.includes('No camera')) {
      setError(errorMessage);
    }
  };

  return (
    <div className="qr-scanner">
      <h2>QR Code Login</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="scanner-container">
        <QRCodeScanner
          onScanSuccess={handleQRCodeScan}
          onScanError={handleQRCodeError}
        />

        <div className="scanner-instructions">
          <p>Position your QR code in front of the camera to login.</p>
          <p>Make sure your QR code is well-lit and clearly visible.</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
