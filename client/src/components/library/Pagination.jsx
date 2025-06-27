import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Pagination Component
 * Provides pagination controls for the library
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) => {
  // If there's only one page or no items, don't show pagination
  if (totalPages <= 1) return null;

  // Calculate start and end item numbers
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handle page change
  const handlePageChange = (newPage) => {
    // Ensure page is within valid range
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);

      // Scroll to top of the page for better UX
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Calculate start and end of page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the beginning
      if (currentPage <= 2) {
        endPage = 4;
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always include last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing <span className="highlight">{startItem}-{endItem}</span> of <span className="highlight">{totalItems}</span> books
      </div>

      <div className="pagination-controls">
        {/* Previous Page Button */}
        <button
          className="pagination-btn prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
          <span className="btn-text">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="page-numbers">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="ellipsis">...</span>
            ) : (
              <button
                key={`page-${page}`}
                className={`page-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={currentPage === page}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Page Button */}
        <button
          className="pagination-btn next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="btn-text">Next</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

// PropTypes validation removed temporarily

export default Pagination;
