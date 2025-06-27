import React, { useState } from 'react';
import { FaUserGraduate, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';

const AttendanceTable = ({ attendanceData, onMarkAttendance }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  });

  // Filter students based on search term
  const filteredStudents = attendanceData.filter(item =>
    item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students based on sort configuration
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const aValue = a.student.name.toLowerCase();
      const bValue = b.student.name.toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    }

    if (sortConfig.key === 'status') {
      const aValue = a.attendance?.present ? 1 : 0;
      const bValue = b.attendance?.present ? 1 : 0;

      return sortConfig.direction === 'ascending'
        ? aValue - bValue
        : bValue - aValue;
    }

    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  return (
    <div className="attendance-table-container">
      <div className="attendance-table-header">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="table-info">
          Showing {filteredStudents.length} of {attendanceData.length} students
        </div>
      </div>

      {filteredStudents.length > 0 ? (
        <div className="attendance-table">
          <div className="attendance-table-head">
            <div
              className="table-header-cell student-cell sortable"
              onClick={() => requestSort('name')}
            >
              <FaUserGraduate />
              <span>Student{getSortIndicator('name')}</span>
            </div>
            <div className="table-header-cell email-cell">Email</div>
            <div
              className="table-header-cell status-cell sortable"
              onClick={() => requestSort('status')}
            >
              Status{getSortIndicator('status')}
            </div>
            <div className="table-header-cell actions-cell">Actions</div>
          </div>

          <div className="attendance-table-body">
            {sortedStudents.map(item => (
              <div key={item.student._id} className="attendance-table-row">
                <div className="table-cell student-cell">
                  <div className="student-name">{item.student.name}</div>
                </div>
                <div className="table-cell email-cell">
                  <div className="student-email">{item.student.email}</div>
                </div>
                <div className="table-cell status-cell">
                  <div className={`attendance-status ${item.attendance?.present ? 'present' : 'absent'}`}>
                    {item.attendance?.present ? (
                      <>
                        <FaCheck className="status-icon" />
                        <span>Present</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="status-icon" />
                        <span>Absent</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="table-cell actions-cell">
                  <div className="attendance-actions">
                    <button
                      className={`btn-mark ${item.attendance?.present ? 'btn-absent' : 'btn-present'}`}
                      onClick={() => onMarkAttendance(item.student._id, !item.attendance?.present)}
                    >
                      Mark {item.attendance?.present ? 'Absent' : 'Present'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">
          <p>No students found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

// PropTypes removed

export default AttendanceTable;
