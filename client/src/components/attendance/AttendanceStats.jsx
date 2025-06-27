import React from 'react';
import { FaUserGraduate, FaCheck, FaTimes } from 'react-icons/fa';

const AttendanceStats = ({ totalStudents, presentCount, absentCount }) => {
  // Calculate attendance percentage
  const attendancePercentage = totalStudents > 0
    ? Math.round((presentCount / totalStudents) * 100)
    : 0;

  return (
    <div className="attendance-stats-container">
      <div className="attendance-stat">
        <div className="stat-icon students">
          <FaUserGraduate />
        </div>
        <div className="stat-content">
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
      </div>

      <div className="attendance-stat">
        <div className="stat-icon present">
          <FaCheck />
        </div>
        <div className="stat-content">
          <div className="stat-value">{presentCount}</div>
          <div className="stat-label">Present</div>
        </div>
      </div>

      <div className="attendance-stat">
        <div className="stat-icon absent">
          <FaTimes />
        </div>
        <div className="stat-content">
          <div className="stat-value">{absentCount}</div>
          <div className="stat-label">Absent</div>
        </div>
      </div>

      <div className="attendance-stat percentage">
        <div className="stat-content">
          <div className="stat-value">{attendancePercentage}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${attendancePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// PropTypes removed

export default AttendanceStats;
