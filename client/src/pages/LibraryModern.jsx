import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import BookCard from '../components/library/BookCard';
import IssuedBookCard from '../components/library/IssuedBookCard';
import BookDetailsModal from '../components/library/BookDetailsModal';
import LibraryHeader from '../components/library/LibraryHeader';
import SearchFilters from '../components/library/SearchFilters';
import Pagination from '../components/library/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import EmptyState from '../components/common/EmptyState';
import { API_URL } from '../config/constants';
import '../styles/LibraryModern.css';

/**
 * Modern Library Page Component
 * Displays books collection with search, filter, and sorting capabilities
 */
const LibraryModern = () => {
  // Auth context
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // State for books and related data
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(12);
  
  // Modal state
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetails, setShowBookDetails] = useState(false);

  /**
   * Fetch all required data on component mount
   */
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        setError('');

        // Set auth token for API requests
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch all data in parallel for better performance
        const [booksRes, branchesRes, issuedBooksRes] = await Promise.all([
          axios.get(`${API_URL}/books`),
          axios.get(`${API_URL}/branches`),
          user?.role === 'student' 
            ? axios.get(`${API_URL}/book-issues/student`) 
            : Promise.resolve({ data: [] })
        ]);

        // Update state with fetched data
        setBooks(booksRes.data);
        setBranches(branchesRes.data);
        
        if (user?.role === 'student') {
          setIssuedBooks(issuedBooksRes.data);
        }
      } catch (err) {
        console.error('Error fetching library data:', err);
        setError('Failed to load library data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLibraryData();
    } else {
      navigate('/login');
    }
  }, [token, user, navigate]);

  /**
   * Filter and sort books based on current filters
   */
  const filteredAndSortedBooks = useMemo(() => {
    // Start with all books
    let result = [...books];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.isbn && book.isbn.toLowerCase().includes(query))
      );
    }

    // Apply branch filter
    if (branchFilter) {
      result = result.filter(book => book.branch === branchFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      // Determine values to compare based on sort field
      switch (sortBy) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'author':
          valueA = a.author.toLowerCase();
          valueB = b.author.toLowerCase();
          break;
        case 'availability':
          valueA = a.availableQuantity;
          valueB = b.availableQuantity;
          break;
        default:
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
      }
      
      // Apply sort order
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return result;
  }, [books, searchQuery, branchFilter, sortBy, sortOrder]);

  /**
   * Calculate pagination values
   */
  const paginationData = useMemo(() => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = filteredAndSortedBooks.slice(indexOfFirstBook, indexOfLastBook);
    const totalPages = Math.ceil(filteredAndSortedBooks.length / booksPerPage);
    
    return {
      currentBooks,
      totalPages,
      totalItems: filteredAndSortedBooks.length
    };
  }, [filteredAndSortedBooks, currentPage, booksPerPage]);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  /**
   * Handle branch filter change
   */
  const handleBranchFilterChange = useCallback((value) => {
    setBranchFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((field) => {
    if (sortBy === field) {
      // If clicking the same field, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  /**
   * Handle book selection for viewing details
   */
  const handleViewBookDetails = useCallback((book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  }, []);

  /**
   * Handle closing book details modal
   */
  const handleCloseBookDetails = useCallback(() => {
    setShowBookDetails(false);
    setSelectedBook(null);
  }, []);

  /**
   * Handle issuing a book to a student
   */
  const handleIssueBook = useCallback((book) => {
    // Implementation for issuing book would go here
    console.log('Issue book:', book);
    // This would typically open a modal or navigate to issue page
  }, []);

  /**
   * Handle returning a book
   */
  const handleReturnBook = useCallback(async (issueId) => {
    try {
      setLoading(true);
      setError('');
      
      // Call API to return book
      await axios.put(`${API_URL}/book-issues/${issueId}/return`);
      
      // Update issued books list
      const updatedIssues = await axios.get(`${API_URL}/book-issues/student`);
      setIssuedBooks(updatedIssues.data);
      
      // Update books list to reflect availability changes
      const updatedBooks = await axios.get(`${API_URL}/books`);
      setBooks(updatedBooks.data);
      
      setSuccessMessage('Book returned successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error returning book:', err);
      setError(err.response?.data?.msg || 'Failed to return book. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  // If loading, show spinner
  if (loading && books.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="library-modern">
      {/* Library Header */}
      <LibraryHeader 
        userRole={user?.role} 
      />

      {/* Alert Messages */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}
      
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {/* Student's Issued Books Section */}
      {user?.role === 'student' && (
        <section className="issued-books-section">
          <div className="section-header">
            <h2>My Books</h2>
            <div className="book-limit-indicator">
              <span className={issuedBooks.length >= 3 ? 'limit-warning' : ''}>
                {issuedBooks.length}/3 books borrowed
              </span>
            </div>
          </div>

          {issuedBooks.length > 0 ? (
            <div className="issued-books-grid">
              {issuedBooks.map(issue => (
                <IssuedBookCard
                  key={issue._id}
                  issue={issue}
                  onViewDetails={() => handleViewBookDetails(issue.book)}
                  onReturn={() => handleReturnBook(issue._id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="book"
              title="No books borrowed"
              message="Browse the library and borrow books to see them here"
            />
          )}
        </section>
      )}

      {/* Library Collection Section */}
      <section className="library-collection">
        <div className="section-header">
          <h2>Library Collection</h2>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          branches={branches}
          selectedBranch={branchFilter}
          onBranchChange={handleBranchFilterChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Books Grid */}
        {paginationData.currentBooks.length > 0 ? (
          <>
            <div className="books-grid">
              {paginationData.currentBooks.map(book => (
                <BookCard
                  key={book._id}
                  book={book}
                  branches={branches}
                  onViewDetails={() => handleViewBookDetails(book)}
                  onIssue={user?.role !== 'student' ? () => handleIssueBook(book) : null}
                />
              ))}
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={paginationData.totalPages}
              onPageChange={setCurrentPage}
              totalItems={paginationData.totalItems}
              itemsPerPage={booksPerPage}
            />
          </>
        ) : (
          <EmptyState
            icon="search"
            title="No books found"
            message={searchQuery || branchFilter ? "Try adjusting your search or filters" : "No books available in the library"}
          />
        )}
      </section>

      {/* Book Details Modal */}
      {showBookDetails && selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          branches={branches}
          onClose={handleCloseBookDetails}
          onIssue={user?.role !== 'student' ? handleIssueBook : null}
          userRole={user?.role}
        />
      )}
    </div>
  );
};

export default LibraryModern;
