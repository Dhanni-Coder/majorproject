import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import {
  FaUniversity,
  FaPlus,
  FaSearch,
  FaTimes,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaChevronDown,
  FaChevronUp,
  FaListUl,
  FaTh
} from 'react-icons/fa';
import BranchCard from '../components/branches/BranchCard';
import BranchForm from '../components/branches/BranchForm';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { API_URL } from '../config/constants';
import '../styles/BranchesModern.css';

/**
 * BranchesModern Component
 * Modern, responsive page for managing academic branches
 */
const BranchesModern = () => {
  // Auth context
  const { user, token } = useAuth();

  // Toast notifications
  const toast = useToast();

  // State for branches data
  const [branches, setBranches] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true); // For general loading
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'code'

  // Filter state
  const [filters, setFilters] = useState({
    hasStudents: false,
    hasTeachers: false
  });

  // Refs
  const filterRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);

  // Animation state
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);

    // Close filter dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Permission checks
  const canCreate = user && ['admin', 'teacher'].includes(user.role);
  const canEdit = user && ['admin', 'teacher'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  /**
   * Fetch all branches from the API
   */
  const fetchBranches = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Set auth token for API requests
      axios.defaults.headers.common['x-auth-token'] = token;

      // Fetch branches
      const res = await axios.get(`${API_URL}/branches`);
      setBranches(res.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
      toast.error('Failed to load branches. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle form submission (create or update branch)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Authentication required');
      return;
    }

    // Validate form data
    if (!formData.name.trim()) {
      toast.error('Branch name is required');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Branch code is required');
      return;
    }

    // Prevent multiple submissions
    if (submitting) {
      return;
    }

    try {
      // Set submitting state before making the request
      setSubmitting(true);

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Log the request for debugging
      console.log('Sending request to:', `${API_URL}/branches`);
      console.log('Request data:', formData);
      console.log('Headers:', { 'x-auth-token': token });

      let response;

      if (isEditing) {
        // Update existing branch
        response = await axios.put(
          `${API_URL}/branches/${currentBranchId}`,
          formData
        );
        toast.success(`Branch "${response.data.name}" updated successfully!`);
      } else {
        // Create new branch with timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          response = await axios.post(`${API_URL}/branches`, formData, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          toast.success(`Branch "${response.data.name}" created successfully!`);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error; // Re-throw to be caught by the outer catch
        }
      }

      // Refresh branches list
      await fetchBranches();

      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving branch:', err);

      // Handle different error types
      if (err.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else if (err.response) {
        // Server responded with an error
        const errorMessage = err.response.data?.msg || `Error: ${err.response.status} - ${err.response.statusText}`;
        toast.error(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        toast.error('Error saving branch. Please try again.');
      }
    } finally {
      // Ensure submitting state is set to false regardless of success or failure
      setSubmitting(false);
    }
  };

  /**
   * Handle editing a branch
   */
  const handleEdit = (branch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      description: branch.description || ''
    });
    setIsEditing(true);
    setCurrentBranchId(branch._id);
    setShowForm(true);

    // Scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('branch-form-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  /**
   * Handle deleting a branch
   */
  const handleDelete = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete the branch "${branchName}"?`)) {
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      // Use a local loading state for delete operation
      const deleteIndex = branches.findIndex(b => b._id === branchId);
      if (deleteIndex === -1) {
        toast.error('Branch not found');
        return;
      }

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Delete branch
      await axios.delete(`${API_URL}/branches/${branchId}`);

      // Update branches list
      setBranches(prev => prev.filter(branch => branch._id !== branchId));

      toast.success(`Branch "${branchName}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting branch:', err);

      // Handle different error types
      if (err.response) {
        // Server responded with an error
        const errorMessage = err.response.data?.msg || `Error: ${err.response.status} - ${err.response.statusText}`;
        toast.error(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        toast.error('Error deleting branch. Please try again.');
      }
    }
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setShowForm(false);
    setIsEditing(false);
    setCurrentBranchId(null);
  };

  /**
   * Toggle form visibility
   */
  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
      // Scroll to form if it's not in view
      setTimeout(() => {
        const formElement = document.getElementById('branch-form-section');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked }));
  };

  /**
   * Handle sort changes
   */
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  /**
   * Filter and sort branches based on search term, filters, and sort options
   */
  const getFilteredAndSortedBranches = () => {
    // First filter by search term
    let result = branches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply additional filters (for demo purposes, we'll use random numbers)
    if (filters.hasStudents) {
      result = result.filter(() => Math.random() > 0.3); // Random filter for demo
    }

    if (filters.hasTeachers) {
      result = result.filter(() => Math.random() > 0.3); // Random filter for demo
    }

    // Sort the results
    return result.sort((a, b) => {
      const valueA = a[sortBy].toLowerCase();
      const valueB = b[sortBy].toLowerCase();

      if (sortOrder === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  const filteredBranches = getFilteredAndSortedBranches();

  return (
    <div className={`branches-modern ${animateIn ? 'animate-in' : ''}`}>
      {/* Header Section */}
      <div className="branches-header">
        <div className="header-content">
          <div className="header-title-container">
            <div className="header-icon">
              <FaUniversity />
            </div>
            <div>
              <h1>Academic Branches</h1>
              <p>Manage your institution's academic departments and specializations</p>
            </div>
          </div>

          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-number">{branches.length}</span>
              <span className="stat-label">Total Branches</span>
            </div>
          </div>
        </div>

        <div className="header-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="action-bar">
        <div className="search-and-filters">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search branches by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container" ref={filterRef}>
            <button
              className={`filter-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            >
              <FaFilter />
              <span>Filter</span>
              {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showFilters && (
              <div className="filter-dropdown">
                <div className="filter-header">
                  <h3>Filter Branches</h3>
                  <button
                    className="clear-filters"
                    onClick={() => setFilters({ hasStudents: false, hasTeachers: false })}
                  >
                    Clear All
                  </button>
                </div>

                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      name="hasStudents"
                      checked={filters.hasStudents}
                      onChange={handleFilterChange}
                    />
                    <span>Has Students</span>
                  </label>

                  <label className="filter-option">
                    <input
                      type="checkbox"
                      name="hasTeachers"
                      checked={filters.hasTeachers}
                      onChange={handleFilterChange}
                    />
                    <span>Has Teachers</span>
                  </label>
                </div>

                <div className="filter-divider"></div>

                <div className="sort-options">
                  <h3>Sort By</h3>

                  <button
                    className={`sort-option ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => handleSortChange('name')}
                  >
                    <span>Name</span>
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                    )}
                  </button>

                  <button
                    className={`sort-option ${sortBy === 'code' ? 'active' : ''}`}
                    onClick={() => handleSortChange('code')}
                  >
                    <span>Code</span>
                    {sortBy === 'code' && (
                      sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {canCreate && (
          <button
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleForm}
          >
            {showForm ? (
              <>
                <FaTimes /> Cancel
              </>
            ) : (
              <>
                <FaPlus /> Add Branch
              </>
            )}
          </button>
        )}
      </div>

      {/* Branch Form Section */}
      {showForm && (
        <div id="branch-form-section" className="branch-form-container">
          <div className="branch-form">
            <div className="form-header">
              <div className="form-title">
                {isEditing ? (
                  <>
                    <FaEdit className="icon" />
                    <h2>Edit Branch</h2>
                  </>
                ) : (
                  <>
                    <FaPlus className="icon" />
                    <h2>Add New Branch</h2>
                  </>
                )}
              </div>
            </div>
            <div className="form-content">
              <BranchForm
                formData={formData}
                isEditing={isEditing}
                loading={submitting}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Branches Grid/List */}
      <div className="branches-container">
        {loading && branches.length === 0 ? (
          <LoadingSpinner message="Loading branches..." />
        ) : filteredBranches.length > 0 ? (
          <>
            <div className="branches-summary">
              <p className="results-count">
                Showing <span className="highlight">{filteredBranches.length}</span> {filteredBranches.length === 1 ? 'branch' : 'branches'}
                {(searchTerm || filters.hasStudents || filters.hasTeachers) && ' matching your filters'}
              </p>

              {(searchTerm || filters.hasStudents || filters.hasTeachers) && (
                <button
                  className="clear-all-button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ hasStudents: false, hasTeachers: false });
                  }}
                >
                  <FaTimes /> Clear All Filters
                </button>
              )}
            </div>

            <div className={`branches-${viewMode}`}>
              {filteredBranches.map((branch, index) => (
                <div
                  key={branch._id}
                  className="branch-card-wrapper"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <BranchCard
                    branch={branch}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => handleEdit(branch)}
                    onDelete={() => handleDelete(branch._id, branch.name)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state-wrapper">
            <EmptyState
              icon="graduation"
              title="No branches found"
              message={
                searchTerm || filters.hasStudents || filters.hasTeachers
                  ? 'Try adjusting your filters or search term'
                  : 'Get started by adding your first academic branch'
              }
              action={
                canCreate && !searchTerm && !filters.hasStudents && !filters.hasTeachers && (
                  <button className="btn btn-primary" onClick={toggleForm}>
                    <FaPlus /> Add First Branch
                  </button>
                )
              }
            />
          </div>
        )}
      </div>

      {/* We already have a floating action button above, so this one is redundant */}
    </div>
  );
};

export default BranchesModern;
