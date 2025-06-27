import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import '../../styles/common/Alert.css';

/**
 * Alert Component
 * Displays alert messages with auto-dismiss functionality
 */
const Alert = ({ type, message, onClose, autoDismiss = true, dismissTime = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss the alert after specified time
  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Call onClose after fade out animation
      }, dismissTime);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissTime, isVisible, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Call onClose after fade out animation
  };

  // Get icon based on alert type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="alert-icon" />;
      case 'error':
        return <FaExclamationTriangle className="alert-icon" />;
      case 'info':
        return <FaInfoCircle className="alert-icon" />;
      default:
        return <FaInfoCircle className="alert-icon" />;
    }
  };

  return (
    <div className={`alert alert-${type} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="alert-content">
        {getIcon()}
        <div className="alert-message">{message}</div>
      </div>
      <button className="alert-close" onClick={handleClose}>
        <FaTimes />
      </button>
    </div>
  );
};

// PropTypes validation removed temporarily

export default Alert;
