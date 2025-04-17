import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AttendanceRecord = () => {
  const { user, token } = useContext(AuthContext);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch courses first
        const coursesRes = await axios.get('http://localhost:5000/api/courses');
        setCourses(coursesRes.data);

        // Fetch attendance records
        const recordsRes = await axios.get('http://localhost:5000/api/attendance/student');
        setAttendanceRecords(recordsRes.data);

        // Fetch attendance statistics
        const statsRes = await axios.get('http://localhost:5000/api/attendance/stats/student');
        setStats(statsRes.data);

        setError('');
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [token]);

  // Group attendance records by course
  const groupedRecords = attendanceRecords.reduce((acc, record) => {
    // Skip records with missing course info
    if (!record.course || !record.course._id) return acc;

    const courseId = record.course._id;
    if (!acc[courseId]) {
      acc[courseId] = {
        courseInfo: record.course,
        records: []
      };
    }
    acc[courseId].records.push(record);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading attendance records...</div>;
  }

  return (
    <div className="attendance-record">
      {error && <div className="error-message">{error}</div>}

      {user && (
        <div className="user-info-banner">
          <h3>Attendance Records for {user.name}</h3>
          <p>Email: {user.email}</p>
          <p>Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
        </div>
      )}

      {stats && (
        <div className="attendance-stats">
          <h3>Attendance Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Overall Attendance</h4>
              <p className="stat-value">{stats.attendancePercentage.toFixed(2)}%</p>
              <div className="stat-details">
                <span>Present: {stats.presentCount}</span>
                <span>Absent: {stats.absentCount}</span>
                <span>Late: {stats.lateCount}</span>
              </div>
            </div>

            <div className="stat-card">
              <h4>Total Courses</h4>
              <p className="stat-value">{stats.totalCourses}</p>
            </div>

            <div className="stat-card">
              <h4>Total Classes</h4>
              <p className="stat-value">{stats.totalAttendance}</p>
            </div>
          </div>
        </div>
      )}

      {courses.length > 0 && (
        <div className="enrolled-courses">
          <h3>Enrolled Courses</h3>
          <div className="courses-list">
            {courses.map(course => (
              <div key={course._id} className="course-item">
                <span className="course-name">{course.name}</span>
                <span className="course-code">({course.code})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.values(groupedRecords).length > 0 ? (
        <div className="course-attendance">
          <h3>Attendance by Course</h3>

          {Object.values(groupedRecords).map(({ courseInfo, records }) => {
            // Calculate course statistics
            const totalClasses = records.length;
            const presentCount = records.filter(r => r.status === 'present').length;
            const absentCount = records.filter(r => r.status === 'absent').length;
            const lateCount = records.filter(r => r.status === 'late').length;
            const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

            return (
              <div key={courseInfo._id} className="course-section">
                <div className="course-header">
                  <h4>{courseInfo.name} ({courseInfo.code})</h4>
                  <div className="course-stats">
                    <span className="attendance-percentage">
                      {attendancePercentage.toFixed(2)}%
                    </span>
                    <span className="attendance-counts">
                      Present: {presentCount} | Absent: {absentCount} | Late: {lateCount}
                    </span>
                  </div>
                </div>

                <ul className="attendance-list">
                  {records.map((record) => (
                    <li key={record._id} className={`attendance-item status-${record.status}`}>
                      <div className="attendance-info">
                        <span className="attendance-date">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="attendance-status">
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                      {record.notes && <p className="attendance-notes">{record.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-records">
          <p>No attendance records found.</p>
          {courses.length > 0 ? (
            <p>You are enrolled in courses, but no attendance has been recorded yet.</p>
          ) : (
            <p>You are not enrolled in any courses yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceRecord;
