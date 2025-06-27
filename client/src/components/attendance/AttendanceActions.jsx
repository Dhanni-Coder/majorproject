import React from 'react';
import { FaQrcode, FaSave, FaSync } from 'react-icons/fa';

const AttendanceActions = ({
  onScanQR,
  onSaveAttendance,
  onRefreshData,
  hasAttendanceData
}) => {
  return (
    <div className="attendance-actions-container">
      <button
        className="action-button scan-button"
        onClick={onScanQR}
        disabled={!hasAttendanceData}
      >
        <FaQrcode className="action-icon" />
        <span>Mark Attendance</span>
      </button>

      <button
        className="action-button save-button"
        onClick={onSaveAttendance}
        disabled={!hasAttendanceData}
      >
        <FaSave className="action-icon" />
        <span>Save All</span>
      </button>

      <button
        className="action-button refresh-button"
        onClick={onRefreshData}
      >
        <FaSync className="action-icon" />
        <span>Refresh</span>
      </button>
    </div>
  );
};

// PropTypes removed

export default AttendanceActions;
