import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FaBook, FaCalendarAlt, FaBell, FaPercentage, FaClipboardCheck, FaGraduationCap } from 'react-icons/fa';
import NoticeWidget from '../components/NoticeWidget';
// import '../styles/StudentDashboardNew.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register the Filler plugin for fill: true option
);

const StudentDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalNotices: 0,
    attendanceBySubject: {},
    attendanceByMonth: {},
    recentAttendance: [],
    borrowedBooks: []
  });

  // Redirect if not student
  if (!user) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (user.role !== 'student') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch subjects data
        let subjects = [];
        try {
          const subjectsRes = await axios.get('/api/subjects');
          subjects = subjectsRes.data || [];
        } catch (err) {
          console.error('Error fetching subjects:', err);
        }

        // Fetch notices data
        let notices = [];
        try {
          const noticesRes = await axios.get('/api/notices');
          notices = noticesRes.data || [];
        } catch (err) {
          console.error('Error fetching notices:', err);
        }

        // Fetch student attendance data
        let attendance = [];
        try {
          // Use the student's own ID to fetch attendance data
          const attendanceRes = await axios.get(`/api/attendance/student/${user.id}`);
          attendance = attendanceRes.data || [];
          console.log('Fetched attendance data:', attendance);
        } catch (err) {
          console.error('Error fetching attendance:', err);
        }

        // Fetch borrowed books
        let borrowedBooks = [];
        try {
          const booksRes = await axios.get('/api/books/issues/current');
          borrowedBooks = booksRes.data || [];
        } catch (err) {
          console.error('Error fetching borrowed books:', err);
        }

        // Calculate attendance by subject
        const attendanceBySubject = {};
        subjects.forEach(subject => {
          // Filter attendance records for this subject
          // Note: In the attendance records, subject is an object with _id property
          const subjectAttendance = attendance.filter(a =>
            a.subject && (a.subject._id === subject._id || a.subject === subject._id)
          );

          const totalSessions = subjectAttendance.length;
          // Check the 'present' field which is a boolean in the attendance model
          const presentSessions = subjectAttendance.filter(a => a.present === true).length;

          console.log(`Subject: ${subject.name}, Total: ${totalSessions}, Present: ${presentSessions}`);

          attendanceBySubject[subject.name] = totalSessions > 0
            ? Math.round((presentSessions / totalSessions) * 100)
            : 0;
        });

        // Calculate attendance by month
        const attendanceByMonth = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(month => {
          attendanceByMonth[month] = { present: 0, absent: 0, total: 0 };
        });

        attendance.forEach(a => {
          const date = new Date(a.date);
          const month = months[date.getMonth()];
          attendanceByMonth[month].total += 1;

          // Use the 'present' boolean field from the attendance model
          if (a.present === true) {
            attendanceByMonth[month].present += 1;
          } else {
            attendanceByMonth[month].absent += 1;
          }
        });

        // Get recent attendance (last 5 sessions)
        const recentAttendance = attendance
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        // Debug log for attendance records
        console.log('Recent attendance records:', recentAttendance);
        recentAttendance.forEach(record => {
          console.log(`Attendance record: Date=${new Date(record.date).toLocaleDateString()}, Present=${record.present}, Subject=${record.subject?.name || 'Unknown'}`);
        });

        // Set all stats
        setStats({
          totalSubjects: subjects.length,
          totalNotices: notices.length,
          attendanceBySubject,
          attendanceByMonth,
          recentAttendance,
          borrowedBooks
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Chart options and data
  const subjectChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance by Subject (%)',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Attendance: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
    },
  };

  // Filter out subjects with no attendance data
  const subjectsWithData = {};
  Object.entries(stats.attendanceBySubject).forEach(([subject, percentage]) => {
    // Only include subjects with valid data
    if (percentage !== null && percentage !== undefined && !isNaN(percentage)) {
      // Ensure percentage is between 0 and 100
      subjectsWithData[subject] = Math.max(0, Math.min(100, percentage));
    }
  });

  const subjectChartData = {
    labels: Object.keys(subjectsWithData),
    datasets: [
      {
        label: 'Attendance Percentage',
        data: Object.values(subjectsWithData),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Attendance',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0, // Ensure no negative values
        ticks: {
          precision: 0, // Only show integer values
          callback: function(value) {
            if (value < 0) return 0; // Additional safeguard against negative values
            return value;
          }
        }
      }
    }
  };

  // Filter out months with no attendance data
  const monthsWithData = Object.entries(stats.attendanceByMonth)
    .filter(([_, data]) => data.total > 0)
    .map(([month, _]) => month);

  const monthlyAttendanceData = Object.entries(stats.attendanceByMonth)
    .filter(([month, _]) => monthsWithData.includes(month))
    .map(([_, data]) => ({
      present: Math.max(0, data.present || 0), // Ensure no negative values
      absent: Math.max(0, data.absent || 0)    // Ensure no negative values
    }));

  const monthlyChartData = {
    labels: monthsWithData,
    datasets: [
      {
        label: 'Present',
        data: monthlyAttendanceData.map(m => m.present),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
      {
        label: 'Absent',
        data: monthlyAttendanceData.map(m => m.absent),
        backgroundColor: 'rgba(236, 72, 153, 0.7)',
        borderColor: 'rgba(219, 39, 119, 1)',
        borderWidth: 1,
      },
    ],
  };

  const overallAttendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Overall Attendance',
        font: {
          size: 16
        }
      },
    },
  };

  const calculateOverallAttendance = () => {
    const totalPresent = Object.values(stats.attendanceByMonth).reduce((sum, month) => sum + month.present, 0);
    const totalSessions = Object.values(stats.attendanceByMonth).reduce((sum, month) => sum + month.total, 0);

    if (totalSessions === 0) return [100, 0];

    const presentPercentage = Math.round((totalPresent / totalSessions) * 100);
    const absentPercentage = 100 - presentPercentage;

    return [presentPercentage, absentPercentage];
  };

  const overallAttendanceData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Attendance',
        data: calculateOverallAttendance(),
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)',
          'rgba(219, 39, 119, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Student Dashboard</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Grid */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <div className="stat-details">
              <div className="stat-label">Total Subjects</div>
              <div className="stat-value">{stats.totalSubjects}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaClipboardCheck />
            </div>
            <div className="stat-details">
              <div className="stat-label">Overall Attendance</div>
              <div className="stat-value">{calculateOverallAttendance()[0]}%</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <div className="stat-details">
              <div className="stat-label">Borrowed Books</div>
              <div className="stat-value">{stats.borrowedBooks.length}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaBell />
            </div>
            <div className="stat-details">
              <div className="stat-label">Notices</div>
              <div className="stat-value">{stats.totalNotices}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="charts-container">
          {Object.keys(stats.attendanceBySubject).length > 0 ? (
            <div className="chart-card">
              <Bar options={subjectChartOptions} data={subjectChartData} />
            </div>
          ) : (
            <div className="chart-card no-data">
              <p>No subject attendance data available.</p>
            </div>
          )}

          {Object.values(stats.attendanceByMonth).some(m => m.total > 0) ? (
            <div className="chart-card">
              <Line options={monthlyChartOptions} data={monthlyChartData} />
            </div>
          ) : (
            <div className="chart-card no-data">
              <p>No monthly attendance data available.</p>
            </div>
          )}

          {Object.values(stats.attendanceByMonth).some(m => m.total > 0) ? (
            <div className="chart-card overall-attendance">
              <Doughnut options={overallAttendanceOptions} data={overallAttendanceData} />
              <div className="attendance-percentage-display">
                <div className="percentage-value">{calculateOverallAttendance()[0]}%</div>
                <div className="percentage-label">Overall Attendance</div>
              </div>
            </div>
          ) : (
            <div className="chart-card no-data">
              <p>No overall attendance data available.</p>
            </div>
          )}
        </div>

        <div className="dashboard-sidebar">
          <div className="recent-attendance">
            <h2><FaClipboardCheck className="icon" /> Recent Attendance</h2>
            {stats.recentAttendance.length > 0 ? (
              <div className="attendance-list">
                {stats.recentAttendance.map(attendance => (
                  <div
                    className={`attendance-item ${attendance.present ? 'present' : 'absent'}`}
                    key={attendance._id}
                  >
                    <div className="attendance-info">
                      <p className="attendance-date">
                        <FaCalendarAlt className="icon" /> {new Date(attendance.date).toLocaleDateString()}
                      </p>
                      <p className="attendance-subject">
                        <FaBook className="icon" /> {attendance.subject?.name || attendance.subjectName || 'Unknown Subject'}
                      </p>
                    </div>
                    <div className="attendance-status">
                      {attendance.present ? 'Present' : 'Absent'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-text">No recent attendance records found.</p>
            )}
            <div className="widget-actions">
              <Link to="/student-attendance" className="btn btn-primary">
                <FaClipboardCheck /> View All Attendance
              </Link>
            </div>
          </div>

          <div className="borrowed-books">
            <h2><FaBook className="icon" /> Borrowed Books</h2>
            {stats.borrowedBooks.length > 0 ? (
              <div className="books-list">
                {stats.borrowedBooks.map(book => (
                  <div className="book-item" key={book._id}>
                    <div className="book-info">
                      <p className="book-title">
                        <FaBook className="icon" /> {book.book?.title || 'Unknown Book'}
                      </p>
                      <p className="book-due-date">
                        <FaCalendarAlt className="icon" /> Due: {new Date(book.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`book-status ${book.status}`}>
                      {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-text">No borrowed books found.</p>
            )}
            <div className="widget-actions">
              <Link to="/library" className="btn btn-primary">
                <FaBook /> Visit Library
              </Link>
            </div>
          </div>

          <div className="notices-widget">
            <NoticeWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
