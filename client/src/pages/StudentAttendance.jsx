import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaTimes, FaUserGraduate, FaBook, FaTable } from 'react-icons/fa';
import '../styles/StudentAttendance.css';

const StudentAttendance = () => {
  const { studentId } = useParams();
  const { token, user } = useContext(AuthContext);
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

  // Determine if this is a student viewing their own attendance
  const isOwnAttendance = (!studentId && user?.role === 'student') || (studentId === user?.id);

  useEffect(() => {
    if (!token) return;
    if (!studentId && !isOwnAttendance) return;

    const fetchStudentAndAttendance = async () => {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        if (isOwnAttendance) {
          try {
            // For students viewing their own attendance, use the summary endpoint
            const summaryRes = await axios.get('/api/attendance/my-summary');
            console.log('Summary response:', summaryRes.data);

            if (summaryRes.data && summaryRes.data.student) {
              setStudent(summaryRes.data.student);
              setMonthlySummary(summaryRes.data.monthlyData || []);

              // Also fetch detailed attendance records
              if (user && user.id) {
                const attendanceRes = await axios.get(`/api/attendance/student/${user.id}`);
                console.log('Attendance records:', attendanceRes.data);

                // Check if the response has attendanceRecords property or is an array directly
                let records = [];
                if (Array.isArray(attendanceRes.data)) {
                  records = attendanceRes.data;
                } else if (attendanceRes.data && Array.isArray(attendanceRes.data.attendanceRecords)) {
                  records = attendanceRes.data.attendanceRecords;
                } else {
                  console.error('Unexpected attendance data format:', attendanceRes.data);
                  records = [];
                }

                // Log each record to check the present field
                console.log('Attendance records details:');
                records.forEach(record => {
                  console.log(`Record ID: ${record._id}, Date: ${record.date}, Present: ${record.present}, Subject: ${record.subject?.name || 'Unknown'}`);
                });

                setAttendanceRecords(records);
              } else {
                console.error('User ID is undefined');
                setError('User ID is undefined. Please log in again.');
                setAttendanceRecords([]);
              }
            } else {
              // If no student data in summary, try to use the user context data
              console.log('No student data in summary, using user context data');
              setStudent({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branch: user.branch || 'Not assigned',
                semester: user.semester || 'Not assigned'
              });

              // Still try to fetch attendance records
              try {
                if (user && user.id) {
                  const attendanceRes = await axios.get(`/api/attendance/student/${user.id}`);

                  // Check if the response has attendanceRecords property or is an array directly
                  if (Array.isArray(attendanceRes.data)) {
                    setAttendanceRecords(attendanceRes.data);
                  } else if (attendanceRes.data && Array.isArray(attendanceRes.data.attendanceRecords)) {
                    setAttendanceRecords(attendanceRes.data.attendanceRecords);
                  } else {
                    console.error('Unexpected attendance data format:', attendanceRes.data);
                    setAttendanceRecords([]);
                  }
                } else {
                  console.error('User ID is undefined');
                  setError('User ID is undefined. Please log in again.');
                  setAttendanceRecords([]);
                }
              } catch (attendanceErr) {
                console.error('Error fetching attendance records:', attendanceErr);
                setAttendanceRecords([]);
              }
            }
          } catch (summaryErr) {
            console.error('Error fetching summary:', summaryErr);
            // If summary fails, use user context data
            setStudent({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              branch: user.branch || 'Not assigned',
              semester: user.semester || 'Not assigned'
            });
            setMonthlySummary([]);

            // Still try to fetch attendance records
            try {
              if (user && user.id) {
                const attendanceRes = await axios.get(`/api/attendance/student/${user.id}`);

                // Check if the response has attendanceRecords property or is an array directly
                if (Array.isArray(attendanceRes.data)) {
                  setAttendanceRecords(attendanceRes.data);
                } else if (attendanceRes.data && Array.isArray(attendanceRes.data.attendanceRecords)) {
                  setAttendanceRecords(attendanceRes.data.attendanceRecords);
                } else {
                  console.error('Unexpected attendance data format:', attendanceRes.data);
                  setAttendanceRecords([]);
                }
              } else {
                console.error('User ID is undefined');
                setError('User ID is undefined. Please log in again.');
                setAttendanceRecords([]);
              }
            } catch (attendanceErr) {
              console.error('Error fetching attendance records:', attendanceErr);
              setAttendanceRecords([]);
            }
          }
        } else {
          // For teachers viewing a student's attendance
          // Fetch student details
          const studentRes = await axios.get(`/api/users/${studentId}`);
          setStudent(studentRes.data);

          // Fetch attendance records
          const attendanceRes = await axios.get(`/api/attendance/student/${studentId}`);
          console.log('Attendance response data structure:', JSON.stringify(attendanceRes.data).substring(0, 200) + '...');

          // Check if the response has attendanceRecords property or is an array directly
          if (Array.isArray(attendanceRes.data)) {
            setAttendanceRecords(attendanceRes.data);
          } else if (attendanceRes.data && Array.isArray(attendanceRes.data.attendanceRecords)) {
            setAttendanceRecords(attendanceRes.data.attendanceRecords);
          } else {
            console.error('Unexpected attendance data format:', attendanceRes.data);
            setAttendanceRecords([]);
          }
        }

        setError('');
      } catch (err) {
        console.error('Error fetching student attendance:', err);

        // If the user is a student viewing their own attendance, provide a more helpful error message
        if (isOwnAttendance) {
          setError('Failed to load your attendance data. Please try again later or contact your administrator.');

          // Still set student data from user context to avoid "Student Not Found" error
          if (user) {
            setStudent({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              branch: user.branch || 'Not assigned',
              semester: user.semester || 'Not assigned'
            });
          }
        } else {
          setError('Failed to load attendance data: ' + (err.response?.data?.msg || err.message));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndAttendance();
  }, [token, studentId, user, isOwnAttendance]);

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
    // Reset selected month when manually changing date range
    setSelectedMonth(null);
  };

  const handleMonthSelect = (month) => {
    // If already selected, deselect it
    if (selectedMonth && selectedMonth.month === month.month && selectedMonth.year === month.year) {
      setSelectedMonth(null);
      return;
    }

    setSelectedMonth(month);

    // Set date range to the selected month
    const startDate = new Date(month.year, getMonthNumber(month.month), 1);
    const endDate = new Date(month.year, getMonthNumber(month.month) + 1, 0); // Last day of month

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Helper function to get month number from month name
  const getMonthNumber = (monthName) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.findIndex(month => month === monthName);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter attendance records by date range
  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    // Set time to beginning of day for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return recordDate >= startDate && recordDate <= endDate;
  });

  // Calculate attendance statistics
  const totalDays = filteredRecords.length;
  const presentDays = filteredRecords.filter(record => record.present).length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="student-attendance-page">
      <div className="page-header">
        <h1>
          <FaUserGraduate className="icon" />
          {isOwnAttendance ? 'My Attendance' : 'Student Attendance'}
        </h1>
        {!isOwnAttendance && (
          <Link to="/students" className="btn btn-outline">
            <FaArrowLeft /> Back to Students
          </Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading student attendance...</div>
      ) : student ? (
        <>
          <div className="student-info-card">
            <div className="student-details">
              <h2>{student.name}</h2>
              <p className="student-email">{student.email}</p>
              <div className="student-meta">
                <span className="branch">Branch: {student.branch}</span>
                <span className="semester">Semester: {student.semester}</span>
              </div>
            </div>
          </div>

          <div className="attendance-filters">
            <div className="filter-group">
              <label htmlFor="startDate">From:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                max={dateRange.endDate}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="endDate">To:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                min={dateRange.startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {selectedMonth && (
              <div className="selected-month-indicator">
                <span>Viewing: {selectedMonth.month} {selectedMonth.year}</span>
                <button
                  className="btn-clear"
                  onClick={() => {
                    setSelectedMonth(null);
                    setDateRange({
                      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="attendance-summary">
            <div className="summary-card">
              <div className="summary-title">Total Days</div>
              <div className="summary-value">{totalDays}</div>
            </div>

            <div className="summary-card present">
              <div className="summary-title">Present</div>
              <div className="summary-value">{presentDays}</div>
            </div>

            <div className="summary-card absent">
              <div className="summary-title">Absent</div>
              <div className="summary-value">{absentDays}</div>
            </div>

            <div className="summary-card percentage">
              <div className="summary-title">Attendance</div>
              <div className="summary-value">{attendancePercentage}%</div>
            </div>
          </div>

          {isOwnAttendance && monthlySummary.length > 0 && (
            <div className="monthly-summary">
              <h3>Monthly Attendance Summary</h3>
              <p className="monthly-help-text">Click on a month to view detailed attendance for that period</p>
              <div className="monthly-grid">
                {monthlySummary.map((month, index) => (
                  <div
                    key={index}
                    className={`month-card ${selectedMonth && selectedMonth.month === month.month && selectedMonth.year === month.year ? 'selected' : ''}`}
                    onClick={() => handleMonthSelect(month)}
                  >
                    <div className="month-header">
                      <span className="month-name">{month.month}</span>
                      <span className="month-year">{month.year}</span>
                    </div>
                    <div className="month-stats">
                      <div className="month-stat">
                        <span className="stat-label">Days</span>
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
                          className="percentage-fill"
                          style={{ width: `${month.percentage}%` }}
                        ></div>
                      </div>
                      <span className="percentage-text">{month.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredRecords.length > 0 ? (
            <div className="attendance-history">
              <h3><FaTable className="icon" /> Attendance History</h3>
              <div className="attendance-table-container">
                {/* Group records by date */}
                {Object.entries(
                  filteredRecords
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .reduce((acc, record) => {
                      // Format the date to use as a key
                      const dateKey = formatDate(record.date);
                      if (!acc[dateKey]) {
                        acc[dateKey] = [];
                      }
                      acc[dateKey].push(record);
                      return acc;
                    }, {})
                )
                  .map(([date, records]) => (
                    <div key={date} className="attendance-date-group">
                      <div className="date-header">
                        <FaCalendarAlt className="icon" /> {date}
                      </div>
                      <div className="subject-records">
                        {records.map(record => (
                          <div key={record._id} className={`subject-record ${record.present ? 'present' : 'absent'}`}>
                            <div className="subject-name">
                              <FaBook className="icon" /> {record.subject?.name || 'Not specified'}
                            </div>
                            <div className={`status-indicator ${record.present ? 'present' : 'absent'}`}>
                              {record.present ? (
                                <><FaCheck className="icon" /> Present</>
                              ) : (
                                <><FaTimes className="icon" /> Absent</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="no-records">
              <p>No attendance records found for the selected date range.</p>
            </div>
          )}
        </>
      ) : (
        <div className="not-found">
          <h2>Student Not Found</h2>
          <p>{isOwnAttendance
            ? 'Your student profile could not be loaded. Please contact an administrator.'
            : 'The student you are looking for does not exist or has been removed.'}</p>
          {!isOwnAttendance && (
            <Link to="/students" className="btn btn-primary">
              <FaArrowLeft /> Back to Students
            </Link>
          )}
          {isOwnAttendance && (
            <Link to="/dashboard" className="btn btn-primary">
              <FaArrowLeft /> Back to Dashboard
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
