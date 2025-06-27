import { useState, useEffect, useContext } from 'react';
import { Navigate, Link } from 'react-router-dom';
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
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import {
  FaUsers, FaUserGraduate, FaChalkboardTeacher, FaBook,
  FaBell, FaBuilding, FaCalendarAlt, FaChartLine,
  FaDownload, FaSync, FaFilter, FaArrowRight,
  FaEnvelope, FaHistory, FaEye
} from 'react-icons/fa';
import '../styles/AdminDashboard.css';

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

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalBooks: 0,
    totalBranches: 0,
    totalNotices: 0,
    recentLogins: [],
    studentsByBranch: {},
    attendanceData: {},
    bookIssueData: {},
    noticesByMonth: {},
    attendanceBySemester: {},
    attendanceByBranchAndSemester: {}
  });

  // Redirect if not admin
  if (!user) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  const refreshData = () => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Fetch all data in parallel for better performance
      const [usersRes, booksRes, branchesRes, noticesRes] = await Promise.all([
        axios.get('/api/users').catch(err => {
          console.error('Error fetching users:', err);
          setError('Error loading user data');
          return { data: [] };
        }),
        axios.get('/api/books').catch(err => {
          console.error('Error fetching books:', err);
          return { data: [] };
        }),
        axios.get('/api/branches').catch(err => {
          console.error('Error fetching branches:', err);
          return { data: [] };
        }),
        axios.get('/api/notices').catch(err => {
          console.error('Error fetching notices:', err);
          return { data: [] };
        })
      ]);

      const usersData = usersRes.data || [];
      const students = usersData.filter(user => user.role === 'student');
      const teachers = usersData.filter(user => user.role === 'teacher');
      const books = booksRes.data || [];
      const branches = branchesRes.data || [];
      const notices = noticesRes.data || [];

      // Calculate students by branch
      const studentsByBranch = {};
      branches.forEach(branch => {
        studentsByBranch[branch.name] = students.filter(student => student.branch === branch.code).length;
      });

      // Calculate notices by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const noticesByMonth = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

      console.log('Processing notices data:', notices.length, 'notices found');

      // Get current year
      const currentYear = new Date().getFullYear();

      notices.forEach(notice => {
        // Use date field from the notice model
        const date = new Date(notice.date);

        // Only count notices from the current year
        if (date.getFullYear() === currentYear) {
          const month = months[date.getMonth()];
          noticesByMonth[month]++;
          console.log(`Notice from ${month}: ${notice.title}`);
        }
      });

      console.log('Notices by month:', noticesByMonth);



      // Fetch real attendance data
      const attendanceRes = await axios.get('/api/admin/attendance-stats').catch(err => {
        console.error('Error fetching attendance stats:', err);
        return { data: {
          attendanceByBranch: {},
          attendanceBySemester: {},
          attendanceByBranchAndSemester: {}
        }};
      });

      // Extract attendance data from response or use empty objects if not available
      const attendanceData = attendanceRes.data?.attendanceByBranch || {};
      const attendanceBySemester = attendanceRes.data?.attendanceBySemester || {};
      const attendanceByBranchAndSemester = attendanceRes.data?.attendanceByBranchAndSemester || {};

      // If no data is available, initialize with empty objects
      if (Object.keys(attendanceBySemester).length === 0) {
        for (let sem = 1; sem <= 8; sem++) {
          attendanceBySemester[`Semester ${sem}`] = 0;
        }
      }

      if (Object.keys(attendanceByBranchAndSemester).length === 0) {
        branches.forEach(branch => {
          attendanceByBranchAndSemester[branch.name] = {};
          for (let sem = 1; sem <= 8; sem++) {
            attendanceByBranchAndSemester[branch.name][`Semester ${sem}`] = 0;
          }
        });
      }

      // Book issue data
      const bookIssueData = {
        'Issued': books.reduce((total, book) => total + (book.quantity - book.availableQuantity || 0), 0),
        'Available': books.reduce((total, book) => total + (book.availableQuantity || 0), 0)
      };

      // Set all stats
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalBooks: books.length,
        totalBranches: branches.length,
        totalNotices: notices.length,
        recentLogins: usersData
          .filter(user => user.lastLogin)
          .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
          .slice(0, 5), // Limit to 5 users
        studentsByBranch,
        attendanceData,
        bookIssueData,
        noticesByMonth,
        attendanceBySemester,
        attendanceByBranchAndSemester
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, timeRange]);

  // Chart configurations
  const chartConfigs = {
    branchChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Students by Branch',
            font: { size: 16 }
          },
        },
      },
      data: {
        labels: Object.keys(stats.studentsByBranch),
        datasets: [{
          label: 'Number of Students',
          data: Object.values(stats.studentsByBranch),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
          ],
          borderWidth: 1,
        }],
      }
    },
    attendanceChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Average Attendance by Branch (%)',
            font: { size: 16 }
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              precision: 0,
              callback: function(value) {
                return value + '%';
              }
            }
          },
        },
      },
      data: {
        labels: Object.keys(stats.attendanceData),
        datasets: [{
          label: 'Attendance Percentage',
          data: Object.values(stats.attendanceData),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      }
    },
    bookChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Book Status',
            font: { size: 16 }
          },
        },
      },
      data: {
        labels: Object.keys(stats.bookIssueData),
        datasets: [{
          label: 'Books',
          data: Object.values(stats.bookIssueData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
          ],
          borderWidth: 1,
        }],
      }
    },
    noticeChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Notices by Month (Current Year)',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Notices: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            suggestedMin: 0,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        }
      },
      data: {
        // Reorder months to start from January
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Number of Notices',
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month =>
            stats.noticesByMonth[month] || 0
          ),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }],
      }
    },
    semesterAttendanceChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Attendance by Semester (%)',
            font: { size: 16 }
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
            ticks: {
              precision: 0,
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      },
      data: {
        labels: Object.keys(stats.attendanceBySemester),
        datasets: [{
          label: 'Attendance Percentage',
          data: Object.values(stats.attendanceBySemester),
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          borderRadius: 6,
        }],
      }
    },
    branchSemesterAttendanceChart: {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: 'Branch & Semester Attendance (%)',
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              precision: 0,
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      },
      data: {
        labels: Object.keys(stats.attendanceBySemester || {}).slice(0, 8),
        datasets: Object.entries(stats.attendanceByBranchAndSemester || {}).slice(0, 5).map(([branch, data], index) => {
          const colors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ];

          return {
            label: branch,
            data: Object.values(data),
            backgroundColor: colors[index % colors.length].replace('1)', '0.7)'),
            borderColor: colors[index % colors.length],
            borderWidth: 1,
          };
        }),
      }
    },
  };

  // Format time ago helper function
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  };

  const exportToPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF export functionality will be implemented here');
  };

  if (loading && !refreshing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>

        <div className="dashboard-actions">
          <div className="time-filter">
            <FaFilter className="filter-icon" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <button className="action-btn refresh-btn" onClick={refreshData} disabled={refreshing}>
            <FaSync className={`icon ${refreshing ? 'spinning' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button className="action-btn export-btn" onClick={exportToPDF}>
            <FaDownload className="icon" /> Export Report
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stats-overview">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon student-icon">
              <FaUserGraduate />
            </div>
            <div className="stat-details">
              <h3>Students</h3>
              <p className="stat-value">{stats.totalStudents}</p>
              <Link to="/manage-users" className="stat-link">View all</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon teacher-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-details">
              <h3>Teachers</h3>
              <p className="stat-value">{stats.totalTeachers}</p>
              <Link to="/manage-users" className="stat-link">View all</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon book-icon">
              <FaBook />
            </div>
            <div className="stat-details">
              <h3>Books</h3>
              <p className="stat-value">{stats.totalBooks}</p>
              <Link to="/library" className="stat-link">View all</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon branch-icon">
              <FaBuilding />
            </div>
            <div className="stat-details">
              <h3>Branches</h3>
              <p className="stat-value">{stats.totalBranches}</p>
              <Link to="/branches" className="stat-link">View all</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon notice-icon">
              <FaBell />
            </div>
            <div className="stat-details">
              <h3>Notices</h3>
              <p className="stat-value">{stats.totalNotices}</p>
              <Link to="/notices" className="stat-link">View all</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-section">
          <h2 className="section-title"><FaChartLine className="section-icon" /> Analytics Overview</h2>

          <div className="charts-container">
            <div className="chart-card large-chart">
              <Bar options={chartConfigs.branchChart.options} data={chartConfigs.branchChart.data} />
            </div>

            <div className="chart-card large-chart">
              <Bar options={chartConfigs.attendanceChart.options} data={chartConfigs.attendanceChart.data} />
            </div>

            <div className="chart-card medium-chart">
              <Doughnut options={chartConfigs.bookChart.options} data={chartConfigs.bookChart.data} />
            </div>

            <div className="chart-card medium-chart">
              <Line options={chartConfigs.noticeChart.options} data={chartConfigs.noticeChart.data} />
            </div>

            <div className="chart-card large-chart">
              <Bar options={chartConfigs.semesterAttendanceChart.options} data={chartConfigs.semesterAttendanceChart.data} />
            </div>

            <div className="chart-card large-chart">
              <Line options={chartConfigs.branchSemesterAttendanceChart.options} data={chartConfigs.branchSemesterAttendanceChart.data} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent User Activity Section - Moved to the end */}
      <div className="activity-section">
        <div className="section-header">
          <h2 className="section-title"><FaUsers className="section-icon" /> Recent User Activity</h2>
          <div className="section-actions">
            <button
              className="refresh-activity-btn"
              onClick={() => {
                setRefreshing(true);
                fetchDashboardData().finally(() => setRefreshing(false));
              }}
              disabled={refreshing}
            >
              <FaSync className={`icon ${refreshing ? 'spinning' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link to="/user-activity" className="view-all-btn">
              View All <FaArrowRight className="icon" />
            </Link>
          </div>
        </div>

        {stats.recentLogins && stats.recentLogins.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Last Activity</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogins.map(user => (
                  <tr key={user._id}>
                    <td className="user-cell">
                      {user.profilePicture ? (
                        <img
                          src={`/api${user.profilePicture}`}
                          alt={user.name}
                          className="user-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.svg';
                          }}
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="user-name">{user.name}</span>
                    </td>
                    <td>
                      {user.role === 'student' ? (
                        <span className="badge student-badge">Student</span>
                      ) : user.role === 'teacher' ? (
                        <span className="badge teacher-badge">Teacher</span>
                      ) : (
                        <span className="badge admin-badge">Admin</span>
                      )}
                    </td>
                    <td>{user.branch || 'N/A'}</td>
                    <td>{user.lastActivity || 'Login'}</td>
                    <td>
                      <span className="time-ago">
                        {formatTimeAgo(new Date(user.lastLogin))}
                      </span>
                      <span className="full-date" title={new Date(user.lastLogin).toLocaleString()}>
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data-message">
            <p>No recent login activity to display.</p>
          </div>
        )}

        <div className="view-all-link">
          <Link to="/user-activity">View all activity <span>&rarr;</span></Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

