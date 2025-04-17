import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaBook, FaGraduationCap } from 'react-icons/fa';

const Branches = () => {
  const { user, token } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Predefined branches
  const predefinedBranches = [
    { name: 'Computer Science Engineering', code: 'CSE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Mechanical Engineering Auto', code: 'MEA' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Electronic Engineering', code: 'EE' },
    { name: 'Pharmacy', code: 'PHARM' }
  ];

  useEffect(() => {
    const fetchBranches = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;
        
        const res = await axios.get('http://localhost:5000/api/branches');
        setBranches(res.data);
        
        setError('');
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectPredefined = (branch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      description: `${branch.name} department`
    });
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
      setSuccessMessage('');
      
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post('http://localhost:5000/api/branches', formData);
      
      // Add the new branch to the branches list
      setBranches([...branches, res.data.branch]);
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        description: ''
      });
      
      setShowForm(false);
      setSuccessMessage('Branch created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating branch:', err);
      setError(err.response?.data?.msg || 'Error creating branch: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the branch "${name}"? This will also delete all subjects in this branch.`)) {
      try {
        setLoading(true);
        setError('');
        
        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;
        
        await axios.delete(`http://localhost:5000/api/branches/${id}`);
        
        // Remove the deleted branch from the branches list
        setBranches(branches.filter(branch => branch._id !== id));
        
        setSuccessMessage('Branch deleted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting branch:', err);
        setError(err.response?.data?.msg || 'Error deleting branch: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to check if user can add/edit/delete branches
  const canManageBranches = () => {
    return user && (user.role === 'admin' || user.role === 'teacher');
  };

  // Function to check if user can delete a branch (admin only)
  const canDeleteBranch = () => {
    return user && user.role === 'admin';
  };

  return (
    <div className="branches-page">
      <div className="page-header">
        <h1>Academic Branches</h1>
        {canManageBranches() && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : <><FaPlus /> Add Branch</>}
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {showForm && (
        <div className="branch-form">
          <h2>Add New Branch</h2>
          
          <div className="predefined-branches">
            <h3>Quick Add:</h3>
            <div className="predefined-buttons">
              {predefinedBranches.map((branch, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleSelectPredefined(branch)}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Branch Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Computer Science Engineering"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="code">Branch Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. CSE"
                required
              />
              <small className="form-text">
                A short code for the branch (e.g. CSE, IT, ME)
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter branch description"
                rows="3"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </form>
        </div>
      )}
      
      <div className="branches-container">
        {loading && branches.length === 0 ? (
          <div className="loading">Loading branches...</div>
        ) : branches.length > 0 ? (
          <div className="branches-grid">
            {branches.map(branch => (
              <div key={branch._id} className="branch-card">
                <div className="branch-header">
                  <h3 className="branch-name">
                    <FaGraduationCap className="branch-icon" />
                    {branch.name}
                  </h3>
                  <span className="branch-code">{branch.code}</span>
                </div>
                
                {branch.description && (
                  <p className="branch-description">{branch.description}</p>
                )}
                
                <div className="branch-actions">
                  <Link to={`/branches/${branch._id}`} className="btn btn-primary">
                    <FaBook /> View Subjects
                  </Link>
                  
                  {canDeleteBranch() && (
                    <button 
                      className="btn btn-danger"
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
          <div className="no-branches">
            <FaGraduationCap className="no-branches-icon" />
            <p>No branches found.</p>
            {canManageBranches() && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add First Branch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Branches;
