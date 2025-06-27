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
  FaEllipsisV, FaInfoCircle, FaGraduationCap, FaBookOpen, FaUserGraduate
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
} from 'chart.js';
import NoticeWidget from '../components/NoticeWidget';
import '../styles/StudentDashboardModernNew.css';

// No need to set axios.defaults.baseURL as we're using Vite's proxy

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
  Legend
);

const StudentDashboardModern = () => {
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

        // Initialize with empty data to prevent errors in the UI
        setStats({
          attendanceBySubject: {},
          attendanceByMonth: {},
          recentAttendance: [],
          borrowedBooks: [],
          totalSubjects: 0,
          totalNotices: 0
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
      const presentData = labels.map(subject => {
        const data = stats.attendanceBySubject[subject];
        return data && typeof data === 'object' ? (data.present || 0) : 0;
      });

      const absentData = labels.map(subject => {
        const data = stats.attendanceBySubject[subject];
        if (data && typeof data === 'object') {
          return (data.total || 0) - (data.present || 0);
        }
        return 0;
      });

      return {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData,
            backgroundColor: 'rgba(46, 196, 182, 0.7)',
            borderColor: 'rgba(46, 196, 182, 1)',
            borderWidth: 1,
          },
          {
            label: 'Absent',
            data: absentData,
            backgroundColor: 'rgba(231, 29, 54, 0.7)',
            borderColor: 'rgba(231, 29, 54, 1)',
            borderWidth: 1,
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
            borderColor: 'rgba(67, 97, 238, 1)',
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: 'rgba(67, 97, 238, 1)',
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
              'rgba(46, 196, 182, 0.7)',
              'rgba(231, 29, 54, 0.7)',
            ],
            borderColor: [
              'rgba(46, 196, 182, 1)',
              'rgba(231, 29, 54, 1)',
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
              'rgba(46, 196, 182, 0.7)',
              'rgba(231, 29, 54, 0.7)',
            ],
            borderColor: [
              'rgba(46, 196, 182, 1)',
              'rgba(231, 29, 54, 1)',
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
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value} classes`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
    },
  };

  const overallAttendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
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
  let subjectChartData = { labels: [], datasets: [] };
  let monthlyChartData = { labels: [], datasets: [] };
  let overallAttendanceData = { labels: [], datasets: [] };

  if (!loading && !error) {
    try {
      subjectChartData = prepareSubjectChartData();
      monthlyChartData = prepareMonthlyChartData();
      overallAttendanceData = prepareOverallAttendanceData();
    } catch (err) {
      console.error('Error preparing chart data:', err);
    }
  }

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
          <p className="welcome-text">{(() => {
            const hour = new Date().getHours();
            if (hour < 12) return 'Good morning,';
            if (hour < 18) return 'Good afternoon,';
            return 'Good evening,';
          })()}</p>
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
                <span>Unread Notices</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-grid">
        {/* Charts Section */}
        <div className="charts-section">
          {/* Subject-wise Attendance Chart */}
          {Object.keys(stats.attendanceBySubject).length > 0 ? (
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
                  <button className="chart-action-btn" title="More Options">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>
              <div className="chart-container">
                <Bar options={subjectChartOptions} data={subjectChartData} />
              </div>
            </div>
          ) : (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <FaChartBar className="icon" /> Subject-wise Attendance
                </h3>
              </div>
              <div className="empty-state">
                <FaChartBar className="empty-icon" />
                <p className="empty-text">No subject attendance data available.</p>
                <Link to="/student-attendance" className="btn btn-primary">
                  <FaClipboardCheck /> View Attendance Records
                </Link>
              </div>
            </div>
          )}

          {/* Monthly Attendance Chart */}
          {Object.values(stats.attendanceByMonth).some(m => m.total > 0) ? (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <FaChartLine className="icon" /> Monthly Attendance
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
                  <button className="chart-action-btn" title="More Options">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>
              <div className="chart-container">
                <Line options={monthlyChartOptions} data={monthlyChartData} />
              </div>
              {calculateOverallAttendance()[0] < 75 && (
                <div className="chart-note">
                  <p>Your attendance is below the required 75% threshold. Please improve your attendance to avoid academic penalties.</p>
                  <Link to="/student-attendance" className="btn btn-primary">
                    <FaInfoCircle /> View Details
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <FaChartLine className="icon" /> Monthly Attendance
                </h3>
              </div>
              <div className="empty-state">
                <FaChartLine className="empty-icon" />
                <p className="empty-text">No monthly attendance data available.</p>
                <Link to="/student-attendance" className="btn btn-primary">
                  <FaClipboardCheck /> View Attendance Records
                </Link>
              </div>
            </div>
          )}

          {/* Overall Attendance Chart */}
          {Object.values(stats.attendanceByMonth).some(m => m.total > 0) ? (
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
                  <button className="chart-action-btn" title="More Options">
                    <FaEllipsisV />
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
          ) : (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">
                  <FaChartPie className="icon" /> Overall Attendance
                </h3>
              </div>
              <div className="empty-state">
                <FaChartPie className="empty-icon" />
                <p className="empty-text">No overall attendance data available.</p>
                <Link to="/student-attendance" className="btn btn-primary">
                  <FaClipboardCheck /> View Attendance Records
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="sidebar-widgets">
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
                    <div
                      className={`attendance-item ${attendance.present ? 'present' : 'absent'}`}
                      key={attendance._id}
                    >
                      <div className="attendance-info">
                        <p className="attendance-date">
                          <FaCalendarAlt /> {new Date(attendance.date).toLocaleDateString()}
                        </p>
                        <p className="attendance-subject">
                          {attendance.subject?.name || attendance.subjectName || 'Unknown Subject'}
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
                          {book.book?.title || 'Unknown Book'}
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

export default StudentDashboardModern;
