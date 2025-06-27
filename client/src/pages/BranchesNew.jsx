import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
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
  FaTh,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaGraduationCap,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCode,
  FaCheck
} from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import BranchCard from '../components/branches/BranchCard';
import Modal from '../components/common/Modal';
import '../styles/BranchesNew.css';

/**
 * BranchesNew Component
 *
 * A modern, responsive page for managing academic branches with advanced filtering,
 * sorting, and view options.
 */
const BranchesNew = () => {
  // ===== State Management =====
  const { user, token } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [animateIn, setAnimateIn] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Filter and sort state
  const [filters, setFilters] = useState({
    hasStudents: false,
    hasTeachers: false
  });
  const [sortOption, setSortOption] = useState('nameAsc');

  // ===== Permission Checks =====
  const canCreate = useMemo(() =>
    user && ['admin', 'teacher'].includes(user.role), [user]
  );

  const canEdit = useMemo(() =>
    user && ['admin', 'teacher'].includes(user.role), [user]
  );

  const canDelete = useMemo(() =>
    user && user.role === 'admin', [user]
  );

  // ===== API Calls =====
  const fetchBranches = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const response = await axios.get('/api/branches', config);
      setBranches(response.data);

      // Animate in after data is loaded
      setTimeout(() => setAnimateIn(true), 100);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(
        err.response?.data?.msg ||
        'Failed to load branches. Please try again later.'
      );
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createBranch = async (branchData) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setSubmitting(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const response = await axios.post('/api/branches', branchData, config);

      // Add new branch to state
      setBranches(prevBranches => [...prevBranches, response.data]);

      toast.success('Branch created successfully');
      resetForm();
    } catch (err) {
      console.error('Error creating branch:', err);
      toast.error(
        err.response?.data?.msg ||
        'Failed to create branch. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateBranch = async (id, branchData) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setSubmitting(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const response = await axios.put(`/api/branches/${id}`, branchData, config);

      // Update branch in state
      setBranches(prevBranches =>
        prevBranches.map(branch =>
          branch._id === id ? response.data : branch
        )
      );

      toast.success('Branch updated successfully');
      resetForm();
    } catch (err) {
      console.error('Error updating branch:', err);
      toast.error(
        err.response?.data?.msg ||
        'Failed to update branch. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBranch = async (id) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setSubmitting(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      await axios.delete(`/api/branches/${id}`, config);

      // Remove branch from state
      setBranches(prevBranches =>
        prevBranches.filter(branch => branch._id !== id)
      );

      toast.success('Branch deleted successfully');
      setShowDeleteModal(false);
      setBranchToDelete(null);
    } catch (err) {
      console.error('Error deleting branch:', err);
      toast.error(
        err.response?.data?.msg ||
        'Failed to delete branch. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Event Handlers =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing && currentBranchId) {
      await updateBranch(currentBranchId, formData);
    } else {
      await createBranch(formData);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      name: branch.name,
      code: branch.code,
      description: branch.description || ''
    });
    setCurrentBranchId(branch._id);
    setIsEditing(true);
    setShowForm(true);

    // Scroll to form
    document.getElementById('branch-form-section')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleDelete = (id, name) => {
    setBranchToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      deleteBranch(branchToDelete.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setIsEditing(false);
    setCurrentBranchId(null);
    setShowForm(false);
  };

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const clearFilters = () => {
    setFilters({
      hasStudents: false,
      hasTeachers: false
    });
    setSearchTerm('');
    setSortOption('nameAsc');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // ===== Filtering and Sorting Logic =====
  const filteredBranches = useMemo(() => {
    let result = [...branches];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(branch =>
        branch.name.toLowerCase().includes(term) ||
        branch.code.toLowerCase().includes(term) ||
        (branch.description && branch.description.toLowerCase().includes(term))
      );
    }

    // Apply other filters
    if (filters.hasStudents) {
      result = result.filter(branch =>
        branch.studentCount > 0
      );
    }

    if (filters.hasTeachers) {
      result = result.filter(branch =>
        branch.teacherCount > 0
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'nameAsc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'codeAsc':
        result.sort((a, b) => a.code.localeCompare(b.code));
        break;
      case 'codeDesc':
        result.sort((a, b) => b.code.localeCompare(a.code));
        break;
      default:
        break;
    }

    return result;
  }, [branches, searchTerm, filters, sortOption]);

  // ===== Effects =====
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ===== Render =====
  return (
    <div className={`branches-container ${animateIn ? 'animate-in' : ''}`}>
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

      {/* Action Bar */}
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
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="filter-container">
            <button
              className={`filter-button ${(filters.hasStudents || filters.hasTeachers) ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              <span>Filter</span>
              {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showFilters && (
              <div className="filter-dropdown">
                <div className="filter-header">
                  <h3>Filter Branches</h3>
                  <button className="clear-filters" onClick={clearFilters}>
                    Clear All
                  </button>
                </div>

                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.hasStudents}
                      onChange={() => toggleFilter('hasStudents')}
                    />
                    <span>Has Students</span>
                  </label>

                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.hasTeachers}
                      onChange={() => toggleFilter('hasTeachers')}
                    />
                    <span>Has Teachers</span>
                  </label>
                </div>

                <div className="filter-divider"></div>

                <div className="sort-options">
                  <h3>Sort By</h3>
                  <button
                    className={`sort-option ${sortOption === 'nameAsc' ? 'active' : ''}`}
                    onClick={() => setSortOption('nameAsc')}
                  >
                    <span>Name (A-Z)</span>
                    {sortOption === 'nameAsc' && <FaSortAmountDown />}
                  </button>

                  <button
                    className={`sort-option ${sortOption === 'nameDesc' ? 'active' : ''}`}
                    onClick={() => setSortOption('nameDesc')}
                  >
                    <span>Name (Z-A)</span>
                    {sortOption === 'nameDesc' && <FaSortAmountUp />}
                  </button>

                  <button
                    className={`sort-option ${sortOption === 'codeAsc' ? 'active' : ''}`}
                    onClick={() => setSortOption('codeAsc')}
                  >
                    <span>Code (A-Z)</span>
                    {sortOption === 'codeAsc' && <FaSortAmountDown />}
                  </button>

                  <button
                    className={`sort-option ${sortOption === 'codeDesc' ? 'active' : ''}`}
                    onClick={() => setSortOption('codeDesc')}
                  >
                    <span>Code (Z-A)</span>
                    {sortOption === 'codeDesc' && <FaSortAmountUp />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="view-toggle-button"
            onClick={toggleViewMode}
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <FaListUl /> : <FaTh />}
          </button>

          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
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

            <form onSubmit={handleSubmit} className="branch-form-content">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    <FaUniversity className="icon" /> Branch Name
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </div>
                  <small>Enter the full name of the academic branch or department</small>
                </div>

                <div className="form-group">
                  <label htmlFor="code">
                    <FaCode className="icon" /> Branch Code
                  </label>
                  <div className="input-container">
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="e.g. CS"
                      required
                    />
                  </div>
                  <small>Enter a short code or abbreviation for this branch</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <FaInfoCircle className="icon" /> Description
                </label>
                <div className="input-container">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this academic branch"
                    rows="3"
                  ></textarea>
                </div>
                <small>Provide a short description of this branch (optional)</small>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : isEditing ? (
                    <>
                      <FaEdit /> Update Branch
                    </>
                  ) : (
                    <>
                      <FaPlus /> Create Branch
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Summary */}
      <div className="branches-summary">
        <p className="results-count">
          Showing <span className="highlight">{filteredBranches.length}</span> of{' '}
          <span className="highlight">{branches.length}</span> branches
          {(searchTerm || filters.hasStudents || filters.hasTeachers) && ' (filtered)'}
        </p>

        {(searchTerm || filters.hasStudents || filters.hasTeachers) && (
          <button className="clear-all-button" onClick={clearFilters}>
            <FaTimes /> Clear all filters
          </button>
        )}
      </div>

      {/* Branches Content */}
      <div className="branches-content">
        {loading && branches.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading branches...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <FaExclamationTriangle className="icon" />
            <h3>Error Loading Branches</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchBranches}>
              Try Again
            </button>
          </div>
        ) : filteredBranches.length > 0 ? (
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
        ) : (
          <div className="empty-state">
            <FaGraduationCap className="icon" />
            <h3>No branches found</h3>
            <p>
              {searchTerm || filters.hasStudents || filters.hasTeachers
                ? 'Try adjusting your filters or search term'
                : 'Get started by adding your first academic branch'}
            </p>
            {canCreate && !searchTerm && !filters.hasStudents && !filters.hasTeachers && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <FaPlus /> Add First Branch
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setBranchToDelete(null);
          }}
          title="Confirm Delete"
        >
          <div className="delete-confirmation">
            <div className="delete-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Delete Branch</h3>
            <p>
              Are you sure you want to delete the branch <strong>{branchToDelete?.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : (
                  <>
                    <FaTrashAlt /> Delete Branch
                  </>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setBranchToDelete(null);
                }}
                disabled={submitting}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BranchesNew;