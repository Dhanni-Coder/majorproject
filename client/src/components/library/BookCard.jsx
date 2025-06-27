import React from 'react';
import { FaBook, FaInfoCircle, FaUser, FaCheckCircle, FaTimes, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { API_URL } from '../../config/constants';

/**
 * BookCard Component
 * Displays a single book in a card format
 */
const BookCard = ({ book, branches, onViewDetails, onIssue, onEdit, onDelete, userRole }) => {
  // Find branch name from branch ID
  const branchName = branches.find(b => b._id === book.branch)?.name || 'Unknown';

  // Check if book is available
  const isAvailable = book.availableQuantity > 0;

  // Check if user is admin or teacher
  const canManageBooks = userRole === 'admin' || userRole === 'teacher';

  return (
    <div className="book-card">
      {/* Book Cover */}
      <div className="book-cover" onClick={onViewDetails}>
        {book.coverImage ? (
          <img
            src={`${API_URL}${book.coverImage}`}
            alt={book.title}
            loading="lazy"
          />
        ) : (
          <div className="book-cover-placeholder">
            <FaBook className="book-icon" />
          </div>
        )}

        {/* Availability Badge */}
        <div className={`book-badge ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? (
            <>
              <FaCheckCircle /> Available
            </>
          ) : (
            <>
              <FaTimes /> Not Available
            </>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h3 className="book-title" onClick={onViewDetails}>{book.title}</h3>
        <p className="book-author">By {book.author}</p>

        <div className="book-meta">
          <span className="book-branch">{branchName}</span>
          <span className="book-quantity">
            {book.availableQuantity}/{book.quantity}
          </span>
        </div>

        {/* Book Actions */}
        <div className="book-actions">
          <button
            className="btn-details"
            onClick={onViewDetails}
          >
            <FaInfoCircle /> Details
          </button>

          {onIssue && isAvailable && (
            <button
              className="btn-issue"
              onClick={() => onIssue(book)}
              disabled={!isAvailable}
            >
              <FaUser /> Issue
            </button>
          )}

          {/* Admin/Teacher Actions */}
          {canManageBooks && (
            <div className="admin-actions">
              <button
                className="btn-edit"
                onClick={() => onEdit(book)}
                title="Edit Book"
              >
                <FaEdit />
              </button>

              <button
                className="btn-delete"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this book?')) {
                    onDelete(book._id);
                  }
                }}
                title="Delete Book"
              >
                <FaTrashAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default BookCard;
