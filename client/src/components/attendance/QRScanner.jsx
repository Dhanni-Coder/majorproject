import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaTimes, FaCheck, FaUserGraduate, FaQrcode, FaRedo } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';

// QR code format constants (not exported by the library)
// 0 = QR_CODE, 1 = AZTEC, 2 = CODABAR, etc.
// We use 0 for QR_CODE in the formatsToSupport array

const QRScanner = ({
  onClose,
  onScanSuccess,
  attendanceData,
  markedStudents
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [lastScannedQR, setLastScannedQR] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef(null);
  const qrContainerRef = useRef(null);

  useEffect(() => {
    // Initialize scanner when component mounts
    if (qrContainerRef.current) {
      // Add a small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        startScanner();
      }, 500);
    }

    // Clean up scanner when component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .then(() => {
            console.log('Scanner stopped');
            scannerRef.current = null;
          })
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanner = () => {
    if (scanning || !qrContainerRef.current) return;

    try {
      console.log('Initializing QR scanner...');

      // Create QR reader element if it doesn't exist
      if (!document.getElementById('qr-reader')) {
        const qrReader = document.createElement('div');
        qrReader.id = 'qr-reader';
        qrContainerRef.current.appendChild(qrReader);
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      // Get available cameras
      Html5Qrcode.getCameras()
        .then(cameras => {
          if (cameras && cameras.length > 0) {
            console.log('Cameras found:', cameras);

            // Try to use back camera first (for mobile devices)
            const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;

            // Start scanner with camera - improved configuration for better visibility
            return html5QrCode.start(
              { deviceId: { exact: cameraId } },
              {
                fps: 10, // Frame rate
                qrbox: { width: 300, height: 300 }, // Scanning area
                aspectRatio: 1.0, // Square aspect ratio
                videoConstraints: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 480, ideal: 720, max: 1080 },
                  facingMode: "environment",
                  // Improve visibility with these constraints
                  advanced: [
                    { zoom: 1 }, // No zoom by default
                    { focusMode: "continuous" }, // Continuous auto-focus
                    { whiteBalanceMode: "continuous" }, // Auto white balance
                    { exposureMode: "continuous" } // Auto exposure
                  ]
                }
              },
              handleScan,
              handleScanError
            );
          } else {
            throw new Error('No cameras found on this device');
          }
        })
        .then(() => {
          console.log('Scanner started successfully');
          setScanning(true);
        })
        .catch(err => {
          console.error('Error starting scanner with selected camera:', err);

          // Fallback to environment facing camera
          console.log('Trying with environment facing camera...');
          html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10, // Frame rate
              qrbox: { width: 300, height: 300 }, // Scanning area
              aspectRatio: 1.0, // Square aspect ratio
              videoConstraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: "environment",
                // Improve visibility with these constraints
                advanced: [
                  { zoom: 1 }, // No zoom by default
                  { focusMode: "continuous" }, // Continuous auto-focus
                  { whiteBalanceMode: "continuous" }, // Auto white balance
                  { exposureMode: "continuous" } // Auto exposure
                ]
              }
            },
            handleScan,
            handleScanError
          )
          .then(() => {
            console.log('Scanner started with environment camera');
            setScanning(true);
          })
          .catch(cameraErr => {
            console.error('Failed to start with environment camera:', cameraErr);
            setScannerError('Failed to start camera: ' + cameraErr.message);
          });
        });
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setScannerError('Failed to initialize camera: ' + err.message);
    }
  };

  const handleScanError = (err) => {
    console.error('QR scan error:', err);

    // Don't show "NotFoundException" errors to the user as they're normal when no QR code is in view
    if (err.message && err.message.includes('NotFoundException')) {
      // This is a normal error when no QR code is in view, don't show to user
      return;
    }

    // For other errors, show a user-friendly message
    if (err.message && err.message.includes('NotReadableError')) {
      setScannerError('Cannot access camera. Please check camera permissions and try again.');
    } else if (err.message && err.message.includes('NotAllowedError')) {
      setScannerError('Camera access denied. Please allow camera access and try again.');
    } else {
      setScannerError('Error scanning QR code. Please try again or use a different device.');
    }
  };

  const handleScan = async (decodedText) => {
    if (!decodedText) return;

    // If this is the same QR code we just scanned, ignore it
    if (lastScannedQR === decodedText) {
      return;
    }

    try {
      console.log('QR code scanned:', decodedText);
      setLastScannedQR(decodedText);

      // Parse the QR code data
      let qrData;
      try {
        // Try to parse as JSON
        qrData = JSON.parse(decodedText);
        console.log('Parsed QR data:', qrData);
      } catch (parseErr) {
        console.error('Error parsing QR data:', parseErr);

        // Check if it's a simple email string (for backward compatibility)
        if (decodedText.includes('@') && decodedText.includes('.')) {
          console.log('Detected email format QR code');
          qrData = {
            email: decodedText.trim(),
            role: 'student',
            secret: 'legacy'
          };
        } else {
          setScannerError('Invalid QR code format. Please scan a valid student QR code.');
          // Reset last scanned QR after a delay to allow rescanning the same code
          setTimeout(() => setLastScannedQR(null), 2000);
          return;
        }
      }

      // Verify that this is a valid student QR code
      if (!qrData.email || !qrData.secret || qrData.role !== 'student') {
        setScannerError('Invalid QR code. This is not a valid student QR code.');
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
        return;
      }

      // Find the student in the attendance data based on the email from QR code
      const studentToMark = attendanceData.find(
        item => item.student.email.toLowerCase() === qrData.email.toLowerCase()
      );

      if (!studentToMark) {
        setScannerError(`Student with email ${qrData.email} not found in this semester's attendance list.`);
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
        return;
      }

      // Check if this student has already been marked
      const alreadyMarked = markedStudents.some(s => s.id === studentToMark.student._id);
      if (alreadyMarked) {
        setSuccessMessage(`${studentToMark.student.name} is already marked present.`);
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => {
          setSuccessMessage('');
          setLastScannedQR(null);
        }, 2000);
        return;
      }

      console.log('Found student from QR code:', studentToMark.student.name);

      // Call the onScanSuccess callback
      const result = await onScanSuccess(studentToMark.student._id, true);

      if (result) {
        // Show success message briefly
        setSuccessMessage(`${studentToMark.student.name} marked present successfully!`);
        setTimeout(() => {
          setSuccessMessage('');
          // Reset last scanned QR to allow scanning another code
          setLastScannedQR(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setScannerError('Error processing QR code: ' + err.message);
      // Reset last scanned QR after a delay to allow rescanning the same code
      setTimeout(() => setLastScannedQR(null), 2000);
    }
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-header">
        <h2>
          <FaQrcode /> Scan Student QR Code
        </h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="qr-scanner-messages">
        {successMessage && (
          <div className="scanner-success-message">
            <FaCheck /> {successMessage}
          </div>
        )}

        {scannerError && (
          <div className="scanner-error-message">
            <FaTimes /> {scannerError}
            <button
              className="retry-button"
              onClick={() => {
                setScannerError('');
                if (scannerRef.current) {
                  scannerRef.current.stop()
                    .then(() => {
                      console.log('Scanner stopped for retry');
                      scannerRef.current = null;
                      setScanning(false);
                      setTimeout(() => startScanner(), 500);
                    })
                    .catch(err => console.error('Error stopping scanner for retry:', err));
                } else {
                  startScanner();
                }
              }}
            >
              <FaRedo /> Retry
            </button>
          </div>
        )}

        <div className="qr-scanner-container" ref={qrContainerRef}>
          <div id="qr-reader"></div>
          <div className="scanner-overlay">
            <div className="scanner-frame">
              {/* Corner markers for better visibility */}
              <div className="corner-marker top-left"></div>
              <div className="corner-marker top-right"></div>
              <div className="corner-marker bottom-left"></div>
              <div className="corner-marker bottom-right"></div>
            </div>
          </div>
          {!scanning && (
            <div className="scanner-loading">
              <div className="spinner"></div>
              <p>Initializing camera...</p>
            </div>
          )}

          {/* Camera controls */}
          <div className="camera-controls">
            <button
              className="stop-camera-button"
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.stop()
                    .then(() => {
                      console.log('Scanner stopped by user');
                      scannerRef.current = null;
                      setScanning(false);
                      onClose(); // Close the scanner
                    })
                    .catch(err => console.error('Error stopping scanner:', err));
                } else {
                  onClose(); // Close the scanner if no scanner is running
                }
              }}
            >
              <FaTimes /> Stop Camera
            </button>
          </div>
        </div>

        <div className="scanner-instructions">
          <p><FaCamera /> Position the student's QR code within the frame to mark them present</p>
          <ul className="scanner-tips">
            <li>Hold the camera steady and ensure good lighting</li>
            <li>Make sure the QR code is fully visible and not blurry</li>
            <li>Keep a distance of 6-12 inches from the QR code</li>
          </ul>
        </div>

        {/* Separate container for marked students to avoid layout issues */}
        <div className="scanner-footer-content">
          {markedStudents.length > 0 && (
            <div className="marked-students-container">
              <h3>
                <FaUserGraduate /> Recently Marked Students
              </h3>
              <div className="marked-students-list">
                {markedStudents.slice(0, 5).map(student => (
                  <div key={student.id} className="marked-student">
                    <div className="marked-student-info">
                      <div className="marked-student-name">{student.name}</div>
                      <div className="marked-student-email">{student.email}</div>
                    </div>
                    <div className="marked-student-time">{student.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer removed since we now have a stop camera button */}
    </div>
  );
};

// PropTypes removed

export default QRScanner;
