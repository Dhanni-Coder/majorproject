import React from 'react';
import { FaBook, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import '../../styles/common/EmptyState.css';

/**
 * EmptyState Component
 * Displays a message when no content is available
 */
const EmptyState = ({ icon, title, message, action }) => {
  // Get icon component based on icon name
  const getIcon = () => {
    switch (icon) {
      case 'book':
        return <FaBook className="empty-icon" />;
      case 'search':
        return <FaSearch className="empty-icon" />;
      default:
        return <FaExclamationCircle className="empty-icon" />;
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-icon-container">
          {getIcon()}
        </div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-message">{message}</p>
        {action && (
          <div className="empty-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default EmptyState;
