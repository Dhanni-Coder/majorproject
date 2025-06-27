import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FaUniversity, FaPlus, FaCode, FaInfoCircle, FaCheckCircle, 
  FaGraduationCap, FaTrash, FaSearch, FaEdit, FaEye, 
  FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';
import '../styles/Branches.css';

const Branches = () => {
  const { user, token } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);

  // Permission checks
  const canCreate = user && ['admin', 'teacher'].includes(user.role);
  const canEdit = user && ['admin', 'teacher'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  useEffect(() => {
    fetchBranches();
  }, [token]);

  const fetchBranches = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      
      axios.defaults.headers.common['x-auth-token'] = token;
      const res = await axios.get('http://localhost:5000/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      axios.defaults.headers.common['x-auth-token'] = token;
      
      let res;
      if (isEditing) {
        res = await axios.put(`http://localhost:5000/api/branches/${currentBranchId}`, formData);
        setBranches(branches.map(branch => 
          branch._id === currentBranchId ? res.data.branch : branch
        ));
        setSuccessMessage('Branch updated successfully!');
      } else {
        res = await axios.post('http://localhost:5000/api/branches', formData);
        setBranches([...branches, res.data.branch]);
        setSuccessMessage('Branch created successfully!');
      }
      
      // Reset form
      setFormData({ name: '', code: '', description: '' });
      setShowForm(false);
      setIsEditing(false);
      setCurrentBranchId(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving branch:', err);
      setError(err.response?.data?.msg || 'Error saving branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      description: branch.description || ''
    });
    setIsEditing(true);
    setCurrentBranchId(branch._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!canDelete) return;
    
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        
        axios.defaults.headers.common['x-auth-token'] = token;
        await axios.delete(`http://localhost:5000/api/branches/${id}`);
        
        setBranches(branches.filter(branch => branch._id !== id));
        setSuccessMessage('Branch deleted successfully!');
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError('Failed to delete branch. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    branch.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="branches-page">
      {/* Header Section */}
      <div className="branches-header">
        <div className="header-content">
          <h1><FaUniversity /> Academic Branches</h1>
          <p>Manage your institution's academic departments and specializations</p>
        </div>
      </div>

      {/* Notification Messages */}
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className="action-bar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {canCreate && (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ name: '', code: '', description: '' });
              setIsEditing(false);
              setCurrentBranchId(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancel' : <><FaPlus /> Add Branch</>}
          </button>
        )}
      </div>

      {/* Branch Form */}
      {showForm && (
        <div className="branch-form">
          <h2>{isEditing ? 'Edit Branch' : 'Add New Branch'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name"><FaGraduationCap /> Branch Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science Engineering"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="code"><FaCode /> Branch Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., CSE"
                required
              />
              <small>A short unique identifier for this branch</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="description"><FaInfoCircle /> Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this academic branch"
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="icon-spin" /> Processing...</> : 
                  isEditing ? <><FaEdit /> Update Branch</> : <><FaPlus /> Create Branch</>}
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branches Grid */}
      <div className="branches-container">
        {loading && branches.length === 0 ? (
          <div className="loading-container">
            <FaSpinner className="icon-spin" />
            <p>Loading branches...</p>
          </div>
        ) : filteredBranches.length > 0 ? (
          <div className="branches-grid">
            {filteredBranches.map(branch => (
              <div key={branch._id} className="branch-card">
                <div className="branch-card-header">
                  <h3>{branch.name}</h3>
                  <span className="branch-code">{branch.code}</span>
                </div>
                
                <div className="branch-card-body">
                  <p>{branch.description || `Department of ${branch.name}`}</p>
                </div>
                
                <div className="branch-card-footer">
                  <Link to={`/branches/${branch._id}`} className="btn btn-outline">
                    <FaEye /> View Details
                  </Link>
                  
                  {canEdit && (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => handleEdit(branch)}
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                  
                  {canDelete && (
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => handleDelete(branch._id, branch.name)}
                    >
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaGraduationCap className="empty-icon" />
            <h3>No branches found</h3>
            <p>{searchTerm ? 'Try adjusting your search term' : 'Get started by adding your first academic branch'}</p>
            {canCreate && !searchTerm && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <FaPlus /> Add First Branch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Branches;
