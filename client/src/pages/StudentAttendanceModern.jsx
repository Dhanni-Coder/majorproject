import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaUserGraduate, FaCalendarAlt, FaCheck, FaTimes, FaBook,
  FaTable, FaArrowLeft, FaEnvelope, FaGraduationCap,
  FaSchool, FaFilter, FaChartBar, FaDownload, FaPrint,
  FaSync, FaEllipsisV, FaArrowUp, FaArrowDown, FaExclamationTriangle
} from 'react-icons/fa';
import '../styles/StudentAttendanceModern.css';

const StudentAttendanceModern = () => {
  const { studentId } = useParams();
  const { user } = useContext(AuthContext);
  const [student, setStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0
  });

  // Determine if this is a student viewing their own attendance
  const isOwnAttendance = (!studentId && user?.role === 'student') || (studentId === user?.id);

  // Initialize filtered records and extract unique subjects when attendance records change
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      console.log('Initializing filtered records with all attendance records');
      setFilteredRecords(attendanceRecords);

      // Extract unique subjects from attendance records
      const subjects = new Set();
      attendanceRecords.forEach(record => {
        if (record.subject) {
          const subjectName = typeof record.subject === 'object'
            ? record.subject.name
            : typeof record.subject === 'string'
              ? record.subject
              : null;

          if (subjectName) {
            subjects.add(subjectName);
          }
        }
      });

      // Convert Set to array and sort alphabetically
      const sortedSubjects = Array.from(subjects).sort();
      console.log('Extracted unique subjects:', sortedSubjects);
      setUniqueSubjects(sortedSubjects);
    }
  }, [attendanceRecords]);

  useEffect(() => {
    const fetchStudentAndAttendance = async () => {
      try {
        setLoading(true);
        setError('');

        // Get the token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Set up axios headers
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        if (isOwnAttendance) {
          try {
            // For students viewing their own attendance, use the summary endpoint
            const summaryRes = await axios.get('/api/attendance/my-summary', { headers });

            if (summaryRes.data && summaryRes.data.student) {
              setStudent(summaryRes.data.student);

              // Process attendance records
              let records = [];

              // Check if attendanceRecords is in the response
              if (summaryRes.data.attendanceRecords && Array.isArray(summaryRes.data.attendanceRecords)) {
                console.log('Found attendanceRecords in response:', summaryRes.data.attendanceRecords.length);
                records = summaryRes.data.attendanceRecords.map(record => ({
                  _id: record._id,
                  date: record.date,
                  present: record.present,
                  subject: record.subject
                }));
              }
              // If not, check if the response itself is an array (some endpoints return the records directly)
              else if (Array.isArray(summaryRes.data)) {
                console.log('Response is an array of records:', summaryRes.data.length);
                records = summaryRes.data.map(record => ({
                  _id: record._id,
                  date: record.date,
                  present: record.present,
                  subject: record.subject
                }));
              }

              console.log('Processed attendance records:', records.length);
              setAttendanceRecords(records);

              // Store attendance summary
              if (summaryRes.data.summary) {
                setAttendanceSummary(summaryRes.data.summary);
                console.log('Attendance summary:', summaryRes.data.summary);
              }

              // Process monthly summary
              if (summaryRes.data.monthlyData && Array.isArray(summaryRes.data.monthlyData)) {
                console.log('Monthly data found:', summaryRes.data.monthlyData.length);
                setMonthlySummary(summaryRes.data.monthlyData);

                // Set the first month as selected by default
                if (summaryRes.data.monthlyData.length > 0) {
                  setSelectedMonth(summaryRes.data.monthlyData[0]);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching attendance summary:', err);
            setError('Failed to load attendance data. Please try again later.');
            toast.error('Failed to load attendance data');
          }
        } else {
          // For teachers/admins viewing a student's attendance
          try {
            const studentRes = await axios.get(`/api/attendance/student/${studentId}`, { headers });

            if (studentRes.data && studentRes.data.student) {
              setStudent(studentRes.data.student);

              // Process attendance records
              let records = [];

              // Check if attendanceRecords is in the response
              if (studentRes.data.attendanceRecords && Array.isArray(studentRes.data.attendanceRecords)) {
                console.log('Found attendanceRecords in response:', studentRes.data.attendanceRecords.length);
                records = studentRes.data.attendanceRecords.map(record => ({
                  _id: record._id,
                  date: record.date,
                  present: record.present,
                  subject: record.subject
                }));
              }
              // If not, check if the response itself is an array (some endpoints return the records directly)
              else if (Array.isArray(studentRes.data)) {
                console.log('Response is an array of records:', studentRes.data.length);
                records = studentRes.data.map(record => ({
                  _id: record._id,
                  date: record.date,
                  present: record.present,
                  subject: record.subject
                }));
              }

              console.log('Processed attendance records:', records.length);
              setAttendanceRecords(records);

              // Store attendance summary
              if (studentRes.data.summary) {
                setAttendanceSummary(studentRes.data.summary);
                console.log('Attendance summary:', studentRes.data.summary);
              }

              // Process monthly summary
              if (studentRes.data.monthlyData && Array.isArray(studentRes.data.monthlyData)) {
                console.log('Monthly data found:', studentRes.data.monthlyData.length);
                setMonthlySummary(studentRes.data.monthlyData);

                // Set the first month as selected by default
                if (studentRes.data.monthlyData.length > 0) {
                  setSelectedMonth(studentRes.data.monthlyData[0]);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching student attendance:', err);
            setError('Failed to load student attendance data. Please try again later.');
            toast.error('Failed to load student attendance data');
          }
        }
      } catch (err) {
        console.error('Error in fetchStudentAndAttendance:', err);
        setError('An error occurred while fetching attendance data.');
        toast.error('An error occurred while fetching attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndAttendance();
  }, [studentId, isOwnAttendance, user]);

  // Filter records based on date range, selected month, subject, and status
  useEffect(() => {
    if (attendanceRecords.length === 0) {
      setFilteredRecords([]);
      return;
    }

    console.log('Filtering records. Total records:', attendanceRecords.length);
    console.log('Date range:', dateRange);
    console.log('Selected month:', selectedMonth);
    console.log('Subject filter:', subjectFilter);
    console.log('Status filter:', statusFilter);

    let filtered = [...attendanceRecords];

    // Filter by date range
    filtered = filtered.filter(record => {
      try {
        // Ensure we have a valid date
        if (!record.date) {
          console.log('Record missing date:', record);
          return false;
        }

        const recordDate = new Date(record.date);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        // Check if dates are valid
        if (isNaN(recordDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.log('Invalid date in record:', record);
          return false;
        }

        // Set hours to 0 for accurate date comparison
        recordDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const isInRange = recordDate >= startDate && recordDate <= endDate;
        return isInRange;
      } catch (err) {
        console.error('Error filtering by date range:', err);
        return false;
      }
    });

    console.log('After date range filter:', filtered.length);

    // Filter by selected month if available
    if (selectedMonth) {
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(selectedMonth.month);

      if (monthIndex !== -1) {
        filtered = filtered.filter(record => {
          try {
            if (!record.date) return false;

            const recordDate = new Date(record.date);
            if (isNaN(recordDate.getTime())) return false;

            return recordDate.getMonth() === monthIndex && recordDate.getFullYear() === selectedMonth.year;
          } catch (err) {
            console.error('Error filtering by month:', err);
            return false;
          }
        });
      }

      console.log('After month filter:', filtered.length);
    }

    // Filter by subject if available
    if (subjectFilter && subjectFilter.trim() !== '') {
      filtered = filtered.filter(record => {
        try {
          // Check if subject exists and has a name
          if (!record.subject) return false;

          // Handle different subject data structures
          const subjectName = typeof record.subject === 'object'
            ? record.subject.name
            : typeof record.subject === 'string'
              ? record.subject
              : null;

          if (!subjectName) return false;

          // Exact match for dropdown selection
          return subjectName === subjectFilter;
        } catch (err) {
          console.error('Error filtering by subject:', err);
          return false;
        }
      });

      console.log('After subject filter:', filtered.length);
    }

    // Filter by status if not set to 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => {
        try {
          if (statusFilter === 'present') {
            return record.present === true;
          } else if (statusFilter === 'absent') {
            return record.present === false;
          }
          return true;
        } catch (err) {
          console.error('Error filtering by status:', err);
          return false;
        }
      });

      console.log('After status filter:', filtered.length);
    }

    console.log('Final filtered records:', filtered.length);
    setFilteredRecords(filtered);
  }, [attendanceRecords, dateRange, selectedMonth, subjectFilter, statusFilter]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate attendance percentage
  const calculateAttendancePercentage = () => {
    // Use the summary data from the backend if available
    if (attendanceSummary && attendanceSummary.attendancePercentage !== undefined) {
      return attendanceSummary.attendancePercentage;
    }

    // Fallback to calculating from records if summary is not available
    if (!attendanceRecords || attendanceRecords.length === 0) return 0;

    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(record => record.present).length;

    return Math.round((presentRecords / totalRecords) * 100);
  };

  // Get percentage color class
  const getPercentageColorClass = (percentage) => {
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);

    // Apply filters immediately when a month is selected
    if (attendanceRecords.length === 0) {
      setFilteredRecords([]);
      return;
    }

    console.log('Filtering by selected month:', month.month, month.year);

    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(month.month);

    if (monthIndex === -1) {
      console.error('Invalid month name:', month.month);
      return;
    }

    // Filter by date range and selected month
    let filtered = [...attendanceRecords].filter(record => {
      try {
        if (!record.date) return false;

        const recordDate = new Date(record.date);
        if (isNaN(recordDate.getTime())) return false;

        // Check if the record is from the selected month and year
        const isInSelectedMonth = recordDate.getMonth() === monthIndex && recordDate.getFullYear() === month.year;

        // Also apply date range filter
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return isInSelectedMonth;
        }

        recordDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const isInDateRange = recordDate >= startDate && recordDate <= endDate;

        return isInSelectedMonth && isInDateRange;
      } catch (err) {
        console.error('Error filtering by month:', err);
        return false;
      }
    });

    // Also apply subject filter if available
    if (subjectFilter && subjectFilter.trim() !== '') {
      filtered = filtered.filter(record => {
        try {
          if (!record.subject) return false;

          const subjectName = typeof record.subject === 'object'
            ? record.subject.name
            : typeof record.subject === 'string'
              ? record.subject
              : null;

          if (!subjectName) return false;

          // Exact match for dropdown selection
          return subjectName === subjectFilter;
        } catch (err) {
          console.error('Error filtering by subject:', err);
          return false;
        }
      });
    }

    // Filter by status if not set to 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => {
        try {
          if (statusFilter === 'present') {
            return record.present === true;
          } else if (statusFilter === 'absent') {
            return record.present === false;
          }
          return true;
        } catch (err) {
          console.error('Error filtering by status:', err);
          return false;
        }
      });
    }

    console.log('Filtered records after month selection:', filtered.length);
    setFilteredRecords(filtered);

    // Show toast notification
    toast.info(`Showing attendance for ${month.month} ${month.year}`);
  };

  // Handle subject filter change
  const handleSubjectFilterChange = (e) => {
    setSubjectFilter(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Reset filters
  const resetFilters = () => {
    // Reset filter values
    const newDateRange = {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };

    setDateRange(newDateRange);
    setSelectedMonth(monthlySummary.length > 0 ? monthlySummary[0] : null);
    setSubjectFilter('');
    setStatusFilter('all');

    // Apply the reset filters
    if (attendanceRecords.length === 0) {
      setFilteredRecords([]);
      return;
    }

    console.log('Resetting and applying filters');

    // Filter by the new date range only
    let filtered = [...attendanceRecords].filter(record => {
      try {
        if (!record.date) return false;

        const recordDate = new Date(record.date);
        const startDate = new Date(newDateRange.startDate);
        const endDate = new Date(newDateRange.endDate);

        if (isNaN(recordDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }

        recordDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return recordDate >= startDate && recordDate <= endDate;
      } catch (err) {
        console.error('Error filtering by date range:', err);
        return false;
      }
    });

    console.log('Filtered records after reset:', filtered.length);
    setFilteredRecords(filtered);

    // Show toast notification
    toast.info('Filters have been reset');
  };

  // Get student initials for avatar
  const getStudentInitials = () => {
    if (!student || !student.name) return 'S';

    const nameParts = student.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="attendance-page">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="page-header">
        <h1 className="page-title">
          <FaUserGraduate className="icon" />
          {isOwnAttendance ? 'My Attendance' : 'Student Attendance'}
        </h1>
        {!isOwnAttendance && (
          <Link to="/students" className="back-button">
            <FaArrowLeft /> Back to Students
          </Link>
        )}
        {isOwnAttendance && (
          <Link to="/student-dashboard" className="back-button">
            <FaArrowLeft /> Back to Dashboard
          </Link>
        )}
      </div>

      {error && (
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <div className="error-content">
            <h3 className="error-title">Error</h3>
            <p className="error-message">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading attendance data...</p>
        </div>
      ) : student ? (
        <>
          {/* Student Info Card */}
          <div className="student-card">
            <div className="student-details">
              <div className="student-avatar">
                {getStudentInitials()}
              </div>
              <div className="student-info">
                <h2 className="student-name">{student.name}</h2>
                <p className="student-email">
                  <FaEnvelope className="icon" /> {student.email}
                </p>
                <div className="student-meta">
                  <div className="meta-item">
                    <FaGraduationCap className="icon" /> {student.branch || 'No Branch'}
                  </div>
                  <div className="meta-item">
                    <FaSchool className="icon" /> Semester {student.semester || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="summary-container">
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="summary-icon">
                  <FaCalendarAlt />
                </div>
                <div className="summary-label">Total Classes</div>
                <div className="summary-value">
                  {attendanceSummary.totalDays || attendanceRecords.length}
                </div>
                <div className="summary-trend">
                  This Semester
                </div>
              </div>

              <div className="summary-card present">
                <div className="summary-icon">
                  <FaCheck />
                </div>
                <div className="summary-label">Present</div>
                <div className="summary-value">
                  {attendanceSummary.presentDays || attendanceRecords.filter(record => record.present).length}
                </div>
                <div className={`summary-trend ${
                  attendanceSummary.presentDays !== undefined
                    ? (attendanceSummary.presentDays / (attendanceSummary.totalDays || 1) >= 0.75 ? 'trend-up' : 'trend-down')
                    : (attendanceRecords.filter(record => record.present).length / (attendanceRecords.length || 1) >= 0.75 ? 'trend-up' : 'trend-down')
                }`}>
                  {attendanceSummary.presentDays !== undefined
                    ? (attendanceSummary.presentDays / (attendanceSummary.totalDays || 1) >= 0.75
                        ? <><FaArrowUp /> Good Standing</>
                        : <><FaArrowDown /> Needs Improvement</>)
                    : (attendanceRecords.filter(record => record.present).length / (attendanceRecords.length || 1) >= 0.75
                        ? <><FaArrowUp /> Good Standing</>
                        : <><FaArrowDown /> Needs Improvement</>)
                  }
                </div>
              </div>

              <div className="summary-card absent">
                <div className="summary-icon">
                  <FaTimes />
                </div>
                <div className="summary-label">Absent</div>
                <div className="summary-value">
                  {attendanceSummary.absentDays || attendanceRecords.filter(record => !record.present).length}
                </div>
                <div className={`summary-trend ${
                  attendanceSummary.absentDays !== undefined
                    ? (attendanceSummary.absentDays / (attendanceSummary.totalDays || 1) <= 0.25 ? 'trend-up' : 'trend-down')
                    : (attendanceRecords.filter(record => !record.present).length / (attendanceRecords.length || 1) <= 0.25 ? 'trend-up' : 'trend-down')
                }`}>
                  {attendanceSummary.absentDays !== undefined
                    ? (attendanceSummary.absentDays / (attendanceSummary.totalDays || 1) <= 0.25
                        ? <><FaArrowUp /> Acceptable Level</>
                        : <><FaArrowDown /> Too Many Absences</>)
                    : (attendanceRecords.filter(record => !record.present).length / (attendanceRecords.length || 1) <= 0.25
                        ? <><FaArrowUp /> Acceptable Level</>
                        : <><FaArrowDown /> Too Many Absences</>)
                  }
                </div>
              </div>

              <div className="summary-card percentage">
                <div className="summary-icon">
                  <FaChartBar />
                </div>
                <div className="summary-label">Attendance</div>
                <div className="summary-value">{calculateAttendancePercentage()}%</div>
                <div className={`summary-trend ${calculateAttendancePercentage() >= 75 ? 'trend-up' : 'trend-down'}`}>
                  {calculateAttendancePercentage() >= 75 ? (
                    <><FaArrowUp /> Above Required</>
                  ) : (
                    <><FaArrowDown /> Below Required</>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-container">
            <h3 className="filters-title">
              <FaFilter className="icon" /> Filter Attendance Records
            </h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="filter-input"
                  max={dateRange.endDate}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="filter-input"
                  min={dateRange.startDate}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Subject</label>
                <select
                  value={subjectFilter}
                  onChange={handleSubjectFilterChange}
                  className="filter-input"
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="filter-input"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                </select>
              </div>

              <div className="filter-group">
                <button onClick={() => {
                  // Apply filters manually instead of relying on the useEffect
                  if (attendanceRecords.length === 0) {
                    setFilteredRecords([]);
                    return;
                  }

                  console.log('Manually applying filters');

                  let filtered = [...attendanceRecords];

                  // Filter by date range
                  filtered = filtered.filter(record => {
                    try {
                      if (!record.date) return false;

                      const recordDate = new Date(record.date);
                      const startDate = new Date(dateRange.startDate);
                      const endDate = new Date(dateRange.endDate);

                      if (isNaN(recordDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        return false;
                      }

                      recordDate.setHours(0, 0, 0, 0);
                      startDate.setHours(0, 0, 0, 0);
                      endDate.setHours(0, 0, 0, 0);

                      return recordDate >= startDate && recordDate <= endDate;
                    } catch (err) {
                      console.error('Error filtering by date range:', err);
                      return false;
                    }
                  });

                  // Filter by selected month if available
                  if (selectedMonth) {
                    const monthIndex = [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].indexOf(selectedMonth.month);

                    if (monthIndex !== -1) {
                      filtered = filtered.filter(record => {
                        try {
                          if (!record.date) return false;

                          const recordDate = new Date(record.date);
                          if (isNaN(recordDate.getTime())) return false;

                          return recordDate.getMonth() === monthIndex && recordDate.getFullYear() === selectedMonth.year;
                        } catch (err) {
                          console.error('Error filtering by month:', err);
                          return false;
                        }
                      });
                    }
                  }

                  // Filter by subject if available
                  if (subjectFilter && subjectFilter.trim() !== '') {
                    filtered = filtered.filter(record => {
                      try {
                        if (!record.subject) return false;

                        const subjectName = typeof record.subject === 'object'
                          ? record.subject.name
                          : typeof record.subject === 'string'
                            ? record.subject
                            : null;

                        if (!subjectName) return false;

                        // Exact match for dropdown selection
                        return subjectName === subjectFilter;
                      } catch (err) {
                        console.error('Error filtering by subject:', err);
                        return false;
                      }
                    });
                  }

                  // Filter by status if not set to 'all'
                  if (statusFilter !== 'all') {
                    filtered = filtered.filter(record => {
                      try {
                        if (statusFilter === 'present') {
                          return record.present === true;
                        } else if (statusFilter === 'absent') {
                          return record.present === false;
                        }
                        return true;
                      } catch (err) {
                        console.error('Error filtering by status:', err);
                        return false;
                      }
                    });
                  }

                  console.log('Filtered records:', filtered.length);
                  setFilteredRecords(filtered);

                  // Show toast notification with filter results
                  toast.info(`Found ${filtered.length} attendance records matching your filters`);
                }} className="filter-button" style={{ backgroundColor: '#4361ee' }}>
                  <FaFilter /> Apply Filters
                </button>
              </div>

              <div className="filter-group">
                <button onClick={resetFilters} className="filter-button" style={{ backgroundColor: '#6c757d' }}>
                  <FaSync /> Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Attendance */}
          {monthlySummary.length > 0 && (
            <div className="monthly-container">
              <h3 className="monthly-title">
                <FaChartBar className="icon" /> Monthly Attendance
              </h3>
              <div className="monthly-grid">
                {monthlySummary.map((month, index) => (
                  <div
                    key={`${month.month}-${month.year}`}
                    className={`month-card ${selectedMonth && selectedMonth.month === month.month && selectedMonth.year === month.year ? 'selected' : ''}`}
                    onClick={() => handleMonthSelect(month)}
                  >
                    <div className="month-header">
                      <div className="month-name">{month.month}</div>
                      <div className="month-year">{month.year}</div>
                    </div>
                    <div className="month-stats">
                      <div className="month-stat">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{month.totalDays}</span>
                      </div>
                      <div className="month-stat">
                        <span className="stat-label">Present</span>
                        <span className="stat-value">{month.presentDays}</span>
                      </div>
                      <div className="month-stat">
                        <span className="stat-label">Absent</span>
                        <span className="stat-value">{month.absentDays}</span>
                      </div>
                    </div>
                    <div className="month-percentage">
                      <div className="percentage-bar">
                        <div
                          className={`percentage-fill ${getPercentageColorClass(month.percentage)}`}
                          style={{ width: `${month.percentage}%` }}
                        ></div>
                      </div>
                      <div className={`percentage-text ${getPercentageColorClass(month.percentage)}`}>
                        {month.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance History */}
          {filteredRecords.length > 0 ? (
            <div className="history-container">
              <div className="history-header">
                <h3 className="history-title">
                  <FaTable className="icon" /> Attendance History
                </h3>
                <div className="history-actions">
                  <button className="history-action-btn" title="Download">
                    <FaDownload />
                  </button>
                  <button className="history-action-btn" title="Print">
                    <FaPrint />
                  </button>
                  <button className="history-action-btn" title="Refresh">
                    <FaSync />
                  </button>
                  <button className="history-action-btn" title="More Options">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(record => (
                        <tr key={record._id}>
                          <td className="date-cell">
                            <FaCalendarAlt className="icon" />
                            {formatDate(record.date)}
                          </td>
                          <td className="subject-cell">
                            <FaBook className="icon" />
                            {record.subject?.name || 'Not specified'}
                          </td>
                          <td>
                            <div className={`status-cell ${record.present ? 'present' : 'absent'}`}>
                              {record.present ? (
                                <><FaCheck className="icon" /> Present</>
                              ) : (
                                <><FaTimes className="icon" /> Absent</>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FaTable className="empty-icon" />
              <p className="empty-text">No attendance records found for the selected filters.</p>
              <button onClick={resetFilters} className="empty-button">
                <FaSync /> Reset Filters
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <FaUserGraduate className="empty-icon" />
          <p className="empty-text">
            {isOwnAttendance
              ? 'Your student profile could not be loaded. Please contact an administrator.'
              : 'The student you are looking for does not exist or has been removed.'}
          </p>
          {!isOwnAttendance ? (
            <Link to="/students" className="empty-button">
              <FaArrowLeft /> Back to Students
            </Link>
          ) : (
            <Link to="/student-dashboard" className="empty-button">
              <FaArrowLeft /> Back to Dashboard
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceModern;
