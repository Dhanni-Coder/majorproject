import React from 'react';
import { FaTimes, FaBook } from 'react-icons/fa';

const AddSubjectModal = ({
  onClose,
  newSubject,
  onChange,
  onSubmit,
  selectedSemester
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>
            <FaBook /> Add New Subject
          </h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={onSubmit} className="add-subject-form">
            <div className="form-group">
              <label htmlFor="name">Subject Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newSubject.name}
                onChange={onChange}
                className="form-control"
                placeholder="e.g. Data Structures"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Subject Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={newSubject.code}
                onChange={onChange}
                className="form-control"
                placeholder="e.g. CS201"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <select
                  id="semester"
                  name="semester"
                  value={newSubject.semester}
                  onChange={onChange}
                  className="form-control"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="credits">Credits</label>
                <input
                  type="number"
                  id="credits"
                  name="credits"
                  value={newSubject.credits}
                  onChange={onChange}
                  className="form-control"
                  min="1"
                  max="6"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={newSubject.description}
                onChange={onChange}
                className="form-control"
                rows="3"
                placeholder="Brief description of the subject"
              ></textarea>
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-button">
                Add Subject
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// PropTypes removed

export default AddSubjectModal;
