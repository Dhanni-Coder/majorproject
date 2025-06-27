import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaBell, FaEdit, FaTrash, FaExclamationTriangle, FaCheckCircle,
  FaUsers, FaUserTie, FaUserGraduate, FaTimes, FaPaperPlane,
  FaPlus, FaFilter, FaStar, FaRegStar, FaSpinner
} from 'react-icons/fa';
import '../styles/Notices.css';

const Notices = () => {
  const { user, token } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: user?.role === 'teacher' ? 'student' : 'all',
    important: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoticeId, setCurrentNoticeId] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');
        axios.defaults.headers.common['x-auth-token'] = token;
        const res = await axios.get('http://localhost:5000/api/notices');
        setNotices(res.data);
      } catch (err) {
        console.error('Error fetching notices:', err);
        setError('Failed to load notices: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [token]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      axios.defaults.headers.common['x-auth-token'] = token;
      
      let res;
      if (isEditing) {
        res = await axios.put(`http://localhost:5000/api/notices/${currentNoticeId}`, formData);
        setNotices(notices.map(notice => 
          notice._id === currentNoticeId ? res.data.notice : notice
        ));
        setSuccessMessage('Notice updated successfully!');
      } else {
        res = await axios.post('http://localhost:5000/api/notices', formData);
        setNotices([res.data.notice, ...notices]);
        setSuccessMessage('Notice published successfully!');
      }
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        targetRole: user?.role === 'teacher' ? 'student' : 'all',
        important: false
      });
      setShowForm(false);
      setIsEditing(false);
      setCurrentNoticeId(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving notice:', err);
      setError(err.response?.data?.msg || 'Error saving notice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    const confirmMessage = `Are you sure you want to delete the notice "${title}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError('');
        axios.defaults.headers.common['x-auth-token'] = token;
        await axios.delete(`http://localhost:5000/api/notices/${id}`);
        setNotices(notices.filter(notice => notice._id !== id));
        setSuccessMessage('Notice deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting notice:', err);
        setError(err.response?.data?.msg || 'Error deleting notice: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const canCreateNotices = () => {
    return user && (user.role === 'admin' || user.role === 'teacher');
  };

  const canModifyNotice = (notice) => {
    if (user && user.role === 'admin') return true;
    if (user && user.role === 'teacher') {
      if (notice.sender._id === user.id) return true;
      if (notice.targetRole === 'student') return true;
    }
    return false;
  };

  const getAvailableTargetRoles = () => {
    if (user.role === 'admin') {
      return [
        { value: 'all', label: 'Everyone' },
        { value: 'teacher', label: 'Teachers Only' },
        { value: 'student', label: 'Students Only' }
      ];
    } else if (user.role === 'teacher') {
      return [
        { value: 'student', label: 'Students Only' }
      ];
    }
    return [];
  };

  const handleEdit = (notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      targetRole: notice.targetRole,
      important: notice.important
    });
    setIsEditing(true);
    setCurrentNoticeId(notice._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter notices based on selected role and search term
  const filteredNotices = notices.filter(notice => {
    // First filter by role
    let roleMatch = true;
    if (filterRole === 'important') {
      roleMatch = notice.important === true;
    } else if (filterRole !== 'all') {
      roleMatch = notice.targetRole === filterRole || notice.targetRole === 'all';
    }
    
    // Then filter by search term
    const searchMatch = searchTerm === '' || 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return roleMatch && searchMatch;
  });

  // Get the count of notices by target role
  const noticeStats = {
    all: notices.length,
    important: notices.filter(n => n.important).length,
    teacher: notices.filter(n => n.targetRole === 'teacher' || n.targetRole === 'all').length,
    student: notices.filter(n => n.targetRole === 'student' || n.targetRole === 'all').length
  };

  // Get icon for target role
  const getTargetRoleIcon = (role) => {
    switch (role) {
      case 'all': return <FaUsers className="role-icon" />;
      case 'teacher': return <FaUserTie className="role-icon" />;
      case 'student': return <FaUserGraduate className="role-icon" />;
      default: return <FaUsers className="role-icon" />;
    }
  };

  const renderNotices = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
        </div>
      );
    }

    if (notices.length === 0) {
      return (
        <div className="empty-state">
          <FaBell />
          <h3>No notices available</h3>
          <p>There are currently no notices to display.</p>
          {canCreateNotices() && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <FaPlus /> Create First Notice
            </button>
          )}
        </div>
      );
    }

    const filteredResults = filteredNotices.filter(notice => {
      // Filter logic here
      return true; // Replace with actual filter logic
    });

    if (filteredResults.length === 0) {
      return (
        <div className="empty-state">
          <FaFilter />
          <h3>No matching notices</h3>
          <p>Try adjusting your filters or search criteria.</p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setFilterRole('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      );
    }

    return (
      <div className="notice-list">
        {filteredResults.map(notice => (
          <div 
            key={notice._id} 
            className={`notice-card ${notice.important ? 'important' : ''}`}
          >
            <div className="notice-card-header">
              <h3 className="notice-title">
                {notice.important && <FaExclamationTriangle />}
                {notice.title}
              </h3>
              <div className="notice-meta">
                <div className="notice-sender">
                  <span>
                    {notice.sender.role === 'admin' ? <FaUserTie /> : 
                     notice.sender.role === 'teacher' ? <FaUserGraduate /> : <FaUsers />}
                  </span>
                  <span>{notice.sender.name}</span>
                </div>
                <div className="notice-date">
                  {formatDate(notice.createdAt)}
                </div>
              </div>
            </div>
            <div className="notice-card-body">
              <p className="notice-content">{notice.content}</p>
            </div>
            <div className="notice-card-footer">
              <div className="notice-target">
                {notice.targetRole === 'all' ? (
                  <>
                    <FaUsers /> Everyone
                  </>
                ) : notice.targetRole === 'teacher' ? (
                  <>
                    <FaUserTie /> Teachers Only
                  </>
                ) : (
                  <>
                    <FaUserGraduate /> Students Only
                  </>
                )}
              </div>
              {canModifyNotice(notice) && (
                <div className="notice-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleEdit(notice)}
                    title="Edit Notice"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(notice._id, notice.title)}
                    title="Delete Notice"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="notices-page">
      <div className="notices-header">
        <div className="header-content">
          <h1><FaBell /> Notice Board</h1>
          <p style={{ color: 'white' }}>Stay updated with the latest announcements and information from administrators and teachers.</p>
        </div>
        {canCreateNotices() && (
          <button 
            className="create-notice-btn"
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                targetRole: user?.role === 'teacher' ? 'student' : 'all',
                important: false
              });
              setIsEditing(false);
              setCurrentNoticeId(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Create Notice'}
          </button>
        )}
      </div>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      
      {/* Notice Form */}
      {showForm && (
        <div className="notice-form-container">
          <form onSubmit={handleSubmit} className="notice-form">
            <h2>{isEditing ? 'Edit Notice' : 'Create New Notice'}</h2>
            
            <div className="form-group">
              <label htmlFor="title">Notice Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a clear, concise title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Notice Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter the details of your notice"
                rows="6"
                required
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="targetRole">Target Audience</label>
                <select
                  id="targetRole"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  required
                >
                  {getAvailableTargetRoles().map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <label htmlFor="important">
                  <input
                    type="checkbox"
                    id="important"
                    name="important"
                    checked={formData.important}
                    onChange={handleChange}
                  />
                  Mark as Important
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {isEditing ? (
                  <>
                    <FaEdit /> Update Notice
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Publish Notice
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  setCurrentNoticeId(null);
                }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filter and Search */}
      <div className="action-bar">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            <FaUsers /> All Notices
          </button>
          <button 
            className={`filter-tab ${filterRole === 'important' ? 'active' : ''}`}
            onClick={() => setFilterRole('important')}
          >
            <FaExclamationTriangle /> Important
          </button>
          {user?.role === 'student' && (
            <button 
              className={`filter-tab ${filterRole === 'student' ? 'active' : ''}`}
              onClick={() => setFilterRole('student')}
            >
              <FaUserGraduate /> For Students
            </button>
          )}
          {user?.role === 'teacher' && (
            <button 
              className={`filter-tab ${filterRole === 'teacher' ? 'active' : ''}`}
              onClick={() => setFilterRole('teacher')}
            >
              <FaUserTie /> For Teachers
            </button>
          )}
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {/* Notice List */}
      {renderNotices()}
    </div>
  );
};

export default Notices;


