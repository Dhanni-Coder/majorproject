import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

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

      await axios.put(`http://localhost:5000/api/notices/${id}`, formData);

      // Show success message
      setSuccessMessage('Notice updated successfully!');

      // Redirect to notices page after a short delay
      setTimeout(() => {
        navigate('/notices');
      }, 1500);
    } catch (err) {
      console.error('Error updating notice:', err);
      setError(err.response?.data?.msg || 'Error updating notice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user can edit this notice
  const canEditNotice = () => {
    if (!user || !notice) return false;
    return user.role === 'admin' || notice.sender._id === user.id;
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
        { value: 'all', label: 'Everyone' },
        { value: 'student', label: 'Students Only' }
      ];
    }
    return [];
  };

  if (loading && !notice) {
    return <div className="loading">Loading notice...</div>;
  }

  if (!canEditNotice()) {
    return (
      <div className="unauthorized">
        <h2>Not Authorized</h2>
        <p>You do not have permission to edit this notice.</p>
        <Link to="/notices" className="btn btn-primary">
          <FaArrowLeft /> Back to Notices
        </Link>
      </div>
    );
  }

  return (
    <div className="edit-notice-page">
      <div className="page-header">
        <h1>Edit Notice</h1>
        <Link to="/notices" className="btn btn-outline">
          <FaArrowLeft /> Back to Notices
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="notice-form">
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
                disabled={user.role !== 'admin'}
              >
                {getAvailableTargetRoles().map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {user.role !== 'admin' && (
                <small className="form-text">Only admins can change the target audience.</small>
              )}
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
            {loading ? 'Updating...' : 'Update Notice'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditNotice;
