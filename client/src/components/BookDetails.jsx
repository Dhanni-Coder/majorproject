import React from 'react';
import { FaBook, FaUser, FaCalendarAlt, FaCheckCircle, FaTimes, FaInfoCircle } from 'react-icons/fa';
import '../styles/BookDetails.css';

const BookDetails = ({ book, onClose, onIssue, user }) => {
  if (!book) return null;

  return (
    <div className="book-details-overlay">
      <div className="book-details-container">
        <div className="book-details-header">
          <h2>Book Details</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="book-details-content">
          <div className="book-cover">
            {book.coverImage ? (
              <img src={`http://localhost:5000${book.coverImage}`} alt={book.title} />
            ) : (
              <div className="book-cover-placeholder">
                <FaBook className="book-icon" />
              </div>
            )}
          </div>

          <div className="book-info">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">By {book.author}</p>
            
            {book.isbn && (
              <p className="book-isbn">
                <span className="label">ISBN:</span> {book.isbn}
              </p>
            )}
            
            <p className="book-availability">
              <span className="label">Availability:</span>
              {book.availableQuantity > 0 ? (
                <span className="available">
                  <FaCheckCircle /> Available ({book.availableQuantity}/{book.quantity})
                </span>
              ) : (
                <span className="unavailable">
                  <FaTimes /> Not Available (0/{book.quantity})
                </span>
              )}
            </p>
            
            {book.branch && book.branch.name && (
              <p className="book-branch">
                <span className="label">Branch:</span> {book.branch.name}
              </p>
            )}
            
            {book.addedBy && (
              <p className="book-added-by">
                <span className="label">Added by:</span> {book.addedBy.name || 'Unknown'}
              </p>
            )}
            
            {book.createdAt && (
              <p className="book-added-date">
                <span className="label">Added on:</span> {new Date(book.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {book.description && (
          <div className="book-description">
            <h4>Description</h4>
            <p>{book.description}</p>
          </div>
        )}

        <div className="book-actions">
          {user && user.role !== 'student' && book.availableQuantity > 0 && (
            <button className="btn btn-primary" onClick={() => onIssue(book)}>
              <FaUser className="icon" /> Issue to Student
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            <FaTimes className="icon" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
