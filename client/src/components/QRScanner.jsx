import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import { FaQrcode, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import '../styles/QRScannerModern.css';

const QRScanner = () => {
  const [error, setError] = useState('');
  const [qrInput, setQrInput] = useState('');
  const { loginWithQR } = useContext(AuthContext);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Auto-start scanning when component mounts
    setIsScanning(true);

    // Add a small delay before initializing the scanner
    // This helps ensure the DOM is fully ready
    const timer = setTimeout(() => {
      const container = document.getElementById('qr-reader');
      if (container) {
        container.innerHTML = ''; // Clear any previous content
        startScanner();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startScanner = async () => {
    try {
      // Make sure the container exists
      const container = document.getElementById('qr-reader');
      if (!container) return;

      console.log('Initializing QR scanner...');

      // Show loading message while camera initializes
      container.innerHTML = '<div class="qr-processing"><div class="spinner"></div><p>Starting camera...</p></div>';

      const html5QrCode = new Html5Qrcode('qr-reader');

      // Improved configuration for better QR code detection
      const config = {
        fps: 15, // Higher frame rate for better detection
        qrbox: { width: 300, height: 300 }, // Larger scanning area
        aspectRatio: 1.0,
        disableFlip: false, // Allow mirrored QR codes
        videoConstraints: {
          facingMode: "environment",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      };

      try {
        // Try to start the scanner with default settings
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          handleQRCodeScan,
          handleQRCodeError
        );
        console.log('QR scanner started successfully with environment camera');
      } catch (startErr) {
        console.error('Error starting scanner with environment camera:', startErr);

        // Try a simpler configuration as fallback
        try {
          console.log('Trying with simpler configuration...');

          // Simpler config without advanced options
          const simpleConfig = {
            fps: 10,
            qrbox: 250,
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: "user" }, // Try user-facing camera as fallback
            simpleConfig,
            handleQRCodeScan,
            handleQRCodeError
          );
          console.log('QR scanner started with fallback configuration');
        } catch (fallbackErr) {
          console.error('Error starting scanner with fallback configuration:', fallbackErr);
          throw fallbackErr; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError(`Camera error: ${err.message || 'Could not access camera'}`);

      // Show a more user-friendly error in the QR reader container
      const container = document.getElementById('qr-reader');
      if (container) {
        container.innerHTML = `
          <div class="qr-error-container">
            <div class="qr-error-icon"><FaExclamationCircle /></div>
            <p>Camera access error</p>
            <p class="qr-error-details">${err.message || 'Could not access camera'}</p>
            <button class="qr-retry-button" onclick="window.location.reload()">
              <span>Try Again</span>
            </button>
          </div>
        `;
      }
    }
  };

  const handleQRCodeScan = async (decodedText) => {
    try {
      // Process the QR code data
      setError('');
      console.log('Processing QR code:', decodedText);

      // Stop the scanner to prevent multiple scans
      const container = document.getElementById('qr-reader');
      if (container) {
        container.innerHTML = '<div class="qr-processing"><div class="spinner"></div><p>Logging in...</p></div>';
      }

      // Show a processing message
      setIsScanning(false);

      // Try to parse the QR code data
      let qrData = decodedText;
      try {
        // Check if it's valid JSON
        JSON.parse(decodedText);
        // If it parses successfully, it's already JSON
      } catch (parseError) {
        // If it's not valid JSON, it might be a URL or other format
        console.log('QR code is not in JSON format, using as-is');
      }

      // Attempt to login with the QR code
      const result = await loginWithQR(qrData);

      if (result && result.error) {
        setError(result.error);

        // If there's an error, restart the scanner
        if (container) {
          container.innerHTML = '';
          setTimeout(() => {
            startScanner();
          }, 2000);
        }
      }
    } catch (err) {
      console.error('QR processing error:', err);
      setError('Failed to process QR code: ' + err.message);

      // If there's an error, restart the scanner
      const container = document.getElementById('qr-reader');
      if (container) {
        container.innerHTML = '';
        setTimeout(() => {
          startScanner();
        }, 2000);
      }
    }
  };

  const handleQRCodeError = (errorMessage) => {
    // Log the error for debugging
    console.log('QR scan error:', errorMessage);

    // Only set error for significant errors, not for normal scanning errors
    if (errorMessage.includes('Camera access denied') ||
        errorMessage.includes('No camera')) {
      setError(errorMessage);
    }

    // Don't show "NotFoundException" errors to the user as they're normal during scanning
    // when no QR code is in view
    if (errorMessage.includes('NotFoundException')) {
      // This is a normal error during scanning, don't show to user
      return;
    }

    // For other parsing errors, show a more user-friendly message
    if (errorMessage.includes('parse error')) {
      setError('Unable to read QR code. Please make sure it\'s clearly visible and try again.');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    try {
      setError('');
      console.log('Processing manual QR code input:', qrInput);

      // Show processing state
      const container = document.getElementById('qr-reader');
      if (container) {
        container.innerHTML = '<div class="qr-processing"><div class="spinner"></div><p>Logging in...</p></div>';
      }

      // Try to parse the QR code data if it looks like JSON
      let qrData = qrInput;
      if (qrInput.trim().startsWith('{') && qrInput.trim().endsWith('}')) {
        try {
          // Check if it's valid JSON
          JSON.parse(qrInput);
          console.log('Manual input is valid JSON');
          // If it parses successfully, it's already JSON
        } catch (parseError) {
          console.log('Manual input looks like JSON but failed to parse, using as-is');
        }
      }

      // Attempt to login with the QR code
      const result = await loginWithQR(qrData);

      if (result && result.error) {
        setError(result.error);
        setQrInput('');
      }
    } catch (err) {
      console.error('QR processing error:', err);
      setError('Failed to process QR code: ' + err.message);
      setQrInput('');
    }
  };

  return (
    <div className="qr-scanner">
      {error && (
        <div className="qr-error">
          <FaExclamationCircle className="icon" style={{ marginRight: '8px' }} /> {error}
        </div>
      )}

      <div className="scanner-container">
        <div id="qr-reader"></div>

        <div className="scanner-instructions">
          <p><strong><FaQrcode style={{ marginRight: '8px' }} /> Position your QR code in front of the camera to login</strong></p>
          <ul className="scanner-tips">
            <li>Make sure your QR code is well-lit and clearly visible</li>
            <li>Hold the QR code steady for a few seconds</li>
            <li>Ensure there's no glare or reflection on the QR code</li>
            <li>Try different distances if scanning doesn't work</li>
          </ul>

          <div className="manual-input-section">
            <p className="manual-input-label">
              <FaInfoCircle style={{ marginRight: '8px' }} /> Having trouble with the camera?
            </p>
            <form onSubmit={handleManualSubmit} className="manual-input-form">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Enter QR code data manually"
                className="manual-input"
              />
              <button type="submit" className="manual-submit-btn">Login</button>
            </form>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  // Generate a test QR code for debugging
                  const testQRData = JSON.stringify({
                    email: 'admin@example.com',
                    secret: 'test-secret'
                  });
                  setQrInput(testQRData);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4361ee',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '5px'
                }}
              >
                Generate Test QR Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;



