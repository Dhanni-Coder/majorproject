import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';

const QRCode = () => {
  const { getQRCode, regenerateQRCode } = useContext(AuthContext);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch QR code on component mount
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const qrCodeData = await getQRCode();
        if (qrCodeData) {
          setQrCode(qrCodeData);
        } else {
          setError('Failed to load QR code');
        }
      } catch (err) {
        setError('Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [getQRCode]);

  // Handle QR code regeneration
  const handleRegenerateQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const newQRCode = await regenerateQRCode();
      
      if (newQRCode) {
        setQrCode(newQRCode);
        setMessage('QR code regenerated successfully');
      } else {
        setError('Failed to regenerate QR code');
      }
    } catch (err) {
      setError('Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-code-page">
      <div className="qr-code-container">
        <h1>Your QR Code</h1>
        <p className="lead">Use this QR code to login to your account</p>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        {loading ? (
          <div className="loading">Loading QR code...</div>
        ) : (
          <div className="qr-code-display">
            {qrCode ? (
              <img src={qrCode} alt="QR Code" />
            ) : (
              <div className="no-qr-code">No QR code available</div>
            )}
          </div>
        )}
        
        <div className="qr-code-actions">
          <button 
            className="btn btn-primary"
            onClick={handleRegenerateQRCode}
            disabled={loading}
          >
            {loading ? 'Regenerating...' : 'Regenerate QR Code'}
          </button>
          
          <div className="qr-code-warning">
            <p>
              <strong>Important:</strong> Keep your QR code secure. Anyone with access to this QR code can log into your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCode;
