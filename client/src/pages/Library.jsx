import { useState, useEffect, useContext, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaBook, FaSearch, FaPlus, FaFilter, FaQrcode,
  FaExchangeAlt, FaInfoCircle, FaCheckCircle, FaTimes,
  FaBookOpen, FaBookReader, FaExclamationTriangle,
  FaRegCalendarAlt, FaArrowUp, FaArrowDown, FaBookmark
} from 'react-icons/fa';
import SimpleQRScanner from '../components/SimpleQRScanner';
import BookDetails from '../components/BookDetails';
import ReturnQRCode from '../components/ReturnQRCode';
import '../styles/Library.css';

const Library = () => {
  // State variables
  const { user, token } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState('issue');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [issuingInProgress, setIssuingInProgress] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [bookForDetails, setBookForDetails] = useState(null);
  const [showReturnQR, setShowReturnQR] = useState(false);
  const [issueForQR, setIssueForQR] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(12);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch all data in parallel
        const [booksRes, branchesRes, issuedBooksRes] = await Promise.all([
          axios.get('http://localhost:5000/api/books'),
          axios.get('http://localhost:5000/api/branches'),
          user.role === 'student'
            ? axios.get('http://localhost:5000/api/book-issues/student')
            : Promise.resolve({ data: [] })
        ]);

        setBooks(booksRes.data);
        setBranches(branchesRes.data);
        if (user.role === 'student') {
          setIssuedBooks(issuedBooksRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching library data:', err);
        setError('Failed to load library data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Sort and filter books
  const sortedAndFilteredBooks = useMemo(() => {
    let filteredBooks = [...books];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredBooks = filteredBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.isbn && book.isbn.toLowerCase().includes(query))
      );
    }

    // Apply branch filter
    if (branchFilter) {
      filteredBooks = filteredBooks.filter(book => book.branch === branchFilter);
    }

    // Apply sorting
    filteredBooks.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'author') {
        comparison = a.author.localeCompare(b.author);
      } else if (sortBy === 'availability') {
        comparison = a.availableQuantity - b.availableQuantity;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filteredBooks;
  }, [books, searchQuery, branchFilter, sortBy, sortOrder]);

  // Pagination
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedAndFilteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(sortedAndFilteredBooks.length / booksPerPage);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle book selection for issuing
  const handleBookSelect = (book) => {
    setSelectedBook(book);
    if (scannerMode !== 'issue') {
      setScannerMode('issue');
      setShowScanner(true);
    }
  };

  // Handle QR scan result
  const handleScanResult = async (result) => {
    try {
      setLoading(true);

      if (scannerMode === 'issue') {
        // Handle student QR scan for issuing
        const studentRes = await axios.get(`http://localhost:5000/api/users/${result}`);
        setSelectedStudent(studentRes.data);
        setShowScanner(false);

        if (!selectedBook) {
          setSuccessMessage('Student selected. Now select a book to issue.');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          // Both student and book are selected, proceed with issuing
          await issueBook(result, selectedBook._id);
        }
      } else if (scannerMode === 'return') {
        // Handle return QR scan
        // Verify the issue exists before attempting to return
        await axios.get(`http://localhost:5000/api/book-issues/${result}`);
        const success = await returnBook(result);
        if (success) {
          setShowScanner(false);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error processing scan:', err);
      setError(err.response?.data?.msg || 'Failed to process QR code. Please try again.');
      setLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Issue book
  const issueBook = async (studentId, bookId) => {
    try {
      setIssuingInProgress(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Issue book
      await axios.post('http://localhost:5000/api/book-issues', {
        student: studentId,
        book: bookId
      });

      setSuccessMessage('Book issued successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh books to update available quantity
      const booksRes = await axios.get('http://localhost:5000/api/books');
      setBooks(booksRes.data);

      // Reset selection
      setSelectedStudent(null);
      setSelectedBook(null);
      setIssuingInProgress(false);
      return true;
    } catch (err) {
      console.error('Error issuing book:', err);
      setError(err.response?.data?.msg || 'Failed to issue book. Please try again.');
      setIssuingInProgress(false);
      setTimeout(() => setError(''), 3000);
      return false;
    }
  };

  // Return book
  const returnBook = async (issueId) => {
    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Return book
      await axios.put(`http://localhost:5000/api/book-issues/${issueId}/return`);

      setSuccessMessage('Book returned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Refresh data
      if (user.role === 'student') {
        const issuedBooksRes = await axios.get('http://localhost:5000/api/book-issues/student');
        setIssuedBooks(issuedBooksRes.data);
      }

      const booksRes = await axios.get('http://localhost:5000/api/books');
      setBooks(booksRes.data);

      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error returning book:', err);
      setError(err.response?.data?.msg || 'Failed to return book. Please try again.');
      setLoading(false);
      setTimeout(() => setError(''), 3000);
      return false;
    }
  };

  // Handle viewing book details
  const handleViewBookDetails = (book) => {
    setBookForDetails(book);
    setShowBookDetails(true);
  };

  // Handle closing book details
  const handleCloseBookDetails = () => {
    setShowBookDetails(false);
    setBookForDetails(null);
  };

  // Handle showing return QR code
  const handleShowReturnQR = (issue) => {
    setIssueForQR(issue);
    setShowReturnQR(true);
  };

  // Handle closing return QR code
  const handleCloseReturnQR = () => {
    setShowReturnQR(false);
    setIssueForQR(null);
  };

  // Render book card
  const renderBookCard = (book) => {
    return (
      <div className="book-card" key={book._id}>
        <div className="book-cover" onClick={() => handleViewBookDetails(book)}>
          {book.coverImage ? (
            <img src={`http://localhost:5000${book.coverImage}`} alt={book.title} />
          ) : (
            <div className="book-cover-placeholder">
              <FaBookOpen className="book-icon" />
            </div>
          )}
          {book.availableQuantity === 0 && (
            <div className="book-unavailable-badge">
              <FaTimes /> Not Available
            </div>
          )}
        </div>
        <div className="book-details" onClick={() => handleViewBookDetails(book)}>
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">By {book.author}</p>
          {book.isbn && <p className="book-isbn">ISBN: {book.isbn}</p>}
          <p className="book-availability">
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
          {book.branch && (
            <p className="book-branch">
              <FaBookReader /> {branches.find(b => b._id === book.branch)?.name || 'Unknown'}
            </p>
          )}
        </div>
        <div className="book-actions">
          {user.role !== 'student' && book.availableQuantity > 0 && (
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleBookSelect(book);
              }}
              disabled={selectedBook && selectedBook._id === book._id || issuingInProgress}
            >
              <FaExchangeAlt /> Issue
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleViewBookDetails(book);
            }}
          >
            <FaInfoCircle /> Details
          </button>
        </div>
      </div>
    );
  };

  // Render issued book card
  const renderIssuedBookCard = (issue) => {
    const dueDate = new Date(issue.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today && issue.status === 'issued';

    return (
      <div className={`issued-book-card ${isOverdue ? 'overdue' : ''}`} key={issue._id}>
        <div className="book-cover" onClick={() => handleViewBookDetails(issue.book)}>
          {issue.book.coverImage ? (
            <img src={`http://localhost:5000${issue.book.coverImage}`} alt={issue.book.title} />
          ) : (
            <div className="book-cover-placeholder">
              <FaBook className="book-icon" />
            </div>
          )}
          {isOverdue && (
            <div className="overdue-badge">
              <FaExclamationTriangle /> Overdue
            </div>
          )}
        </div>
        <div className="issued-book-info">
          <h3 className="issued-book-title">{issue.book.title}</h3>
          <p className="issued-book-author">By {issue.book.author}</p>
          <div className="issued-book-dates">
            <p className="issued-book-date">
              <FaRegCalendarAlt className="icon" /> <span>Issued:</span> {new Date(issue.issueDate).toLocaleDateString()}
            </p>
            <p className={`issued-book-date ${isOverdue ? 'overdue' : ''}`}>
              <FaRegCalendarAlt className="icon" /> <span>Due:</span> {dueDate.toLocaleDateString()}
              {isOverdue && ` (${Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))} days overdue)`}
            </p>
          </div>
        </div>
        <div className="issued-book-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleShowReturnQR(issue)}
          >
            <FaQrcode /> Return QR
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleViewBookDetails(issue.book)}
          >
            <FaInfoCircle /> Details
          </button>
        </div>
      </div>
    );
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  // If not authenticated, redirect to login
  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="library-page">
      {/* Enhanced Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1><FaBook className="icon" /> Digital Library</h1>
          <p>Explore our collection of books and resources</p>
        </div>
        {user.role !== 'student' && (
          <Link to="/add-book" className="add-book-btn">
            <FaPlus className="icon" /> Add New Book
          </Link>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          <FaTimes className="icon" /> {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <FaCheckCircle className="icon" /> {successMessage}
        </div>
      )}

      {/* Enhanced Search and Filter Section */}
      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch}>
            <FaSearch className="icon" /> Search
          </button>
        </div>

        <div className="filter-box">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          <button onClick={handleSearch}>
            <FaFilter className="icon" /> Filter
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="sort-controls">
        <span>Sort by:</span>
        <button
          className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
          onClick={() => handleSortChange('title')}
        >
          Title {sortBy === 'title' && (sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          className={`sort-btn ${sortBy === 'author' ? 'active' : ''}`}
          onClick={() => handleSortChange('author')}
        >
          Author {sortBy === 'author' && (sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          className={`sort-btn ${sortBy === 'availability' ? 'active' : ''}`}
          onClick={() => handleSortChange('availability')}
        >
          Availability {sortBy === 'availability' && (sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
      </div>

      {/* Student Library Section (if applicable) */}
      {user.role === 'student' && (
        <div className="student-library-section">
          <h2>
            <FaBookmark className="icon" /> My Books
            <span className={`book-limit-indicator ${issuedBooks.length >= 3 ? 'limit-warning' : ''}`}>
              <FaInfoCircle className="icon" /> {issuedBooks.length}/3 books borrowed
            </span>
          </h2>

          {issuedBooks.length > 0 ? (
            <div className="issued-books-list">
              {issuedBooks.map((issue) => renderIssuedBookCard(issue))}
            </div>
          ) : (
            <div className="no-books-message">
              <FaBook className="icon" />
              <h3>No books borrowed</h3>
              <p>Browse the library and borrow books to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Teacher's Library Actions */}
      {user.role !== 'student' && (
        <div className="teacher-library-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setScannerMode('issue');
              setShowScanner(true);
            }}
          >
            <FaQrcode className="icon" /> Scan Student QR
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setScannerMode('return');
              setShowScanner(true);
            }}
          >
            <FaQrcode className="icon" /> Scan Return QR
          </button>
        </div>
      )}

      {/* Books Grid with Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : (
        <div>
          <div className="books-grid">
            {sortedAndFilteredBooks.length > 0 ? (
              currentBooks.map((book) => renderBookCard(book))
            ) : (
              <div className="no-books-message">
                <FaBookOpen className="icon" />
                <h3>No books found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
          {renderPagination()}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{scannerMode === 'issue' ? 'Scan Student QR Code' : 'Scan Return QR Code'}</h2>
              <button className="close-btn" onClick={() => setShowScanner(false)}>×</button>
            </div>
            <div className="modal-body">
              <SimpleQRScanner onScan={handleScanResult} />
              {selectedBook && scannerMode === 'issue' && (
                <div className="selected-book-info">
                  <h3>Selected Book</h3>
                  <p>{selectedBook.title} by {selectedBook.author}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {showBookDetails && bookForDetails && (
        <BookDetails book={bookForDetails} onClose={handleCloseBookDetails} />
      )}

      {/* Return QR Code Modal */}
      {showReturnQR && issueForQR && (
        <ReturnQRCode issue={issueForQR} onClose={handleCloseReturnQR} />
      )}

      {/* Book Issue Confirmation Modal */}
      {selectedStudent && selectedBook && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Book Issue</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setSelectedStudent(null);
                  setSelectedBook(null);
                }}
              >×</button>
            </div>
            <div className="modal-body">
              <div className="issue-book-details">
                <div className="selected-book">
                  <h3>Selected Book</h3>
                  <div className="book-info">
                    <div className="book-cover">
                      {selectedBook.coverImage ? (
                        <img src={`http://localhost:5000${selectedBook.coverImage}`} alt={selectedBook.title} />
                      ) : (
                        <div className="book-cover-placeholder">
                          <FaBook className="book-icon" />
                        </div>
                      )}
                    </div>
                    <div className="book-details">
                      <h4>{selectedBook.title}</h4>
                      <p>By {selectedBook.author}</p>
                      {selectedBook.isbn && <p>ISBN: {selectedBook.isbn}</p>}
                      <p>Available: {selectedBook.availableQuantity}/{selectedBook.quantity}</p>
                    </div>
                  </div>
                </div>
                <div className="selected-student">
                  <h3>Selected Student</h3>
                  <div className="student-info">
                    <div className="student-avatar">
                      {selectedStudent.avatar ? (
                        <img src={`http://localhost:5000${selectedStudent.avatar}`} alt={selectedStudent.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {selectedStudent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="student-details">
                      <h4>{selectedStudent.name}</h4>
                      <p>ID: {selectedStudent.studentId}</p>
                      <p>Branch: {branches.find(b => b.code === selectedStudent.branch)?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="issue-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedBook(null);
                  }}
                  disabled={issuingInProgress}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => issueBook(selectedStudent._id, selectedBook._id)}
                  disabled={issuingInProgress}
                >
                  {issuingInProgress ? 'Processing...' : 'Confirm Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;



