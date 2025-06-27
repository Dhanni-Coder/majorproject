import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaUniversity,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaCode,
  FaInfoCircle
} from 'react-icons/fa';
import './BranchCard.css';

/**
 * BranchCard Component
 *
 * Displays information about an academic branch in a card format.
 * Supports both grid and list view modes.
 */
const BranchCard = ({ branch, canEdit, canDelete, onEdit, onDelete }) => {
  const { _id, name, code, description, studentCount = 0, teacherCount = 0 } = branch;

  return (
    <div className="branch-card">
      <div className="branch-card-header">
        <div className="branch-icon">
          <FaUniversity />
        </div>
        <div className="branch-title">
          <h3>{name}</h3>
          <div className="branch-code">
            <FaCode /> {code}
          </div>
        </div>
      </div>

      <div className="branch-description">
        <p>{description || `Department of ${name}`}</p>
      </div>

      <div className="branch-stats">
        <div className="branch-stat">
          <div className="stat-icon student-icon">
            <FaUserGraduate />
          </div>
          <div className="stat-details">
            <span className="stat-value">{studentCount}</span>
            <span className="stat-label">Students</span>
          </div>
        </div>

        <div className="branch-stat">
          <div className="stat-icon teacher-icon">
            <FaChalkboardTeacher />
          </div>
          <div className="stat-details">
            <span className="stat-value">{teacherCount}</span>
            <span className="stat-label">Teachers</span>
          </div>
        </div>
      </div>

      <div className="branch-actions">
        <Link to={`/branches/${_id}`} className="branch-action view-action" title="View Branch Details">
          <FaEye />
        </Link>

        {canEdit && (
          <button
            className="branch-action edit-action"
            onClick={onEdit}
            title="Edit Branch"
          >
            <FaEdit />
          </button>
        )}

        {canDelete && (
          <button
            className="branch-action delete-action"
            onClick={onDelete}
            title="Delete Branch"
          >
            <FaTrashAlt />
          </button>
        )}
      </div>

      {(!studentCount && !teacherCount) && (
        <div className="branch-badge empty-badge">
          <FaInfoCircle /> New
        </div>
      )}
    </div>
  );
};

export default BranchCard;
