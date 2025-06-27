import React from 'react';
import '../../styles/common/LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Displays a loading spinner animation
 */
const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-text">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
