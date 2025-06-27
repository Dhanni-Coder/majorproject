import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaBook,
  FaGraduationCap,
  FaEdit,
  FaInfoCircle,
  FaSpinner,
  FaFilter,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import SubjectCard from '../components/branches/SubjectCard';
import SubjectForm from '../components/branches/SubjectForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { API_URL } from '../config/constants';
import '../styles/BranchDetailsModern.css';

/**
 * BranchDetailsModern Component
 * Displays detailed information about a branch and its subjects
 */
const BranchDetailsModern = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const toast = useToast();

  // State for branch and subjects data
  const [branch, setBranch] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Separate loading state for form submission
  const [showForm, setShowForm] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    credits: 3,
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState(null);

  // Permission checks
  const canCreate = user && ['admin', 'teacher'].includes(user.role);
  const canEdit = user && ['admin', 'teacher'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  /**
   * Fetch branch details and subjects
   */
  const fetchBranchData = useCallback(async () => {
    if (!token || !id) {
      setLoading(false);
      return;
    }

    // Clear any previous data and set loading state
    setLoading(true);

    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("Request timed out, aborting...");
    }, 8000); // 8 second timeout

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Fetch branch details and subjects in parallel
      const [branchRes, subjectsRes] = await Promise.all([
        axios.get(`${API_URL}/branches/${id}`, { signal: controller.signal }),
        axios.get(`${API_URL}/branches/${id}/subjects`, { signal: controller.signal })
      ]).catch(error => {
        // This catch will handle any errors in the Promise.all
        console.error("Error in Promise.all:", error);
        throw error; // Re-throw to be caught by the outer catch
      });

      // Only set state if the component is still mounted and the request wasn't aborted
      if (!controller.signal.aborted) {
        setBranch(branchRes.data);
        setSubjects(subjectsRes.data);
        console.log("Data fetched successfully");
      }
    } catch (err) {
      console.error('Error fetching branch details:', err);

      // Handle both AbortError and CanceledError (Axios specific)
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.error('Request timed out or was canceled. Please try again.');
        console.log("Request was canceled");
      } else {
        toast.error('Failed to load branch details: ' + (err.response?.data?.msg || err.message));
      }

      // Set branch to empty object and subjects to empty array to prevent infinite loading
      setBranch({});
      setSubjects([]);
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Always set loading to false, regardless of outcome
      setLoading(false);
      console.log("Loading state set to false");
    }
  }, [id, token, toast]);

  // Fetch data on component mount
  useEffect(() => {
    fetchBranchData();
  }, [fetchBranchData]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'credits' ? Number(value) : value
    }));
  };

  /**
   * Handle form submission (create or update subject)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Authentication required');
      return;
    }

    // Set submitting state to true
    setSubmitting(true);

    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("Form submission timed out, aborting...");
    }, 8000); // 8 second timeout

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      let response;

      if (isEditing) {
        // Update existing subject
        response = await axios.put(
          `${API_URL}/subjects/${currentSubjectId}`,
          { ...formData, branch: id },
          { signal: controller.signal }
        );
        toast.success(`Subject "${response.data.name}" updated successfully!`);
      } else {
        // Create new subject
        response = await axios.post(
          `${API_URL}/subjects`,
          { ...formData, branch: id },
          { signal: controller.signal }
        );
        toast.success(`Subject "${response.data.name}" created successfully!`);
      }

      // Only proceed if the request wasn't aborted
      if (!controller.signal.aborted) {
        // Refresh subjects list
        const subjectsRes = await axios.get(`${API_URL}/branches/${id}/subjects`);
        setSubjects(subjectsRes.data);

        // Reset form
        resetForm();
        console.log("Subject saved successfully");
      }
    } catch (err) {
      console.error('Error saving subject:', err);

      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.error('Request timed out or was canceled. Please try again.');
        console.log("Subject save request was canceled");
      } else if (err.response) {
        toast.error(err.response.data?.msg || `Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error saving subject. Please try again.');
      }
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Always set submitting to false, regardless of outcome
      setSubmitting(false);
      console.log("Submitting state set to false");
    }
  };

  /**
   * Handle editing a subject
   */
  const handleEdit = (subject) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      semester: subject.semester,
      credits: subject.credits,
      description: subject.description || ''
    });
    setIsEditing(true);
    setCurrentSubjectId(subject._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle deleting a subject
   */
  const handleDelete = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subjectName}"?`)) {
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      return;
    }

    // Set loading state to true
    setLoading(true);

    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("Delete request timed out, aborting...");
    }, 8000); // 8 second timeout

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Delete subject
      await axios.delete(`${API_URL}/subjects/${subjectId}`, { signal: controller.signal });

      // Only update state if the request wasn't aborted
      if (!controller.signal.aborted) {
        // Update subjects list
        setSubjects(prev => prev.filter(subject => subject._id !== subjectId));
        toast.success(`Subject "${subjectName}" deleted successfully!`);
        console.log("Subject deleted successfully");
      }
    } catch (err) {
      console.error('Error deleting subject:', err);

      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.error('Request timed out or was canceled. Please try again.');
        console.log("Delete request was canceled");
      } else if (err.response) {
        toast.error(err.response.data?.msg || `Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error deleting subject. Please try again.');
      }
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Always set loading to false, regardless of outcome
      setLoading(false);
      console.log("Loading state set to false after delete");
    }
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      semester: 1,
      credits: 3,
      description: ''
    });
    setShowForm(false);
    setIsEditing(false);
    setCurrentSubjectId(null);
  };

  /**
   * Toggle form visibility
   */
  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
    }
  };

  /**
   * Filter subjects by semester
   */
  const filteredSubjects = semesterFilter === 'all'
    ? subjects
    : subjects.filter(subject => subject.semester === Number(semesterFilter));

  /**
   * Group subjects by semester
   */
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const semester = subject.semester.toString();
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(subject);
    return acc;
  }, {});

  /**
   * Get unique semesters from subjects
   */
  const uniqueSemesters = [...new Set(subjects.map(subject => subject.semester))].sort((a, b) => a - b);

  // Track if we've been loading for too long
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to detect if loading takes too long
  useEffect(() => {
    let timeoutId;

    if (loading && !branch) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 seconds timeout
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, branch]);

  // Show loading spinner while fetching data
  if (loading && !branch) {
    return (
      <>
        <LoadingSpinner message="Loading branch details..." />
        {loadingTimeout && (
          <div className="loading-timeout-message">
            <p>Loading is taking longer than expected. You can:</p>
            <ul>
              <li>Wait a bit longer</li>
              <li>Refresh the page</li>
              <li>
                <Link to="/branches">Return to branches list</Link>
              </li>
            </ul>
          </div>
        )}
      </>
    );
  }

  // Show not found message if there was an error loading the branch
  if (!branch && !loading) {
    return (
      <div className="branch-details-error">
        <EmptyState
          icon="graduation"
          title="Failed to Load Branch"
          message="There was a problem loading the branch details. Please try again."
          action={
            <Link to="/branches" className="btn btn-primary">
              <FaArrowLeft /> Back to Branches
            </Link>
          }
        />
      </div>
    );
  }

  // Show not found message if branch doesn't exist
  if (!branch) {
    return (
      <div className="branch-not-found">
        <EmptyState
          icon="graduation"
          title="Branch Not Found"
          message="The branch you are looking for does not exist or has been removed."
          action={
            <Link to="/branches" className="btn btn-primary">
              <FaArrowLeft /> Back to Branches
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="branch-details-modern">
      {/* Header Section */}
      <div className="branch-details-header">
        <div className="header-content">
          <h1>
            <FaGraduationCap className="icon" />
            <span className="branch-name">{branch.name}</span>
            <span className="branch-code">{branch.code}</span>
          </h1>
          <Link to="/branches" className="btn btn-outline">
            <FaArrowLeft /> Back to Branches
          </Link>
        </div>
      </div>

      {/* Toast notifications are now handled by the ToastProvider */}

      {/* Branch Description */}
      {branch.description && (
        <div className="branch-description-box">
          <h3>
            <FaInfoCircle className="icon" /> About this Branch
          </h3>
          <p>{branch.description}</p>
        </div>
      )}

      {/* Subjects Section */}
      <div className="subjects-section">
        <div className="subjects-header">
          <h2>
            <FaBook className="icon" /> Subjects
          </h2>

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
                  <FaPlus /> Add Subject
                </>
              )}
            </button>
          )}
        </div>

        {/* Subject Form */}
        {showForm && (
          <SubjectForm
            formData={formData}
            isEditing={isEditing}
            loading={submitting}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        )}

        {/* Semester Filter */}
        {subjects.length > 0 && (
          <div className="semester-filter">
            <FaFilter className="icon" />
            <label htmlFor="semester-select">Filter by Semester:</label>
            <select
              id="semester-select"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="semester-select"
            >
              <option value="all">All Semesters</option>
              {uniqueSemesters.map(semester => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subjects Display */}
        {loading ? (
          <LoadingSpinner message="Loading subjects..." />
        ) : filteredSubjects.length > 0 ? (
          Object.keys(groupedSubjects)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(semester => (
              <div key={semester} className="semester-section">
                <h3 className="semester-heading">Semester {semester}</h3>
                <div className="subjects-grid">
                  {groupedSubjects[semester].map(subject => (
                    <SubjectCard
                      key={subject._id}
                      subject={subject}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={() => handleEdit(subject)}
                      onDelete={() => handleDelete(subject._id, subject.name)}
                    />
                  ))}
                </div>
              </div>
            ))
        ) : (
          <EmptyState
            icon="book"
            title="No subjects found"
            message={semesterFilter !== 'all'
              ? `No subjects found for Semester ${semesterFilter}. Try selecting a different semester.`
              : "This branch doesn't have any subjects yet."}
            action={
              canCreate && semesterFilter === 'all' && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <FaPlus /> Add First Subject
                </button>
              )
            }
          />
        )}
      </div>
    </div>
  );
};

export default BranchDetailsModern;
