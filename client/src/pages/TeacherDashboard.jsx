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
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  FaUserGraduate, FaClipboardCheck, FaBook, FaCalendarAlt, FaBell,
  FaChalkboardTeacher, FaPercentage, FaChartBar, FaChartLine,
  FaChartPie, FaExclamationTriangle, FaInfoCircle,
  FaArrowUp, FaArrowDown, FaDownload, FaPrint, FaSync, FaEllipsisV,
  FaEdit, FaMapMarkerAlt, FaUsers, FaClock, FaCalendarCheck
} from 'react-icons/fa';
import NoticeWidget from '../components/NoticeWidget';
import '../styles/TeacherDashboardModern.css';
// import '../styles/TeacherDashboardNew.css';

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

const TeacherDashboard = () => {
  console.log('TeacherDashboard component rendering');
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalNotices: 0,
    newNoticesThisWeek: 0,
    avgAttendancePercentage: 0,
    attendanceData: {},
    studentsByBranch: {},
    recentAttendance: [],
    attendanceByDate: {}
  });

  // Redirect if not logged in or not a teacher
  if (!user) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading user data...</p></div>;
  }

  if (user.role !== 'teacher') {
    console.log('User is not a teacher, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }

  // Use a ref to track if data has been fetched
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    // Skip if we've already fetched data
    if (dataFetched) {
      console.log('Data already fetched, skipping fetch');
      return;
    }

    console.log('Starting data fetch for teacher dashboard');

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing dashboard to display');
        setLoading(false);
        setError('Dashboard data loading took too long. Showing sample data instead.');
      }
    }, 5000); // 5 seconds timeout - reduced from 10 seconds

    // Check if we have auth data in sessionStorage (for QR login case)
    const sessionUser = sessionStorage.getItem('authUser');
    const sessionToken = sessionStorage.getItem('authToken');

    if (!token && sessionToken) {
      console.log('Using auth token from sessionStorage');
      setAuthToken(sessionToken);
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Create a function to handle API requests with fallback to direct URL
        const fetchWithFallback = async (endpoint) => {
          try {
            // First try with the proxy
            return await axios.get(endpoint);
          } catch (proxyErr) {
            console.log(`Proxy request to ${endpoint} failed, trying direct URL`);
            // If proxy fails, try direct URL
            return await axios.get(`http://localhost:5000${endpoint}`);
          }
        };

        // Fetch all data in parallel for better performance
        console.log('Fetching teacher dashboard data...');

        let students = [];
        let subjects = [];
        let notices = [];
        let noticeStats = { total: 0, newThisWeek: 0 };
        let attendanceData = {};
        let attendanceByDate = {};
        let recentAttendance = [];
        let avgAttendancePercentage = 0;

        try {
          // Fetch students from teacher's branch
          const studentsRes = await fetchWithFallback('/api/users/branch-students');
          students = studentsRes.data || [];
          console.log(`Fetched ${students.length} students`);
        } catch (err) {
          console.error('Error fetching students:', err);
          students = [
            { _id: 'sample1', name: 'Sample Student 1', email: 'student1@example.com' },
            { _id: 'sample2', name: 'Sample Student 2', email: 'student2@example.com' },
            { _id: 'sample3', name: 'Sample Student 3', email: 'student3@example.com' }
          ];
        }

        try {
          // Fetch subjects
          const subjectsRes = await fetchWithFallback('/api/subjects');
          subjects = subjectsRes.data || [];
          console.log(`Fetched ${subjects.length} subjects`);
        } catch (err) {
          console.error('Error fetching subjects:', err);
          subjects = [
            { _id: 'subject1', name: 'Mathematics', code: 'MATH101' },
            { _id: 'subject2', name: 'Computer Science', code: 'CS101' },
            { _id: 'subject3', name: 'Physics', code: 'PHY101' }
          ];
        }

        try {
          // Fetch notices
          const noticesRes = await fetchWithFallback('/api/notices');
          notices = noticesRes.data || [];
          console.log(`Fetched ${notices.length} notices`);

          // Try to get user data from context or sessionStorage
          let currentUser = user;
          if (!currentUser || !currentUser._id) {
            const sessionUserStr = sessionStorage.getItem('authUser');
            if (sessionUserStr) {
              try {
                currentUser = JSON.parse(sessionUserStr);
                console.log('Using user data from sessionStorage:', currentUser);
              } catch (parseErr) {
                console.error('Error parsing user data from sessionStorage:', parseErr);
              }
            }
          }

          // Fetch notice stats if user data is available
          if (currentUser && currentUser._id) {
            try {
              const noticeStatsRes = await fetchWithFallback(`/api/notices/stats?teacherId=${currentUser._id}`);
              noticeStats = noticeStatsRes.data || { total: 0, newThisWeek: 0 };
              console.log('Notice stats:', noticeStats);
            } catch (statsErr) {
              console.error('Error fetching notice stats:', statsErr);
              noticeStats = { total: 0, newThisWeek: 0 };
            }
          } else {
            console.log('User data not available from any source, skipping notice stats fetch');
            noticeStats = { total: 0, newThisWeek: 0 };
          }
        } catch (err) {
          console.error('Error fetching notices or notice stats:', err);
          // Try to get user data from context or sessionStorage if not already defined
          let currentUser = user;
          if (!currentUser || !currentUser._id) {
            const sessionUserStr = sessionStorage.getItem('authUser');
            if (sessionUserStr) {
              try {
                currentUser = JSON.parse(sessionUserStr);
                console.log('Using user data from sessionStorage for sample notices');
              } catch (parseErr) {
                console.error('Error parsing user data from sessionStorage:', parseErr);
              }
            }
          }

          const creatorId = currentUser && currentUser._id ? currentUser._id : 'sample-user-id';

          notices = [
            { _id: 'notice1', title: 'Sample Notice 1', content: 'This is a sample notice', createdBy: creatorId },
            { _id: 'notice2', title: 'Sample Notice 2', content: 'This is another sample notice', createdBy: creatorId }
          ];
        }

        try {
          // Fetch teacher attendance data
          const attendanceRes = await fetchWithFallback('/api/attendance/teacher-data');
          const teacherAttendanceData = attendanceRes.data || {};
          console.log('Teacher attendance data:', teacherAttendanceData);

          // Process attendance data if available
          if (teacherAttendanceData.subjects && teacherAttendanceData.subjects.length > 0) {
            console.log('Processing real attendance data from backend');

            // Map subject attendance data
            attendanceData = teacherAttendanceData.subjects.reduce((acc, subject) => {
              acc[subject.name] = subject.attendancePercentage || 0;
              return acc;
            }, {});

            // Get attendance by date
            if (teacherAttendanceData.attendanceByDate) {
              attendanceByDate = teacherAttendanceData.attendanceByDate;
            }

            // Get recent attendance
            if (teacherAttendanceData.recentAttendance) {
              recentAttendance = teacherAttendanceData.recentAttendance;
            }

            // Get average attendance
            if (teacherAttendanceData.averageAttendance !== undefined) {
              avgAttendancePercentage = teacherAttendanceData.averageAttendance;
            } else if (Object.keys(attendanceData).length > 0) {
              // Calculate average from subject data if not provided
              const total = Object.values(attendanceData).reduce((sum, val) => sum + val, 0);
              avgAttendancePercentage = Math.round(total / Object.keys(attendanceData).length);
            }

            // Update total students if provided
            if (teacherAttendanceData.totalStudents) {
              students = Array(teacherAttendanceData.totalStudents).fill().map((_, i) => ({
                _id: `student-${i}`,
                name: `Student ${i+1}`,
                email: `student${i+1}@example.com`
              }));
            }

            // Update total subjects if provided
            if (teacherAttendanceData.totalSubjects) {
              subjects = teacherAttendanceData.subjects;
            }

            console.log('Successfully processed real attendance data');
          } else {
            console.log('No real attendance data available, using fallback data');

            // Create sample attendance data for subjects
            attendanceData = subjects.reduce((acc, subject) => {
              acc[subject.name] = Math.floor(Math.random() * 30) + 70; // Random between 70-100
              return acc;
            }, {});

            // Set average attendance
            avgAttendancePercentage = 78; // Default value

            // Create sample attendance by date (last 7 days)
            attendanceByDate = {};
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateString = date.toISOString().split('T')[0];
              attendanceByDate[dateString] = Math.floor(Math.random() * 15) + 5; // Random between 5-20
            }

            // Create sample recent attendance
            recentAttendance = [];
            for (let i = 0; i < 5; i++) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const subject = subjects[i % subjects.length];

              recentAttendance.push({
                _id: `sample-${Math.random()}`,
                date: date.toISOString(),
                subject: subject,
                students: students.map(student => ({
                  student: student,
                  present: Math.random() > 0.3 // 70% chance of being present
                }))
              });
            }
          }
        } catch (err) {
          console.error('Error fetching teacher attendance data:', err);

          // Create sample attendance data for subjects
          attendanceData = subjects.reduce((acc, subject) => {
            acc[subject.name] = Math.floor(Math.random() * 30) + 70; // Random between 70-100
            return acc;
          }, {});

          // Set average attendance
          avgAttendancePercentage = 78; // Default value

          // Create sample attendance by date (last 7 days)
          attendanceByDate = {};
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            attendanceByDate[dateString] = Math.floor(Math.random() * 15) + 5; // Random between 5-20
          }

          // Create sample recent attendance
          recentAttendance = [];
          for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const subject = subjects[i % subjects.length];

            recentAttendance.push({
              _id: `sample-${Math.random()}`,
              date: date.toISOString(),
              subject: subject,
              students: students.map(student => ({
                student: student,
                present: Math.random() > 0.3 // 70% chance of being present
              }))
            });
          }
        }

        // Try to get user data from context or sessionStorage if not already defined
        let currentUser = user;
        if (!currentUser || !currentUser._id) {
          const sessionUserStr = sessionStorage.getItem('authUser');
          if (sessionUserStr) {
            try {
              currentUser = JSON.parse(sessionUserStr);
              console.log('Using user data from sessionStorage for stats calculation');
            } catch (parseErr) {
              console.error('Error parsing user data from sessionStorage:', parseErr);
            }
          }
        }

        // Set all stats
        setStats({
          totalStudents: students.length,
          totalSubjects: subjects.length,
          totalNotices: noticeStats.total || (currentUser && currentUser._id ? notices.filter(n => n.createdBy === currentUser._id).length : 0),
          newNoticesThisWeek: noticeStats.newThisWeek || 0,
          avgAttendancePercentage: avgAttendancePercentage,
          attendanceData,
          studentsByBranch: {},
          recentAttendance,
          attendanceByDate
        });

        console.log('Dashboard data fetch complete');
        setDataFetched(true);
        setLoading(false);

        // Clean up sessionStorage after successful data fetch
        if (sessionStorage.getItem('authUser') || sessionStorage.getItem('authToken')) {
          console.log('Cleaning up sessionStorage after successful data fetch');
          sessionStorage.removeItem('authUser');
          sessionStorage.removeItem('authToken');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setDataFetched(true); // Mark as fetched even on error
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Clean up the timeout when the component unmounts
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [token, user?._id, dataFetched]); // Include dataFetched to prevent unnecessary fetches and user._id to refetch when user data becomes available

  // Chart options and data
  const attendanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          padding: 20
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Poppins', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Poppins', sans-serif"
        },
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
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          }
        }
      }
    },
  };

  // Filter out subjects with no attendance data and ensure values are valid
  const validAttendanceData = {};

  // Check if stats.attendanceData exists and has data
  if (stats.attendanceData && Object.keys(stats.attendanceData).length > 0) {
    Object.entries(stats.attendanceData).forEach(([subject, percentage]) => {
      // Only include subjects with valid data
      if (percentage !== null && percentage !== undefined && !isNaN(percentage)) {
        // Ensure percentage is between 0 and 100
        validAttendanceData[subject] = Math.max(0, Math.min(100, percentage));
      }
    });
  }

  // If no valid data, add some sample data for demonstration
  if (Object.keys(validAttendanceData).length === 0) {
    // Add sample data if no real data is available
    validAttendanceData['Sample Subject 1'] = 85;
    validAttendanceData['Sample Subject 2'] = 70;
    validAttendanceData['Sample Subject 3'] = 90;
  }

  const attendanceChartData = {
    labels: Object.keys(validAttendanceData),
    datasets: [
      {
        label: 'Attendance Percentage',
        data: Object.values(validAttendanceData),
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 30,
        maxBarThickness: 40
      },
    ],
  };

  // Removed student by branch chart

  const attendanceByDateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          padding: 20
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Poppins', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Poppins', sans-serif"
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          precision: 0, // Only show integer values
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          callback: function(value) {
            if (value < 0) return 0; // Additional safeguard against negative values
            return value;
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          }
        }
      }
    }
  };

  // Ensure no negative values in attendance data
  const sanitizedAttendanceByDate = {};

  // Check if stats.attendanceByDate exists and has data
  if (stats.attendanceByDate && Object.keys(stats.attendanceByDate).length > 0) {
    Object.entries(stats.attendanceByDate).forEach(([date, count]) => {
      sanitizedAttendanceByDate[date] = Math.max(0, count); // Ensure no negative values
    });
  } else {
    // If no data, add sample data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      // Generate random attendance count between 5 and 20
      sanitizedAttendanceByDate[dateString] = Math.floor(Math.random() * 16) + 5;
    }
  }

  const attendanceByDateData = {
    labels: Object.keys(sanitizedAttendanceByDate).map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Students Present',
        data: Object.values(sanitizedAttendanceByDate),
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(67, 97, 238, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: 'rgba(67, 97, 238, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
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

  // If there's an error, still show the dashboard with sample data
  if (error) {
    console.log("Showing dashboard with sample data due to error:", error);
  }

  // Get current date and time for greeting
  const getCurrentTime = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get percentage class based on value
  const getPercentageClass = (percentage) => {
    if (percentage >= 75) return "percentage-high";
    if (percentage >= 50) return "percentage-medium";
    return "percentage-low";
  };

  // Sample upcoming classes data
  const upcomingClasses = [
    {
      id: 1,
      time: "10:00 AM",
      subject: "Mathematics",
      room: "Room 101",
      status: "now"
    },
    {
      id: 2,
      time: "11:30 AM",
      subject: "Computer Science",
      room: "Lab 3",
      status: "upcoming"
    },
    {
      id: 3,
      time: "02:00 PM",
      subject: "Physics",
      room: "Room 205",
      status: "later"
    }
  ];

  // Tasks data removed

  // Create doughnut chart data for attendance overview
  const attendanceOverviewData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [
          stats.avgAttendancePercentage || 75,
          Math.max(0, 100 - (stats.avgAttendancePercentage || 75)), // Ensure no negative values and total is 100%
        ],
        backgroundColor: [
          'rgba(46, 196, 182, 0.8)',
          'rgba(231, 29, 54, 0.8)',
        ],
        borderColor: [
          'rgba(46, 196, 182, 1)',
          'rgba(231, 29, 54, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const attendanceOverviewOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: "'Poppins', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Poppins', sans-serif"
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="teacher-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <p className="dashboard-welcome">{getCurrentTime()}, {user.name}!</p>
          <h1 className="dashboard-title">Teacher Dashboard</h1>
        </div>
        <div className="dashboard-actions">
          <Link to="/take-attendance" className="quick-action-btn primary">
            <FaClipboardCheck /> Take Attendance
          </Link>
          <Link to="/add-notice" className="quick-action-btn secondary">
            <FaBell /> Add Notice
          </Link>
          <Link to="/schedule" className="quick-action-btn success">
            <FaCalendarAlt /> Class Schedule
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon student-icon">
              <FaUserGraduate />
            </div>
            <div className="stat-details">
              <h3>Total Students</h3>
              <p className="stat-value">{stats.totalStudents}</p>

            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon subject-icon">
              <FaBook />
            </div>
            <div className="stat-details">
              <h3>Subjects</h3>
              <p className="stat-value">{stats.totalSubjects}</p>
              <div className="stat-trend">
                <FaBook /> Active this semester
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon notice-icon">
              <FaBell />
            </div>
            <div className="stat-details">
              <h3>My Notices</h3>
              <p className="stat-value">{stats.totalNotices}</p>
              <div className="stat-trend trend-up">
                <FaArrowUp /> {stats.newNoticesThisWeek} new this week
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon attendance-icon">
              <FaClipboardCheck />
            </div>
            <div className="stat-details">
              <h3>Avg. Attendance</h3>
              <p className="stat-value">{stats.avgAttendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Charts Section */}
        <div className="charts-section">
          {/* Attendance by Subject Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartBar className="icon" /> Attendance by Subject
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download Report">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print Report">
                  <FaPrint />
                </button>
                <button
                  className="chart-action-btn"
                  title="Refresh Data"
                  onClick={() => {
                    setDataFetched(false);
                    setLoading(true);
                  }}
                >
                  <FaSync />
                </button>
                <button className="chart-action-btn" title="More Options">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Bar options={attendanceChartOptions} data={attendanceChartData} />
              {Object.keys(stats.attendanceData || {}).length === 0 && (
                <div className="chart-note">
                  <p>Showing sample data. Start taking attendance to see real statistics.</p>
                  <Link to="/take-attendance" className="btn btn-primary">
                    <FaClipboardCheck /> Take Attendance
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Trend Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartLine className="icon" /> Attendance Trend (Last 7 Days)
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download Report">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print Report">
                  <FaPrint />
                </button>
                <button
                  className="chart-action-btn"
                  title="Refresh Data"
                  onClick={() => {
                    setDataFetched(false);
                    setLoading(true);
                  }}
                >
                  <FaSync />
                </button>
                <button className="chart-action-btn" title="More Options">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Line options={attendanceByDateOptions} data={attendanceByDateData} />
              {Object.keys(stats.attendanceByDate || {}).length === 0 && (
                <div className="chart-note">
                  <p>Showing sample data. Start taking attendance to see real trends.</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Overview Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <FaChartPie className="icon" /> Present/Absent Overview
              </h3>
              <div className="chart-actions">
                <button className="chart-action-btn" title="Download Report">
                  <FaDownload />
                </button>
                <button className="chart-action-btn" title="Print Report">
                  <FaPrint />
                </button>
                <button
                  className="chart-action-btn"
                  title="Refresh Data"
                  onClick={() => {
                    setDataFetched(false);
                    setLoading(true);
                  }}
                >
                  <FaSync />
                </button>
                <button className="chart-action-btn" title="More Options">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            <div className="chart-container">
              <Doughnut options={attendanceOverviewOptions} data={attendanceOverviewData} />
              <div className="chart-note">
                <p>Showing average attendance percentage across all subjects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Sidebar */}
        <div className="dashboard-sidebar">
          {/* Recent Attendance Widget */}
          <div className="widget">
            <div className="widget-header">
              <h3><FaClipboardCheck className="widget-icon" /> Recent Attendance</h3>
              <Link to="/attendance" className="widget-link">
                View All <FaArrowUp className="arrow-icon" />
              </Link>
            </div>
            <div className="widget-content">
              {stats.recentAttendance && stats.recentAttendance.length > 0 ? (
                <div className="attendance-list">
                  {stats.recentAttendance.slice(0, 5).map(attendance => {
                    // Get subject name
                    let subjectName = 'Unknown Subject';
                    if (attendance.subject && attendance.subject.name) {
                      subjectName = attendance.subject.name;
                    } else if (attendance.subjectName) {
                      subjectName = attendance.subjectName;
                    }

                    // Handle different attendance record formats
                    let presentCount = 0;
                    let totalCount = 0;

                    if (attendance.students && Array.isArray(attendance.students)) {
                      // If it has a students array
                      presentCount = attendance.students.filter(s => s.status === 'present' || s.present === true).length;
                      totalCount = attendance.students.length;
                    } else if (attendance.presentCount !== undefined && attendance.totalCount !== undefined) {
                      // If it has presentCount and totalCount properties (from backend)
                      presentCount = attendance.presentCount;
                      totalCount = attendance.totalCount;
                    } else if (attendance.student) {
                      // If it's a single student record
                      totalCount = 1;
                      presentCount = attendance.present ? 1 : 0;
                    } else {
                      // Skip invalid records
                      return null;
                    }

                    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                    const percentageClass = getPercentageClass(percentage);

                    return (
                      <div className="attendance-item" key={attendance._id || `temp-${Math.random()}`}>
                        <div className={`attendance-icon ${percentage >= 75 ? 'present' : 'absent'}`}>
                          {percentage >= 75 ? <FaClipboardCheck /> : <FaExclamationTriangle />}
                        </div>
                        <div className="attendance-details">
                          <h4 className="attendance-subject">{subjectName}</h4>
                          <p className="attendance-info">
                            <FaCalendarCheck /> {new Date(attendance.date).toLocaleDateString()}
                            <span style={{ marginLeft: '10px' }}>
                              <FaUsers /> {presentCount}/{totalCount} students
                            </span>
                          </p>
                        </div>
                        <div className={`attendance-status ${percentage >= 75 ? 'present' : 'absent'}`}>
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FaClipboardCheck className="empty-state-icon" />
                  <p className="empty-state-text">No recent attendance records found.</p>
                  <Link to="/take-attendance" className="quick-action-btn primary">
                    <FaClipboardCheck /> Take Attendance
                  </Link>
                </div>
              )}
              {stats.recentAttendance && stats.recentAttendance.length > 0 && (
                <div className="widget-actions">
                  <Link to="/take-attendance" className="quick-action-btn primary">
                    <FaClipboardCheck /> Take Attendance
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Classes Widget */}
          <div className="widget">
            <div className="widget-header">
              <h3><FaCalendarAlt className="widget-icon" /> Today's Classes</h3>
              <Link to="/schedule" className="widget-link">
                Full Schedule <FaArrowUp className="arrow-icon" />
              </Link>
            </div>
            <div className="widget-content">
              <div className="upcoming-classes">
                {upcomingClasses.map(classItem => (
                  <div className={`class-item ${classItem.status}`} key={classItem.id}>
                    <div className="class-time">{classItem.time}</div>
                    <div className="class-details">
                      <h4 className="class-subject">{classItem.subject}</h4>
                      <p className="class-info">
                        <FaMapMarkerAlt /> {classItem.room}
                      </p>
                    </div>
                    <div className="class-actions">
                      <button className="class-action-btn" title="View Details">
                        <FaInfoCircle />
                      </button>
                      <button className="class-action-btn" title="Edit Class">
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="widget-actions">
                <Link to="/schedule" className="btn btn-secondary">
                  <FaCalendarAlt /> View Full Schedule
                </Link>
              </div>
            </div>
          </div>

          {/* Tasks Widget removed */}

          {/* Notices Widget */}
          <div className="widget">
            <NoticeWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
