import React from 'react';
import { FaBook, FaCode, FaInfoCircle, FaSpinner, FaEdit, FaPlus, FaTimes, FaClock, FaGraduationCap } from 'react-icons/fa';

/**
 * SubjectForm Component
 * Form for creating or editing subjects
 */
const SubjectForm = ({ formData, isEditing, loading, onInputChange, onSubmit, onCancel }) => {
  // Generate semester options (1-8)
  const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1);
  
  // Generate credit options (1-6)
  const creditOptions = Array.from({ length: 6 }, (_, i) => i + 1);
  
  return (
    <div className="subject-form">
      <h2>
        {isEditing ? (
          <>
            <FaEdit className="icon" /> Edit Subject
          </>
        ) : (
          <>
            <FaPlus className="icon" /> Add New Subject
          </>
        )}
      </h2>
      
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              <FaBook className="icon" /> Subject Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="e.g. Data Structures"
              required
            />
            <small>Enter the full name of the subject</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="code">
              <FaCode className="icon" /> Subject Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={onInputChange}
              placeholder="e.g. CS201"
              required
            />
            <small>Enter the subject code</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="semester">
              <FaGraduationCap className="icon" /> Semester
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={onInputChange}
              required
            >
              {semesterOptions.map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
            <small>Select which semester this subject belongs to</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="credits">
              <FaClock className="icon" /> Credits
            </label>
            <select
              id="credits"
              name="credits"
              value={formData.credits}
              onChange={onInputChange}
              required
            >
              {creditOptions.map(credit => (
                <option key={credit} value={credit}>
                  {credit} {credit === 1 ? 'Credit' : 'Credits'}
                </option>
              ))}
            </select>
            <small>Select the number of credits for this subject</small>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">
            <FaInfoCircle className="icon" /> Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder="Brief description of this subject"
            rows="3"
          ></textarea>
          <small>Provide a short description of this subject (optional)</small>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="icon-spin" /> Processing...
              </>
            ) : isEditing ? (
              <>
                <FaEdit className="icon" /> Update Subject
              </>
            ) : (
              <>
                <FaPlus className="icon" /> Create Subject
              </>
            )}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            <FaTimes className="icon" /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
