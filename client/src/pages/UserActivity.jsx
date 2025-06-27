import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { 
  FaUsers, FaUserGraduate, FaChalkboardTeacher, FaUserShield,
  FaCalendarAlt, FaFilter, FaSearch, FaSync, FaDownload,
  FaEye, FaEdit, FaTrash, FaArrowLeft
} from 'react-icons/fa';
import '../styles/UserActivity.css';

const UserActivity = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: 'all',
    searchTerm: '',
    activityPeriod: 'all', // 'today', 'week', 'month', 'all'
  });

  // Redirect if not admin
  if (!user) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Format time ago helper function
  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
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

  // Fetch all users with activity data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Fetch all users
      const res = await axios.get('/api/users');
      
      // Sort users by last login time (most recent first)
      const sortedUsers = res.data.sort((a, b) => {
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return new Date(b.lastLogin) - new Date(a.lastLogin);
      });
      
      setUsers(sortedUsers);
      applyFilters(sortedUsers);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user activity data');
      setLoading(false);
    }
  };

  // Apply filters to users
  const applyFilters = (userList = users) => {
    let filtered = [...userList];
    
    // Filter by role
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        (user.branch && user.branch.toLowerCase().includes(term))
      );
    }
    
    // Filter by activity period
    if (filters.activityPeriod !== 'all' && filters.activityPeriod !== 'never') {
      const now = new Date();
      let cutoffDate;
      
      switch (filters.activityPeriod) {
        case 'today':
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(user => 
          user.lastLogin && new Date(user.lastLogin) >= cutoffDate
        );
      }
    } else if (filters.activityPeriod === 'never') {
      filtered = filtered.filter(user => !user.lastLogin);
    }
    
    setFilteredUsers(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Apply the new filters
    setTimeout(() => {
      applyFilters();
    }, 0);
  };

  // Refresh data
  const refreshData = () => {
    setRefreshing(true);
    fetchUsers().finally(() => setRefreshing(false));
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    
    // Set page title
    document.title = 'User Activity | Admin Dashboard';
    
    return () => {
      document.title = 'College Management System';
    };
  }, [token]);
  
  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters]);

  return (
    <div className="user-activity-page">
      <div className="page-header">
        <div className="header-left">
          <Link to="/admin-dashboard" className="back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <h1><FaUsers className="icon" /> User Activity</h1>
        </div>
        
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={refreshData} 
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button className="export-btn">
            <FaDownload /> Export
          </button>
        </div>
      </div>
      
      <div className="filters-section">
        <div className="filter-group">
          <label>Role:</label>
          <select 
            value={filters.role} 
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Activity:</label>
          <select 
            value={filters.activityPeriod} 
            onChange={(e) => handleFilterChange('activityPeriod', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="never">Never Active</option>
          </select>
        </div>
        
        <div className="search-group">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading user activity data...</p>
        </div>
      ) : (
        <>
          <div className="results-summary">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Last Activity</th>
                  <th>Last Login</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
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
                        <div className="user-info">
                          <span className="user-name">{user.name}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        {user.role === 'student' ? (
                          <span className="badge student-badge">
                            <FaUserGraduate /> Student
                          </span>
                        ) : user.role === 'teacher' ? (
                          <span className="badge teacher-badge">
                            <FaChalkboardTeacher /> Teacher
                          </span>
                        ) : (
                          <span className="badge admin-badge">
                            <FaUserShield /> Admin
                          </span>
                        )}
                      </td>
                      <td>{user.branch || 'N/A'}</td>
                      <td>{user.lastActivity || 'No activity'}</td>
                      <td>
                        {user.lastLogin ? (
                          <div className="time-info">
                            <span className="time-ago">{formatTimeAgo(user.lastLogin)}</span>
                            <span className="full-date">{new Date(user.lastLogin).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="never">Never</span>
                        )}
                      </td>
                      <td>
                        <div className="time-info">
                          <span className="time-ago">{formatTimeAgo(user.createdAt)}</span>
                          <span className="full-date">{new Date(user.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/manage-users/${user._id}`} className="action-btn view-btn" title="View Profile">
                            <FaEye />
                          </Link>
                          <Link to={`/manage-users/edit/${user._id}`} className="action-btn edit-btn" title="Edit User">
                            <FaEdit />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-results">
                      No users found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActivity;
