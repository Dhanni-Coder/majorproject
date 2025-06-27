import React from 'react';
import {
  FaUniversity,
  FaCode,
  FaInfoCircle,
  FaSpinner,
  FaEdit,
  FaPlus,
  FaTimes
} from 'react-icons/fa';

/**
 * BranchForm Component
 * Form for creating or editing academic branches with modern design
 */
const BranchForm = ({ formData, isEditing, loading, onInputChange, onSubmit, onCancel }) => {
  return (
    <form onSubmit={onSubmit} className="branch-form-inline">
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
                  onChange={onInputChange}
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
                  onChange={onInputChange}
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
                onChange={onInputChange}
                placeholder="Brief description of this academic branch"
                rows="3"
              ></textarea>
            </div>
            <small>Provide a short description of this branch (optional)</small>
          </div>



          <div className="form-actions">
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              aria-busy={loading}
            >
              <span className="btn-icon">
                {loading ? (
                  <FaSpinner className="icon-spin" />
                ) : isEditing ? (
                  <FaEdit />
                ) : (
                  <FaPlus />
                )}
              </span>
              <span className="btn-text">
                {loading ? 'Processing...' : isEditing ? 'Update Branch' : 'Create Branch'}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              <FaTimes className="icon" /> Cancel
            </button>
          </div>
    </form>
  );
};

export default BranchForm;
