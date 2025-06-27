import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaBell, FaExclamationTriangle, FaArrowRight, FaUsers, FaUserTie, FaUserGraduate } from 'react-icons/fa';
import '../styles/Notice.css';

const NoticeWidget = () => {
  const { token } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotices = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        const res = await axios.get('http://localhost:5000/api/notices');
        // Only show the 4 most recent notices
        setNotices(res.data.slice(0, 4));
        setError('');
      } catch (err) {
        console.error('Error fetching notices:', err);
        setError('Failed to load notices');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [token]);

  // Function to format date
  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  return (
    <div className="widget notice-widget">
      <div className="widget-header">
        <h3><FaBell className="widget-icon" /> Recent Notices</h3>
        <Link to="/notices" className="widget-link">
          View All <FaArrowRight className="arrow-icon" />
        </Link>
      </div>

      <div className="widget-content">
        {loading ? (
          <div className="widget-loading">
            <div className="widget-loading-spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : error ? (
          <div className="widget-error">
            <p>{error}</p>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : notices.length > 0 ? (
          <div className="widget-notices">
            {notices.map(notice => (
              <div
                key={notice._id}
                className={`widget-notice ${notice.important ? 'notice-important' : ''}`}
              >
                <div className="widget-notice-header">
                  <div className="widget-notice-title">
                    {notice.important && (
                      <span className="important-badge" title="Important Notice">
                        <FaExclamationTriangle className="important-icon" />
                      </span>
                    )}
                    <h4>{notice.title}</h4>
                  </div>
                  <span className="widget-notice-date">{formatDate(notice.date)}</span>
                </div>

                <div className="widget-notice-meta">
                  <div className="widget-notice-sender">
                    <span className="sender-name">{notice.sender.name}</span>
                    <span className={`sender-role ${notice.sender.role}`}>{notice.sender.role}</span>
                  </div>
                  <div className="widget-notice-target" title={`For ${notice.targetRole === 'all' ? 'Everyone' : notice.targetRole === 'teacher' ? 'Teachers Only' : 'Students Only'}`}>
                    {getTargetIcon(notice.targetRole)}
                  </div>
                </div>

                <div className="widget-notice-content">
                  {notice.content.length > 120
                    ? `${notice.content.substring(0, 120)}...`
                    : notice.content}
                </div>

                <Link to="/notices" className="widget-notice-link">
                  Read more <FaArrowRight className="read-more-icon" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <FaBell className="empty-icon" />
            <p>No notices available</p>
            <Link to="/notices" className="btn btn-sm btn-primary">
              View Notices Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeWidget;
