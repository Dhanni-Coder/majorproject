import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaPlus, FaBell, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const Notices = () => {
  const { user, token } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    important: false
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchNotices = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        const res = await axios.get('http://localhost:5000/api/notices');
        setNotices(res.data);
        setError('');
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

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      const res = await axios.post('http://localhost:5000/api/notices', formData);

      // Add the new notice to the notices list
      setNotices([res.data.notice, ...notices]);

      // Reset form
      setFormData({
        title: '',
        content: '',
        targetRole: 'all',
        important: false
      });

      setShowForm(false);
      setSuccessMessage('Notice published successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating notice:', err);
      setError(err.response?.data?.msg || 'Error creating notice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Create a more detailed confirmation message
    const confirmMessage = `Are you sure you want to delete the notice "${title}"?\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        await axios.delete(`http://localhost:5000/api/notices/${id}`);

        // Remove the deleted notice from the notices list
        setNotices(notices.filter(notice => notice._id !== id));

        setSuccessMessage('Notice deleted successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting notice:', err);
        setError(err.response?.data?.msg || 'Error deleting notice: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to format date
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

  // Function to check if user can create notices
  const canCreateNotices = () => {
    return user && (user.role === 'admin' || user.role === 'teacher');
  };

  // Function to check if user can edit/delete a notice
  const canModifyNotice = (notice) => {
    return user && (user.role === 'admin' || notice.sender._id === user.id);
  };

  // Function to get available target roles based on user role
  const getAvailableTargetRoles = () => {
    if (user.role === 'admin') {
      return [
        { value: 'all', label: 'Everyone' },
        { value: 'teacher', label: 'Teachers Only' },
        { value: 'student', label: 'Students Only' }
      ];
    } else if (user.role === 'teacher') {
      return [
        { value: 'all', label: 'Everyone' },
        { value: 'student', label: 'Students Only' }
      ];
    }
    return [];
  };

  return (
    <div className="notices-page">
      <div className="page-header">
        <h1>Notices & Announcements</h1>
        {canCreateNotices() && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : <><FaPlus /> New Notice</>}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {showForm && (
        <div className="notice-form">
          <h2>Create New Notice</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter notice title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter notice content"
                rows="5"
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
                <label>
                  <input
                    type="checkbox"
                    name="important"
                    checked={formData.important}
                    onChange={handleChange}
                  />
                  Mark as Important
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Notice'}
            </button>
          </form>
        </div>
      )}

      <div className="notices-container">
        {loading && notices.length === 0 ? (
          <div className="loading">Loading notices...</div>
        ) : notices.length > 0 ? (
          <div className="notices-list">
            {notices.map(notice => (
              <div
                key={notice._id}
                className={`notice-card ${notice.important ? 'notice-important' : ''} ${notice.sender._id === user.id ? 'notice-own' : ''}`}
              >
                <div className="notice-header">
                  <h3 className="notice-title">
                    {notice.important && <FaExclamationTriangle className="important-icon" />}
                    {notice.title}
                  </h3>

                  {canModifyNotice(notice) && (
                    <div className="notice-actions">
                      <Link to={`/notices/edit/${notice._id}`} className="btn-icon" title="Edit Notice">
                        <FaEdit />
                      </Link>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(notice._id, notice.title)}
                        title="Delete Notice"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className="notice-meta">
                  <span className="notice-sender">
                    By: {notice.sender.name} ({notice.sender.role})
                  </span>
                  <span className="notice-date">
                    {formatDate(notice.date)}
                  </span>
                </div>

                <div className="notice-content">
                  {notice.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="notice-footer">
                  <span className="notice-target">
                    Audience: {notice.targetRole === 'all' ? 'Everyone' :
                              notice.targetRole === 'teacher' ? 'Teachers Only' :
                              'Students Only'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-notices">
            <FaBell className="no-notices-icon" />
            <p>No notices available.</p>
            {canCreateNotices() && (
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Create First Notice
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices;
