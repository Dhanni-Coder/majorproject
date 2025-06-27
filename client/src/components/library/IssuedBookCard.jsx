import React from 'react';
import { FaBook, FaInfoCircle, FaExchangeAlt, FaExclamationTriangle, FaRegCalendarAlt } from 'react-icons/fa';
import { API_URL } from '../../config/constants';

/**
 * IssuedBookCard Component
 * Displays a book that has been issued to a student
 */
const IssuedBookCard = ({ issue, onViewDetails, onReturn }) => {
  // Calculate if book is overdue
  const dueDate = new Date(issue.dueDate);
  const today = new Date();
  const isOverdue = today > dueDate;

  // Format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days remaining or overdue
  const getDaysMessage = () => {
    const diffTime = Math.abs(dueDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} overdue`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    }
  };

  return (
    <div className={`issued-book-card ${isOverdue ? 'overdue' : ''}`}>
      {/* Book Cover */}
      <div className="book-cover" onClick={onViewDetails}>
        {issue.book.coverImage ? (
          <img
            src={`${API_URL}${issue.book.coverImage}`}
            alt={issue.book.title}
            loading="lazy"
          />
        ) : (
          <div className="book-cover-placeholder">
            <FaBook className="book-icon" />
          </div>
        )}

        {/* Overdue Badge */}
        {isOverdue && (
          <div className="overdue-badge">
            <FaExclamationTriangle /> Overdue
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h3 className="book-title" onClick={onViewDetails}>{issue.book.title}</h3>
        <p className="book-author">By {issue.book.author}</p>

        <div className="issue-dates">
          <div className="issue-date">
            <FaRegCalendarAlt className="icon" />
            <span>Issued: {formatDate(issue.issueDate)}</span>
          </div>
          <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <FaRegCalendarAlt className="icon" />
            <span>Due: {formatDate(issue.dueDate)}</span>
            <span className="days-indicator">{getDaysMessage()}</span>
          </div>
        </div>

        {/* Book Actions */}
        <div className="book-actions">
          <button
            className="btn-details"
            onClick={onViewDetails}
          >
            <FaInfoCircle /> Details
          </button>

          <button
            className="btn-return"
            onClick={onReturn}
          >
            <FaExchangeAlt /> Return
          </button>
        </div>
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default IssuedBookCard;
