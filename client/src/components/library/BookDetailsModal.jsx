import React from 'react';
import {
  FaBook,
  FaUser,
  FaTimes,
  FaCheckCircle,
  FaCalendarAlt,
  FaInfoCircle,
  FaBookReader,
  FaBarcode,
  FaEdit,
  FaTrashAlt
} from 'react-icons/fa';
import { API_URL } from '../../config/constants';

/**
 * BookDetailsModal Component
 * Displays detailed information about a book in a modal
 */
const BookDetailsModal = ({ book, branches, onClose, onIssue, onEdit, onDelete, userRole }) => {
  // Find branch name from branch ID
  const branchName = branches.find(b => b._id === book.branch)?.name || 'Unknown';

  // Check if book is available
  const isAvailable = book.availableQuantity > 0;

  // Check if user is admin or teacher
  const canManageBooks = userRole === 'admin' || userRole === 'teacher';

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="book-details-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Book Details</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Book Cover and Basic Info */}
          <div className="book-main-details">
            <div className="book-cover-large">
              {book.coverImage ? (
                <img
                  src={`${API_URL}${book.coverImage}`}
                  alt={book.title}
                />
              ) : (
                <div className="book-cover-placeholder">
                  <FaBook className="book-icon" />
                </div>
              )}
            </div>

            <div className="book-primary-info">
              <h1 className="book-title">{book.title}</h1>
              <h2 className="book-author">By {book.author}</h2>

              <div className="book-availability-status">
                {isAvailable ? (
                  <div className="status available">
                    <FaCheckCircle /> Available ({book.availableQuantity}/{book.quantity})
                  </div>
                ) : (
                  <div className="status unavailable">
                    <FaTimes /> Not Available (0/{book.quantity})
                  </div>
                )}
              </div>

              <div className="book-metadata">
                {book.isbn && (
                  <div className="metadata-item">
                    <FaBarcode className="icon" />
                    <span className="label">ISBN:</span>
                    <span className="value">{book.isbn}</span>
                  </div>
                )}

                <div className="metadata-item">
                  <FaBookReader className="icon" />
                  <span className="label">Branch:</span>
                  <span className="value">{branchName}</span>
                </div>

                {book.createdAt && (
                  <div className="metadata-item">
                    <FaCalendarAlt className="icon" />
                    <span className="label">Added on:</span>
                    <span className="value">{formatDate(book.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Description */}
          {book.description && (
            <div className="book-description">
              <h3>
                <FaInfoCircle className="icon" /> Description
              </h3>
              <p>{book.description}</p>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="modal-footer">
          {/* Teacher/Admin Actions */}
          <div className="left-actions">
            {canManageBooks && (
              <>
                <button
                  className="btn-edit"
                  onClick={() => onEdit(book)}
                >
                  <FaEdit /> Edit Book
                </button>

                <button
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this book?')) {
                      onDelete(book._id);
                      onClose();
                    }
                  }}
                >
                  <FaTrashAlt /> Delete Book
                </button>
              </>
            )}
          </div>

          {/* Common Actions */}
          <div className="right-actions">
            {userRole !== 'student' && isAvailable && (
              <button
                className="btn-primary"
                onClick={() => onIssue(book)}
                disabled={!isAvailable}
              >
                <FaUser /> Issue to Student
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={onClose}
            >
              <FaTimes /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default BookDetailsModal;
