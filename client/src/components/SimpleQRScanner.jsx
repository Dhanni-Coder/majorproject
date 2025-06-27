import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaQrcode, FaCamera } from 'react-icons/fa';
import '../styles/SimpleQRScanner.css';

const SimpleQRScanner = ({ onScan, onClose, title = 'Scan QR Code' }) => {
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const lastScannedRef = useRef(null);

  useEffect(() => {
    // Initialize scanner when component runs
    if (scanning) {
      // Make sure that any existing scanner is stopped first
      const initializeScanner = async () => {
        await stopScanner();
        await startScanner();
      };

      initializeScanner();
    }

    // Cleanup function
    return () => {
      //this function stops the scanner
      stopScanner();
    };
  }, [facingMode]); // runs useeffect when facingmode Re-initialize when camera changes

  const startScanner = async () => {
    try {
      // Make sure any existing scanner is fully stopped
      await stopScanner();

      // Make sure the container is empty
      const container = document.getElementById("qr-reader-container");
      if (container) {
        container.innerHTML = '';
      }

      // Create a new scanner instance
      console.log("Creating new QR scanner instance");
      const html5QrCode = new Html5Qrcode("qr-reader-container");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
        // No need to specify formats, default includes QR code
      };

      // Try to get available cameras
      try {
        // First try with camera ID if available
        const cameras = await Html5Qrcode.getCameras();
        console.log("Available cameras:", cameras);

        if (cameras && cameras.length > 0) {
          // Use the first camera by default, or second if available and front camera requested
          const cameraId = facingMode === 'user' && cameras.length > 1 ?
            cameras[1].id : cameras[0].id;

          await html5QrCode.start(
            cameraId,
            config,
            handleScan,
            handleScanError
          );
        } else {
          // Fallback to constraints-based approach
          const constraints = facingMode === 'environment' ?
            { facingMode: { exact: "environment" } } :
            { facingMode: { exact: "user" } };

          await html5QrCode.start(
            constraints,
            config,
            handleScan,
            handleScanError
          );
        }
      } catch (err) {
        console.error("Error starting camera with ID:", err);

        // Final fallback - try with no specific camera
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            handleScan,
            handleScanError
          );
        } catch (finalErr) {
          console.error("Final camera error:", finalErr);
          throw finalErr;
        }
      }

      console.log("QR Code scanner started successfully");
    } catch (err) {
      console.error("Error starting QR scanner:", err);

      // Provide more helpful error messages based on common issues
      if (err.message && err.message.includes('Permission')) {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.message && err.message.includes('getUserMedia')) {
        setError('Cannot access camera. Make sure your device has a camera and try again.');
      } else if (err.message && err.message.includes('undefined')) {
        setError('Camera initialization error. Please try again or use a different browser.');
      } else {
        setError(`Camera error: ${err.message || 'Could not access camera'}`);
      }

      // Add a retry button
      setScanResult('error');
    }
  };

  const stopScanner = async () => {
    try {
      // Check if there's an existing scanner instance
      if (html5QrCodeRef.current) {
        // Only try to stop if it's scanning
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
          console.log("QR Code scanner stopped");
        }

        // Clear the reference
        html5QrCodeRef.current = null;

        // Also clear the DOM element to ensure a fresh start
        const container = document.getElementById("qr-reader-container");
        if (container) {
          container.innerHTML = '';
        }
      }
    } catch (err) {
      console.error("Error stopping QR scanner:", err);
      // Even if there's an error, clear the reference to avoid issues
      html5QrCodeRef.current = null;
    }
  };

  const handleScan = async (decodedText) => {
    if (decodedText && scanning) {
      try {
        // Prevent duplicate scans of the same QR code in quick succession
        if (lastScannedRef.current === decodedText) {
          return;
        }

        console.log('QR code scanned:', decodedText);
        lastScannedRef.current = decodedText;

        // Parse the QR code data
        let qrData;
        try {
          qrData = JSON.parse(decodedText);

          // Transform the QR data to match what the Library component expects
          if (qrData.email && qrData.role) {
            // For student identification
            if (qrData.role === 'student') {
              qrData.id = qrData._id || qrData.id; // Ensure we have an ID
              qrData.name = qrData.name || qrData.email.split('@')[0]; // Use email as fallback for name

              // If we don't have an ID but have an email, we'll use the email to identify the student
              // The actual lookup will happen in the Library component
            }

            console.log('Transformed QR data:', qrData);
          }
        } catch (err) {
          console.error('QR parsing error:', err);
          throw new Error('Invalid QR code format. Please try again.');
        }

        // Call the onScan callback with the parsed data
        const success = await onScan(qrData);

        if (success) {
          setScanResult(decodedText);
          setScanning(false);
          await stopScanner();
        }
      } catch (err) {
        console.error('Error processing QR code:', err);
        setError(err.message || 'Failed to process QR code. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleScanError = (err) => {
    // Don't show errors for normal operation
    console.log('QR scan error (normal):', err);
  };

  const toggleCamera = async () => {
    // Disable scanning temporarily to prevent multiple instances
    setScanning(false);

    // Stop the current scanner
    await stopScanner();

    // Wait a moment to ensure cleanup is complete
    setTimeout(() => {
      // Switch camera mode
      setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');

      // Re-enable scanning (the useEffect will handle restarting)
      setScanning(true);
    }, 300);
  };

  const handleClose = async () => {
    setScanning(false);
    await stopScanner();
    onClose();
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h2><FaQrcode className="icon" /> {title}</h2>
          <div className="scanner-controls">
            <button className="camera-toggle" onClick={toggleCamera} title="Switch Camera">
              <FaCamera />
            </button>
            <button className="close-button" onClick={handleClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        {error && (
          <div className="scanner-error">
            {error}
          </div>
        )}

        <div className="scanner-content">
          {scanning ? (
            <div id="qr-reader-container" className="qr-reader"></div>
          ) : scanResult === 'error' ? (
            <div className="scan-error">
              <p>Failed to initialize camera</p>
              <div className="scanner-buttons">
                <button className="btn btn-primary" onClick={() => {
                  setScanning(true);
                  setError('');
                  setScanResult(null);
                  startScanner();
                }}>
                  Retry
                </button>
                <button className="btn btn-secondary" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="scan-success">
              <p>QR Code scanned successfully!</p>
              <button className="btn btn-primary" onClick={handleClose}>
                Close
              </button>
            </div>
          )}
        </div>

        <div className="scanner-instructions">
          <p>Position the QR code within the frame to scan.</p>
          <p className="camera-mode">Using {facingMode === 'environment' ? 'back' : 'front'} camera. Tap <FaCamera /> to switch.</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleQRScanner;
