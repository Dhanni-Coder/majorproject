import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaClipboardCheck, FaBook, FaBell, FaChartBar, FaChartLine, FaChartPie,
  FaCalendarAlt, FaCheck, FaTimes, FaExchangeAlt, FaExclamationTriangle,
  FaArrowRight, FaArrowUp, FaArrowDown, FaDownload, FaPrint, FaSync,
  FaEllipsisV, FaInfoCircle, FaGraduationCap, FaBookOpen, FaUserGraduate,
  FaUsers, FaUniversity, FaLaptopCode, FaRegClock
} from 'react-icons/fa';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
import NoticeWidget from '../components/NoticeWidget';
import '../styles/StudentDashboardModernNew.css';

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
  Filler
);

const StudentDashboardModernNew = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    attendanceBySubject: {},
    attendanceByMonth: {},
    recentAttendance: [],
    borrowedBooks: [],
    totalSubjects: 0,
    totalNotices: 0
  });

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get the token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Make the API request with the token in the Authorization header
        const response = await axios.get('/api/students/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Dashboard data received:', response.data);

        // Set the stats state with the response data
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);

        // Set a more specific error message based on the error
        let errorMessage = 'Failed to load dashboard data. Please try again later.';

        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Server responded with error:', err.response.status, err.response.data);
          errorMessage = `Server error: ${err.response.status} - ${err.response.data.msg || 'Unknown error'}`;
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received from server');
          errorMessage = 'No response from server. Please check your internet connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', err.message);
          errorMessage = `Request error: ${err.message}`;
        }

        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage);

        // Initialize with sample data to prevent errors in the UI
        setStats({
          attendanceBySubject: {
            'Mathematics': { present: 15, total: 20 },
            'Physics': { present: 12, total: 15 },
            'Computer Science': { present: 18, total: 20 },
            'English': { present: 14, total: 18 }
          },
          attendanceByMonth: {
            'Jan': { present: 20, total: 25 },
            'Feb': { present: 18, total: 22 },
            'Mar': { present: 22, total: 25 },
            'Apr': { present: 19, total: 24 }
          },
          recentAttendance: [
            { _id: '1', date: new Date(), subject: { name: 'Mathematics' }, present: true },
            { _id: '2', date: new Date(Date.now() - 86400000), subject: { name: 'Physics' }, present: false },
            { _id: '3', date: new Date(Date.now() - 172800000), subject: { name: 'Computer Science' }, present: true }
          ],
          borrowedBooks: [
            { _id: '1', book: { title: 'Introduction to Algorithms' }, dueDate: new Date(Date.now() + 604800000), status: 'issued' },
            { _id: '2', book: { title: 'Data Structures' }, dueDate: new Date(Date.now() + 1209600000), status: 'issued' }
          ],
          totalSubjects: 4,
          totalNotices: 3
        });
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate overall attendance percentage with error handling
  const calculateOverallAttendance = () => {
    try {
      let totalPresent = 0;
      let totalClasses = 0;

      if (stats.attendanceBySubject && typeof stats.attendanceBySubject === 'object') {
        Object.values(stats.attendanceBySubject).forEach(subject => {
          if (subject && typeof subject === 'object') {
            totalPresent += subject.present || 0;
            totalClasses += subject.total || 0;
          }
        });
      }

      const percentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
      return [percentage, totalPresent, totalClasses];
    } catch (err) {
      console.error('Error calculating overall attendance:', err);
      return [0, 0, 0]; // Default values on error
    }
  };

  // Prepare chart data for subject-wise attendance with error handling
  const prepareSubjectChartData = () => {
    try {
      if (!stats.attendanceBySubject || typeof stats.attendanceBySubject !== 'object') {
        return { labels: [], datasets: [] };
      }

      const labels = Object.keys(stats.attendanceBySubject);
      const percentages = labels.map(subject => {
        const data = stats.attendanceBySubject[subject];
        if (data && typeof data === 'object') {
          const present = data.present || 0;
          const total = data.total || 0;
          return total > 0 ? Math.round((present / total) * 100) : 0;
        }
        return 0;
      });

      return {
        labels,
        datasets: [
          {
            label: 'Attendance Percentage',
            data: percentages,
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 30,
            maxBarThickness: 40
          },
        ],
      };
    } catch (err) {
      console.error('Error preparing subject chart data:', err);
      return { labels: [], datasets: [] };
    }
  };

  // Prepare chart data for monthly attendance with error handling
  const prepareMonthlyChartData = () => {
    try {
      if (!stats.attendanceByMonth || typeof stats.attendanceByMonth !== 'object') {
        return { labels: [], datasets: [] };
      }

      const months = Object.keys(stats.attendanceByMonth);
      const presentData = months.map(month => {
        const data = stats.attendanceByMonth[month];
        return data && typeof data === 'object' ? (data.present || 0) : 0;
      });

      const totalData = months.map(month => {
        const data = stats.attendanceByMonth[month];
        return data && typeof data === 'object' ? (data.total || 0) : 0;
      });

      // Calculate percentage for each month
      const percentageData = months.map((month, index) => {
        return totalData[index] > 0
          ? (presentData[index] / totalData[index]) * 100
          : 0;
      });

      return {
        labels: months,
        datasets: [
          {
            label: 'Attendance %',
            data: percentageData,
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      };
    } catch (err) {
      console.error('Error preparing monthly chart data:', err);
      return { labels: [], datasets: [] };
    }
  };

  // Prepare chart data for overall attendance with error handling
  const prepareOverallAttendanceData = () => {
    try {
      const [percentage, present, total] = calculateOverallAttendance();
      const absent = total - present;

      return {
        labels: ['Present', 'Absent'],
        datasets: [
          {
            data: [present, absent],
            backgroundColor: [
              'rgba(99, 102, 241, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderColor: [
              'rgba(79, 70, 229, 1)',
              'rgba(219, 39, 119, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 4,
          },
        ],
      };
    } catch (err) {
      console.error('Error preparing overall attendance data:', err);
      return {
        labels: ['Present', 'Absent'],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: [
              'rgba(99, 102, 241, 0.7)',
              'rgba(236, 72, 153, 0.7)',
            ],
            borderColor: [
              'rgba(79, 70, 229, 1)',
              'rgba(219, 39, 119, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 4,
          },
        ],
      };
    }
  };

  // Chart options
  const subjectChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
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
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Attendance: ${context.raw.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const overallAttendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} classes (${percentage}%)`;
          }
        }
      }
    },
  };

  // Prepare chart data with error handling
  let subjectChartData = prepareSubjectChartData();
  let monthlyChartData = prepareMonthlyChartData();
  let overallAttendanceData = prepareOverallAttendanceData();

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <p className="welcome-text">{getGreeting()},</p>
          <h1 className="dashboard-title">{user?.name || 'Student'}</h1>
        </div>

        <div className="dashboard-actions">
          <Link to="/student-attendance" className="action-button attendance-btn">
            <div className="action-icon">
              <FaClipboardCheck />
            </div>
            <span className="action-text">Attendance</span>
          </Link>

          <Link to="/library" className="action-button library-btn">
            <div className="action-icon">
              <FaBook />
            </div>
            <span className="action-text">Library</span>
          </Link>

          <Link to="/notices" className="action-button notices-btn">
            <div className="action-icon">
              <FaBell />
            </div>
            <span className="action-text">Notices</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <div className="alert-icon">
            <FaExclamationTriangle />
          </div>
          <div className="alert-content">
            <h4 className="alert-title">Error</h4>
            <p className="alert-message">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon attendance-icon">
              <FaClipboardCheck />
            </div>
            <div className="stat-details">
              <h3 className="stat-label">Attendance</h3>
              <p className="stat-value">{calculateOverallAttendance()[0]}%</p>
              <div className={`stat-trend ${calculateOverallAttendance()[0] >= 75 ? 'trend-up' : 'trend-down'}`}>
                {calculateOverallAttendance()[0] >= 75 ? (
                  <>
                    <FaArrowUp /> Good Standing
                  </>
                ) : (
                  <>
                    <FaArrowDown /> Needs Improvement
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon subjects-icon">
              <FaGraduationCap />
            </div>
            <div className="stat-details">
              <h3 className="stat-label">Subjects</h3>
              <p className="stat-value">{stats.totalSubjects || Object.keys(stats.attendanceBySubject).length}</p>
              <div className="stat-trend">
                <span>Current Semester</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon books-icon">
              <FaBookOpen />
            </div>
            <div className="stat-details">
              <h3 className="stat-label">Books</h3>
              <p className="stat-value">{stats.borrowedBooks ? stats.borrowedBooks.length : 0}</p>
              <div className="stat-trend">
                <span>Currently Borrowed</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon notices-icon">
              <FaBell />
            </div>
            <div className="stat-details">
              <h3 className="stat-label">Notices</h3>
              <p className="stat-value">{stats.totalNotices || 0}</p>
              <div className="stat-trend">
                <span>Latest Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Charts Section */}
        <div className="charts-section">
          {/* Subject Attendance Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartBar className="icon" /> Subject-wise Attendance
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print">
                  <FaPrint />
                </button>
                <button className="chart-action-btn" title="Refresh">
                  <FaSync />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Bar options={subjectChartOptions} data={subjectChartData} />
            </div>
          </div>

          {/* Monthly Attendance Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartLine className="icon" /> Monthly Attendance Trend
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print">
                  <FaPrint />
                </button>
                <button className="chart-action-btn" title="Refresh">
                  <FaSync />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Line options={monthlyChartOptions} data={monthlyChartData} />
            </div>
          </div>

          {/* Overall Attendance Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartPie className="icon" /> Overall Attendance
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print">
                  <FaPrint />
                </button>
                <button className="chart-action-btn" title="Refresh">
                  <FaSync />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Doughnut options={overallAttendanceOptions} data={overallAttendanceData} />
              <div className="attendance-percentage">
                <div className="percentage-value">{calculateOverallAttendance()[0]}%</div>
                <div className="percentage-label">Overall Attendance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Sidebar */}
        <div className="dashboard-sidebar">
          {/* Recent Attendance Widget */}
          <div className="widget-card">
            <div className="widget-header">
              <h3 className="widget-title">
                <FaClipboardCheck className="icon" /> Recent Attendance
              </h3>
              <Link to="/student-attendance" className="widget-link">
                View All <FaArrowRight />
              </Link>
            </div>
            <div className="widget-content">
              {stats.recentAttendance && stats.recentAttendance.length > 0 ? (
                <div className="attendance-list">
                  {stats.recentAttendance.map(attendance => (
                    <div className={`attendance-item ${attendance.present ? 'present' : 'absent'}`} key={attendance._id}>
                      <div className="attendance-info">
                        <p className="attendance-date">
                          <FaCalendarAlt /> {new Date(attendance.date).toLocaleDateString()}
                        </p>
                        <p className="attendance-subject">
                          {attendance.subject?.name || 'Unknown Subject'}
                        </p>
                      </div>
                      <div className="attendance-status">
                        {attendance.present ? (
                          <>
                            <FaCheck /> Present
                          </>
                        ) : (
                          <>
                            <FaTimes /> Absent
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FaClipboardCheck className="empty-icon" />
                  <p className="empty-text">No recent attendance records found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Borrowed Books Widget */}
          <div className="widget-card">
            <div className="widget-header">
              <h3 className="widget-title">
                <FaBook className="icon" /> Borrowed Books
              </h3>
              <Link to="/library" className="widget-link">
                Visit Library <FaArrowRight />
              </Link>
            </div>
            <div className="widget-content">
              {stats.borrowedBooks && stats.borrowedBooks.length > 0 ? (
                <div className="books-list">
                  {stats.borrowedBooks.map(book => (
                    <div className="book-item" key={book._id}>
                      <div className="book-info">
                        <p className="book-title">
                          <FaBook /> {book.book?.title || 'Unknown Book'}
                        </p>
                        <p className="book-due-date">
                          <FaCalendarAlt /> Due: {new Date(book.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`book-status ${book.status}`}>
                        {book.status === 'issued' ? (
                          <>
                            <FaExchangeAlt /> Borrowed
                          </>
                        ) : book.status === 'returned' ? (
                          <>
                            <FaCheck /> Returned
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle /> Overdue
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FaBook className="empty-icon" />
                  <p className="empty-text">No borrowed books found.</p>
                  <Link to="/library" className="widget-btn widget-btn-primary">
                    <FaBook /> Browse Library
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Notices Widget */}
          <div className="widget-card">
            <div className="widget-header">
              <h3 className="widget-title">
                <FaBell className="icon" /> Latest Notices
              </h3>
              <Link to="/notices" className="widget-link">
                View All <FaArrowRight />
              </Link>
            </div>
            <div className="widget-content">
              <NoticeWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardModernNew;