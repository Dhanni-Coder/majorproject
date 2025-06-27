import { useState, useEffect, useContext } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaBook, FaUpload, FaArrowLeft, FaTimes, FaCheckCircle } from 'react-icons/fa';
import '../styles/AddBook.css';

const AddBook = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    quantity: 1,
    branch: ''
  });
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { title, author, isbn, description, quantity, branch } = formData;
  
  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      if (!token) return;
      
      try {
        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;
        
        const res = await axios.get('http://localhost:5000/api/branches');
        setBranches(res.data);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again.');
      }
    };
    
    fetchBranches();
  }, [token]);
  
  // Handle form input changes
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Handle cover image upload
  const handleCoverUpload = e => {
    const file = e.target.files[0];
    
    if (file) {
      setCoverImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!title || !author || !quantity) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      // Create form data for file upload
      const formDataObj = new FormData();
      formDataObj.append('title', title);
      formDataObj.append('author', author);
      formDataObj.append('isbn', isbn);
      formDataObj.append('description', description);
      formDataObj.append('quantity', quantity);
      
      if (branch) {
        formDataObj.append('branch', branch);
      }
      
      if (coverImage) {
        formDataObj.append('coverImage', coverImage);
      }
      
      // Add book
      const res = await axios.post('http://localhost:5000/api/books', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Book added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        quantity: 1,
        branch: ''
      });
      setCoverImage(null);
      setCoverPreview(null);
      
      // Redirect to library after 2 seconds
      setTimeout(() => {
        navigate('/library');
      }, 2000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err.response?.data?.msg || 'Failed to add book. Please try again.');
      setLoading(false);
    }
  };
  
  // If not authenticated or not admin/teacher, redirect to login
  if (!user || !token || (user.role !== 'admin' && user.role !== 'teacher')) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="add-book-page">
      <div className="page-header">
        <h1><FaBook className="icon" /> Add New Book</h1>
        <Link to="/library" className="btn btn-secondary">
          <FaArrowLeft className="icon" /> Back to Library
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          <FaTimes className="icon" /> {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <FaCheckCircle className="icon" /> {success}
        </div>
      )}
      
      <div className="add-book-container">
        <form className="add-book-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-left">
              <div className="form-group">
                <label htmlFor="title">Title <span className="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={handleChange}
                  required
                  placeholder="Enter book title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="author">Author <span className="required">*</span></label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={author}
                  onChange={handleChange}
                  required
                  placeholder="Enter author name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="isbn">ISBN</label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={isbn}
                  onChange={handleChange}
                  placeholder="Enter ISBN (optional)"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity">Quantity <span className="required">*</span></label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <select
                  id="branch"
                  name="branch"
                  value={branch}
                  onChange={handleChange}
                >
                  <option value="">Select Branch (Optional)</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-right">
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={handleChange}
                  placeholder="Enter book description (optional)"
                  rows="5"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="coverImage">Cover Image</label>
                <div className="cover-upload">
                  {coverPreview ? (
                    <div className="cover-preview">
                      <img src={coverPreview} alt="Book cover preview" />
                      <button
                        type="button"
                        className="remove-cover"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverPreview(null);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload className="upload-icon" />
                      <p>Click to upload cover image</p>
                      <input
                        type="file"
                        id="coverImage"
                        name="coverImage"
                        onChange={handleCoverUpload}
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding Book...' : 'Add Book'}
            </button>
            <Link to="/library" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
