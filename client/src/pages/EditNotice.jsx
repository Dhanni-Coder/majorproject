import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaArrowLeft, FaSave, FaBell, FaExclamationTriangle,
  FaUsers, FaUserTie, FaUserGraduate, FaTimes
} from 'react-icons/fa';
import '../styles/Notice.css';

const EditNotice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    important: false
  });

  useEffect(() => {
    const fetchNotice = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        const res = await axios.get(`http://localhost:5000/api/notices/${id}`);
        setNotice(res.data);

        // Set form data
        setFormData({
          title: res.data.title,
          content: res.data.content,
          targetRole: res.data.targetRole,
          important: res.data.important
        });

        setError('');
      } catch (err) {
        console.error('Error fetching notice:', err);
        setError('Failed to load notice: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id, token]);

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

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Log the data being sent for debugging
      console.log('Sending update data:', formData);

      // Make sure to send all fields explicitly
      const response = await axios.put(`http://localhost:5000/api/notices/${id}`, {
        title: formData.title,
        content: formData.content,
        targetRole: formData.targetRole,
        important: formData.important
      });

      console.log('Update response:', response.data);

      // Show success message
      setSuccessMessage('Notice updated successfully!');

      // Redirect to notices page after a short delay
      setTimeout(() => {
        navigate('/notices');
      }, 1500);
    } catch (err) {
      console.error('Error updating notice:', err);

      // Log detailed error information
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
      }

      // Set a more detailed error message
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        setError(`${err.response.data.msg} (Role: ${details.userRole}, Target: ${details.noticeTargetRole})`);
      } else {
        setError(err.response?.data?.msg || 'Error updating notice: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user can edit this notice
  const canEditNotice = () => {
    if (!user || !notice) return false;

    // Admin can edit any notice
    if (user.role === 'admin') return true;

    // Teachers can edit their own notices and notices for students
    if (user.role === 'teacher') {
      // Teachers can always edit their own notices
      if (notice.sender._id === user.id) return true;

      // Teachers can also edit notices targeted to students
      if (notice.targetRole === 'student') return true;
    }

    // Students can't edit any notices
    return false;
  };

  // Function to get available target roles based on user role
  const getAvailableTargetRoles = () => {
    if (!user) return [];

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

  // Get target audience icon
  const getTargetIcon = (targetRole) => {
    switch(targetRole) {
      case 'teacher':
        return <FaUserTie className="target-role-icon" />;
      case 'student':
        return <FaUserGraduate className="target-role-icon" />;
      default:
        return <FaUsers className="target-role-icon" />;
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

  if (loading && !notice) {
    return (
      <div className="edit-notice-loading">
        <div className="loading-spinner"></div>
        <p>Loading notice...</p>
      </div>
    );
  }

  if (!canEditNotice()) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized">
          <div className="unauthorized-icon">
            <FaTimes />
          </div>
          <h2>Not Authorized</h2>
          <p>You do not have permission to edit this notice.</p>
          <Link to="/notices" className="btn btn-primary">
            <FaArrowLeft /> Back to Notices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-notice-page">
      <div className="edit-notice-header">
        <div className="edit-notice-title">
          <h1><FaBell className="page-icon" /> Edit Notice</h1>
          <p className="edit-notice-subtitle">Update the details of your notice</p>
        </div>
        <Link to="/notices" className="btn btn-outline back-btn">
          <FaArrowLeft /> Back to Notices
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="edit-notice-container">
        <div className="notice-form">
          <div className="notice-form-header">
            <h2>Edit Notice Details</h2>
            {notice && notice.important && (
              <div className="important-notice-badge">
                <FaExclamationTriangle /> Important Notice
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter the notice content here..."
                rows="6"
                required
                className="form-control"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group target-role-group">
                <label htmlFor="targetRole">
                  Target Audience {getTargetIcon(formData.targetRole)}
                </label>
                <div className="select-wrapper">
                  <select
                    id="targetRole"
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    {getAvailableTargetRoles().map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group important-checkbox">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="important"
                    checked={formData.important}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  Mark as Important
                </label>
                <small className="form-text">Important notices are highlighted and appear at the top</small>
              </div>
            </div>

            <div className="form-actions">
              <Link to="/notices" className="btn btn-outline">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : <><FaSave /> Update Notice</>}
              </button>
            </div>
          </form>
        </div>

        <div className="notice-preview">
          <div className="preview-header">
            <h3>Preview</h3>
            <small>This is how your notice will appear after updating</small>
          </div>

          <div className={`notice-card preview ${formData.important ? 'notice-important' : ''}`}>
            {formData.important && <div className="notice-important-badge">Important</div>}

            <div className="notice-header">
              <h3 className="notice-title">
                {formData.important && <FaExclamationTriangle className="important-icon" />}
                {formData.title || 'Notice Title'}
              </h3>
            </div>

            <div className="notice-meta">
              <div className="notice-sender">
                <span className="sender-label">From:</span>
                <span className="sender-name">{user?.name || 'User'}</span>
                <span className={`sender-role ${user?.role}`}>{user?.role}</span>
              </div>
              <div className="notice-date">
                {formatDate(new Date())}
              </div>
            </div>

            <div className="notice-content">
              {formData.content
                ? formData.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                : <p>Notice content will appear here...</p>
              }
            </div>

            <div className="notice-footer">
              <div className={`notice-target ${formData.targetRole}`}>
                <span className="target-icon">
                  {getTargetIcon(formData.targetRole)}
                </span>
                <span className="target-text">
                  {formData.targetRole === 'all' ? 'For Everyone' :
                   formData.targetRole === 'teacher' ? 'For Teachers Only' :
                   'For Students Only'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditNotice;
