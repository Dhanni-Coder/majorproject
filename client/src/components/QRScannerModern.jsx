import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FaQrcode, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import '../styles/QRScannerModern.css';
import '../styles/QRCode.css';

const QRScannerModern = () => {
  // State management
  const [error, setError] = useState('');
  const [scannerState, setScannerState] = useState({
    isScanning: false,
    isInitializing: true,
    isProcessing: false
  });

  // Refs
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  // Hooks
  const { loginWithQR, loading } = useAuth();
  const navigate = useNavigate();

  // Camera configurations
  const primaryCameraConfig = {
    fps: 15,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,
    videoConstraints: {
      facingMode: "environment",
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 }
    }
  };

  const fallbackCameraConfig = {
    fps: 10,
    qrbox: 200,
    aspectRatio: 1.0
  };

  // Clean up scanner on unmount
  const cleanupScanner = useCallback(() => {
    if (scannerInstanceRef.current) {
      try {
        scannerInstanceRef.current.stop()
          .catch(err => console.error('Error stopping scanner:', err));
        scannerInstanceRef.current = null;
      } catch (err) {
        console.error('Error cleaning up scanner:', err);
      }
    }
  }, []);

  // Handle QR code scan success
  const handleQRCodeScan = useCallback(async (decodedText) => {
    try {
      // Update state to show processing
      setScannerState(prev => ({ ...prev, isProcessing: true, isScanning: false }));
      setError('');

      // Clean up scanner to release camera
      cleanupScanner();

      // Process QR data
      let qrData = decodedText;
      try {
        // Validate if it's JSON
        JSON.parse(decodedText);
      } catch (parseError) {
        console.log('QR code is not in JSON format, using as-is');
      }

      // Attempt login
      const result = await loginWithQR(qrData);

      // Handle login error
      if (result && result.error) {
        setError(result.error);
        setScannerState(prev => ({ ...prev, isProcessing: false }));

        // Restart scanner after error
        setTimeout(() => {
          initializeScanner();
        }, 2000);
      }
    } catch (err) {
      console.error('QR processing error:', err);
      setError('Failed to process QR code: ' + err.message);
      setScannerState(prev => ({ ...prev, isProcessing: false }));

      // Restart scanner after error
      setTimeout(() => {
        initializeScanner();
      }, 2000);
    }
  }, [loginWithQR, cleanupScanner]);

  // Handle QR code scan errors
  const handleQRCodeError = useCallback((errorMessage) => {
    // Only handle significant errors
    if (errorMessage.includes('Camera access denied') || errorMessage.includes('No camera')) {
      setError(errorMessage);
      setScannerState(prev => ({ ...prev, isScanning: false }));
    }

    // Ignore "NotFoundException" errors as they're normal during scanning
    if (errorMessage.includes('NotFoundException')) {
      return;
    }

    // For parsing errors, show a user-friendly message
    if (errorMessage.includes('parse error')) {
      setError('Unable to read QR code. Please make sure it\'s clearly visible and try again.');
    }
  }, []);

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    // Clean up any existing scanner
    cleanupScanner();

    // Update state
    setScannerState({ isInitializing: true, isScanning: false, isProcessing: false });

    try {
      // Make sure the container exists
      if (!scannerRef.current) return;

      // Show loading message
      scannerRef.current.innerHTML = '<div class="qr-processing"><div class="spinner"></div><p>Starting camera...</p></div>';

      // Create scanner instance
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerInstanceRef.current = html5QrCode;

      try {
        // Try primary camera configuration
        await html5QrCode.start(
          { facingMode: "environment" },
          primaryCameraConfig,
          handleQRCodeScan,
          handleQRCodeError
        );
        console.log('QR scanner started with primary configuration');
        setScannerState({ isInitializing: false, isScanning: true, isProcessing: false });
      } catch (primaryErr) {
        console.warn('Primary camera configuration failed, trying fallback:', primaryErr);

        try {
          // Try fallback camera configuration
          await html5QrCode.start(
            { facingMode: "user" },
            fallbackCameraConfig,
            handleQRCodeScan,
            handleQRCodeError
          );
          console.log('QR scanner started with fallback configuration');
          setScannerState({ isInitializing: false, isScanning: true, isProcessing: false });
        } catch (fallbackErr) {
          console.error('All camera configurations failed:', fallbackErr);
          throw fallbackErr;
        }
      }
    } catch (err) {
      console.error('Failed to initialize scanner:', err);
      setError(`Camera error: ${err.message || 'Could not access camera'}`);
      setScannerState({ isInitializing: false, isScanning: false, isProcessing: false });

      // Show error in scanner container
      if (scannerRef.current) {
        scannerRef.current.innerHTML = `
          <div class="qr-error-container">
            <div class="qr-error-icon"><FaExclamationCircle size={32} /></div>
            <p>Camera access error</p>
            <p class="qr-error-details">${err.message || 'Could not access camera'}</p>
            <button class="qr-retry-button" onclick="window.location.reload()">
              <span>Try Again</span>
            </button>
          </div>
        `;
      }
    }
  }, [handleQRCodeScan, handleQRCodeError, cleanupScanner]);





  // Initialize scanner on component mount
  useEffect(() => {
    // Initialize scanner immediately
    initializeScanner();

    // Clean up on unmount
    return () => {
      cleanupScanner();
    };
  }, [initializeScanner, cleanupScanner]);

  // Render loading state
  if (loading && scannerState.isProcessing) {
    return (
      <div className="qr-scanner-container">
        <div className="qr-processing-fullscreen">
          <div className="spinner"></div>
          <p>Logging in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-modern">
      {/* Error display */}
      {error && (
        <div className="qr-error">
          <FaExclamationCircle className="icon" /> {error}
        </div>
      )}

      {/* Camera scanner */}
      <div className="scanner-container">
        <div id="qr-reader" ref={scannerRef}></div>

        <div className="scanner-instructions">
          <p className="instruction-title">
            <FaQrcode /> Position your QR code in front of the camera
          </p>
          <ul className="scanner-tips">
            <li>Make sure your QR code is well-lit and clearly visible</li>
            <li>Hold the QR code steady for a few seconds</li>
            <li>Ensure there's no glare or reflection on the QR code</li>
            <li>Try different distances if scanning doesn't work</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModern;
