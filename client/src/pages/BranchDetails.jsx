import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaArrowLeft, FaPlus, FaTrash, FaBook, FaGraduationCap } from 'react-icons/fa';

const BranchDetails = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [branch, setBranch] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    credits: 3,
    description: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    const fetchBranchAndSubjects = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch branch details
        const branchRes = await axios.get(`http://localhost:5000/api/branches/${id}`);
        setBranch(branchRes.data);

        // Fetch subjects for this branch
        const subjectsRes = await axios.get(`http://localhost:5000/api/branches/${id}/subjects`);
        setSubjects(subjectsRes.data);

        setError('');
      } catch (err) {
        console.error('Error fetching branch details:', err);
        setError('Failed to load branch details: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchBranchAndSubjects();
  }, [id, token]);

  const handleChange = (e) => {
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
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      const res = await axios.post('http://localhost:5000/api/subjects', {
        ...formData,
        branch: id
      });

      // Add the new subject to the subjects list
      setSubjects([...subjects, res.data.subject]);

      // Reset form
      setFormData({
        name: '',
        code: '',
        semester: 1,
        credits: 3,
        description: ''
      });

      setShowForm(false);
      setSuccessMessage('Subject added successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding subject:', err);
      setError(err.response?.data?.msg || 'Error adding subject: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the subject "${subjectName}"? This will also delete all attendance records associated with this subject.`)) {
      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        const response = await axios.delete(`http://localhost:5000/api/subjects/${subjectId}`);
        console.log('Delete subject response:', response.data);

        // Remove the deleted subject from the subjects list
        setSubjects(subjects.filter(subject => subject._id !== subjectId));

        // Show success message with attendance records deleted info
        if (response.data.attendanceRecordsDeleted !== undefined) {
          setSuccessMessage(`Subject deleted successfully! Also deleted ${response.data.attendanceRecordsDeleted} attendance records.`);
        } else {
          setSuccessMessage('Subject deleted successfully!');
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting subject:', err);
        setError(err.response?.data?.msg || 'Error deleting subject: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to check if user can add/edit/delete subjects
  const canManageSubjects = () => {
    return user && (user.role === 'admin' || user.role === 'teacher');
  };

  // Function to check if user can delete a specific subject
  const canDeleteSubject = (subject) => {
    if (!user) return false;
    return user.role === 'admin' || (subject.createdBy && subject.createdBy._id === user.id);
  };

  // Filter subjects by semester
  const filteredSubjects = selectedSemester === 'all'
    ? subjects
    : subjects.filter(subject => subject.semester === parseInt(selectedSemester));

  // Group subjects by semester
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const semester = subject.semester;
    if (!acc[semester]) {
      acc[semester] = [];
    }
    acc[semester].push(subject);
    return acc;
  }, {});

  if (loading && !branch) {
    return <div className="loading">Loading branch details...</div>;
  }

  if (error && !branch) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/branches" className="btn btn-primary">
          <FaArrowLeft /> Back to Branches
        </Link>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="not-found">
        <h2>Branch Not Found</h2>
        <p>The branch you are looking for does not exist or has been removed.</p>
        <Link to="/branches" className="btn btn-primary">
          <FaArrowLeft /> Back to Branches
        </Link>
      </div>
    );
  }

  return (
    <div className="branch-details-page">
      <div className="page-header">
        <h1>
          <FaGraduationCap className="branch-icon" /> {branch.name} <span className="branch-code">({branch.code})</span>
        </h1>
        <Link to="/branches" className="btn btn-outline">
          <FaArrowLeft /> Back to Branches
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {branch.description && (
        <div className="branch-description-box">
          <h3>Description</h3>
          <p>{branch.description}</p>
        </div>
      )}

      <div className="subjects-header">
        <h2>Subjects</h2>
        {canManageSubjects() && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : <><FaPlus /> Add Subject</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="subject-form">
          <h3>Add New Subject</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Subject Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. CS201"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
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
                  value={formData.credits}
                  onChange={handleChange}
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
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter subject description"
                rows="3"
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Subject'}
            </button>
          </form>
        </div>
      )}

      <div className="semester-filter">
        <label htmlFor="semesterFilter">Filter by Semester:</label>
        <select
          id="semesterFilter"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="all">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="subjects-container">
        {loading ? (
          <div className="loading">Loading subjects...</div>
        ) : filteredSubjects.length > 0 ? (
          Object.keys(groupedSubjects)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(semester => (
              <div key={semester} className="semester-section">
                <h3 className="semester-heading">Semester {semester}</h3>
                <div className="subjects-grid">
                  {groupedSubjects[semester].map(subject => (
                    <div key={subject._id} className="subject-card">
                      <div className="subject-header">
                        <h4 className="subject-name">
                          <FaBook className="subject-icon" />
                          {subject.name}
                        </h4>
                        <span className="subject-code">{subject.code}</span>
                      </div>

                      <div className="subject-meta">
                        <span className="subject-credits">{subject.credits} Credits</span>
                        <span className="subject-added-by">Added by: {subject.createdBy?.name || 'Unknown'}</span>
                      </div>

                      {subject.description && (
                        <p className="subject-description">{subject.description}</p>
                      )}

                      {canDeleteSubject(subject) && (
                        <div className="subject-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteSubject(subject._id, subject.name)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="no-subjects">
            <FaBook className="no-subjects-icon" />
            <p>No subjects found for this branch.</p>
            {canManageSubjects() && (
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Add First Subject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchDetails;
