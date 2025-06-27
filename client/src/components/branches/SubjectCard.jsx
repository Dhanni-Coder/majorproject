import React from 'react';
import { FaBook, FaEdit, FaTrash, FaClock } from 'react-icons/fa';

/**
 * SubjectCard Component
 * Displays a single subject in a card format
 */
const SubjectCard = ({ subject, canEdit, canDelete, onEdit, onDelete }) => {
  return (
    <div className="subject-card">
      <div className="subject-card-header">
        <div className="subject-icon-container">
          <FaBook className="subject-icon" />
        </div>
        <div className="subject-code">{subject.code}</div>
      </div>
      
      <div className="subject-card-body">
        <h3 className="subject-name">{subject.name}</h3>
        
        <div className="subject-meta">
          <div className="subject-credits">
            <span className="meta-label">Credits:</span>
            <span className="meta-value">{subject.credits}</span>
          </div>
          
          <div className="subject-semester">
            <span className="meta-label">Semester:</span>
            <span className="meta-value">{subject.semester}</span>
          </div>
        </div>
        
        {subject.description && (
          <p className="subject-description">{subject.description}</p>
        )}
      </div>
      
      <div className="subject-card-footer">
        {canEdit && (
          <button 
            className="btn btn-outline-secondary"
            onClick={onEdit}
          >
            <FaEdit /> Edit
          </button>
        )}
        
        {canDelete && (
          <button 
            className="btn btn-outline-danger"
            onClick={onDelete}
          >
            <FaTrash /> Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default SubjectCard;
