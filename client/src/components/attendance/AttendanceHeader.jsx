import React from 'react';
import { FaCalendarAlt, FaChalkboardTeacher } from 'react-icons/fa';

const AttendanceHeader = ({
  selectedDate,
  onDateChange,
  selectedSemester,
  onSemesterChange,
  selectedSubject,
  onSubjectChange,
  subjects,
  onAddSubjectClick
}) => {
  return (
    <div className="attendance-header-container">
      <div className="attendance-header-title">
        <h1>Attendance Management</h1>
        <p>Track and manage student attendance</p>
      </div>

      <div className="attendance-filters">
        <div className="filter-group">
          <div className="filter-label">
            <FaCalendarAlt />
            <span>Date</span>
          </div>
          <div className="filter-control date-control">
            <input
              type="date"
              value={selectedDate}
              onChange={onDateChange}
              className="date-input"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <FaChalkboardTeacher />
            <span>Semester</span>
          </div>
          <div className="filter-control">
            <select
              value={selectedSemester}
              onChange={onSemesterChange}
              className="semester-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <span>Subject</span>
          </div>
          <div className="filter-control subject-control">
            <select
              value={selectedSubject}
              onChange={onSubjectChange}
              className="subject-select"
              disabled={!subjects.length}
            >
              {subjects.length === 0 ? (
                <option value="">No subjects available</option>
              ) : (
                <>
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </>
              )}
            </select>
            <button
              className="btn-add-subject"
              onClick={onAddSubjectClick}
              title="Add a new subject"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes removed

export default AttendanceHeader;
