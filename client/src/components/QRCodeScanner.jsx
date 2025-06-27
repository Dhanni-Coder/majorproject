import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRCodeScanner = ({ onScanSuccess, onScanError, autoStart = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5Qrcode('qr-reader');
    setScannerInstance(scanner);

    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id); // Select the first camera by default
          
          // Auto-start scanner if prop is true
          if (autoStart) {
            setTimeout(() => startScanner(), 500);
          }
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch(err => {
        setError('Error getting cameras: ' + err.message);
        console.error('Error getting cameras:', err);
      });

    // Cleanup on unmount
    return () => {
      if (scanner && isScanning) {
        scanner.stop()
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [autoStart]);

  const startScanner = () => {
    if (!scannerInstance || !cameraId) return;

    setIsScanning(true);
    setError('');

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    scannerInstance.start(
      cameraId,
      config,
      (decodedText) => {
        // On successful scan
        console.log('QR Code scanned:', decodedText);
        onScanSuccess(decodedText);
        
        // Optionally stop scanning after successful scan
        // stopScanner();
      },
      (errorMessage) => {
        // Ignore errors during scanning as they're usually just frames without QR codes
        if (onScanError) {
          onScanError(errorMessage);
        }
      }
    )
    .catch(err => {
      setError('Error starting scanner: ' + err.message);
      setIsScanning(false);
      console.error('Error starting scanner:', err);
    });
  };

  const stopScanner = () => {
    if (scannerInstance && isScanning) {
      scannerInstance.stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch(err => {
          console.error('Error stopping scanner:', err);
          setError('Error stopping scanner: ' + err.message);
        });
    }
  };

  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setCameraId(newCameraId);
    
    // If already scanning, restart with new camera
    if (isScanning) {
      stopScanner();
      setTimeout(() => {
        if (newCameraId) {
          startScanner();
        }
      }, 500); // Small delay to ensure camera is properly stopped
    }
  };

  return (
    <div className="qr-scanner-container">
      {error && <div className="error-message">{error}</div>}
      
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
      
      <div className="scanner-controls">
        {cameras.length > 0 && (
          <div className="camera-select">
            <label htmlFor="camera-select">Select Camera:</label>
            <select 
              id="camera-select" 
              value={cameraId || ''} 
              onChange={handleCameraChange}
              disabled={isScanning}
            >
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="scanner-buttons">
          {!isScanning ? (
            <button 
              className="btn btn-primary" 
              onClick={startScanner}
              disabled={!cameraId}
            >
              Start Scanner
            </button>
          ) : (
            <button 
              className="btn btn-danger" 
              onClick={stopScanner}
            >
              Stop Scanner
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;

