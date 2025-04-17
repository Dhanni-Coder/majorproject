import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaBell, FaExclamationTriangle } from 'react-icons/fa';

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
        // Only show the 3 most recent notices
        setNotices(res.data.slice(0, 3));
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

  return (
    <div className="widget notice-widget">
      <div className="widget-header">
        <h3><FaBell /> Recent Notices</h3>
        <Link to="/notices" className="widget-link">View All</Link>
      </div>
      
      <div className="widget-content">
        {loading ? (
          <div className="widget-loading">Loading notices...</div>
        ) : error ? (
          <div className="widget-error">{error}</div>
        ) : notices.length > 0 ? (
          <div className="widget-notices">
            {notices.map(notice => (
              <div 
                key={notice._id} 
                className={`widget-notice ${notice.important ? 'notice-important' : ''}`}
              >
                <div className="widget-notice-header">
                  <h4>
                    {notice.important && <FaExclamationTriangle className="important-icon" />}
                    {notice.title}
                  </h4>
                  <span className="widget-notice-date">{formatDate(notice.date)}</span>
                </div>
                <p className="widget-notice-sender">
                  From: {notice.sender.name} ({notice.sender.role})
                </p>
                <div className="widget-notice-content">
                  {notice.content.length > 100 
                    ? `${notice.content.substring(0, 100)}...` 
                    : notice.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty">
            <p>No notices available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeWidget;
