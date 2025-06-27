import React, { useState, useEffect } from 'react';
import { FaBook, FaSave, FaTimes } from 'react-icons/fa';

/**
 * EditBookModal Component
 * Modal for editing book details
 */
const EditBookModal = ({ book, branches, onClose, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    branch: '',
    quantity: 0,
    description: ''
  });
  
  // Error state
  const [errors, setErrors] = useState({});
  
  // Initialize form with book data
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        branch: book.branch || '',
        quantity: book.quantity || 0,
        description: book.description || ''
      });
    }
  }, [book]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }
    
    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...book,
        ...formData,
        quantity: Number(formData.quantity)
      });
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-book-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2><FaBook /> Edit Book</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {/* Modal Content */}
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <div className="form-grid">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>
              
              {/* Author */}
              <div className="form-group">
                <label htmlFor="author">Author</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={errors.author ? 'error' : ''}
                />
                {errors.author && <div className="error-message">{errors.author}</div>}
              </div>
              
              {/* ISBN */}
              <div className="form-group">
                <label htmlFor="isbn">ISBN</label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                />
              </div>
              
              {/* Branch */}
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={errors.branch ? 'error' : ''}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch && <div className="error-message">{errors.branch}</div>}
              </div>
              
              {/* Quantity */}
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className={errors.quantity ? 'error' : ''}
                />
                {errors.quantity && <div className="error-message">{errors.quantity}</div>}
              </div>
            </div>
            
            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="modal-footer">
            <div className="right-actions">
              <button type="submit" className="btn-primary">
                <FaSave /> Save Changes
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookModal;
