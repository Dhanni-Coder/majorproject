import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaPlus } from 'react-icons/fa';

/**
 * LibraryHeader Component
 * Displays the header section of the library page
 */
const LibraryHeader = ({ userRole }) => {
  return (
    <header className="library-header">
      <div className="header-content">
        <h1>
          <FaBook className="icon" />
          <span className="title-text">Digital Library</span>
        </h1>
        <p>Explore our collection of books and resources</p>
      </div>

      {/* Admin/Teacher Actions */}
      {userRole !== 'student' && (
        <div className="header-actions">
          <Link to="/add-book" className="btn-add-book">
            <FaPlus className="icon" /> Add New Book
          </Link>
        </div>
      )}
    </header>
  );
};

// PropTypes validation removed temporarily

export default LibraryHeader;
