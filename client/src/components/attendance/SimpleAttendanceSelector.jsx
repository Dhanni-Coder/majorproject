import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaUserGraduate, FaSearch, FaQrcode, FaCamera } from 'react-icons/fa';
import QRScanner from './QRScanner';

const SimpleAttendanceSelector = ({
  onClose,
  onScanSuccess,
  attendanceData,
  markedStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Set showQRScanner to true by default to directly open the camera
  const [showQRScanner, setShowQRScanner] = useState(true);

  // Filter students based on search term
  const filteredStudents = attendanceData.filter(item =>
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle manual student selection
  const handleManualSelection = async (studentId) => {
    try {
      // Call the onScanSuccess callback
      const result = await onScanSuccess(studentId, true);

      if (result) {
        // Show success message briefly
        const student = attendanceData.find(item => item.student._id === studentId);
        setSuccessMessage(`${student.student.name} marked present successfully!`);
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      console.error('Error processing manual selection:', err);
      setScannerError('Error marking attendance: ' + err.message);
      setTimeout(() => setScannerError(''), 2000);
    }
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-header">
        <h2>
          <FaUserGraduate /> Mark Student Attendance
        </h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* Direct QR Scanner without extra content wrapper */}
      <QRScanner
        onClose={onClose}
        onScanSuccess={onScanSuccess}
        attendanceData={attendanceData}
        markedStudents={markedStudents}
      />

      <div className="qr-scanner-footer">
        <button className="cancel-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SimpleAttendanceSelector;
