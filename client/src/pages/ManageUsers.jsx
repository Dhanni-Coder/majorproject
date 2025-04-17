import { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import '../styles/ManageUsers.css';

const ManageUsers = () => {
  const { user: currentUser, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    branch: 'CSE',
    semester: 1
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showStudentSection, setShowStudentSection] = useState(true);
  const [showTeacherSection, setShowTeacherSection] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        console.log('Fetching users with token:', token);
        const res = await axios.get('http://localhost:5000/api/users');
        console.log('Users data received:', res.data);
        setUsers(res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

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

      let res;
      // Use the specific endpoints for adding students and teachers
      if (formData.role === 'student') {
        res = await axios.post('http://localhost:5000/api/users/add-student', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          branch: formData.branch,
          semester: formData.semester
        });
      } else if (formData.role === 'teacher') {
        res = await axios.post('http://localhost:5000/api/users/add-teacher', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          branch: formData.branch
        });
      }

      // Add the new user to the users list
      setUsers([...users, res.data.user]);

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        branch: 'CSE',
        semester: 1
      });

      setShowAddForm(false);
      setSuccessMessage(`${res.data.user.role.charAt(0).toUpperCase() + res.data.user.role.slice(1)} added successfully!`);
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.response?.data?.msg || 'Error adding user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        await axios.delete(`http://localhost:5000/api/users/${id}`);

        // Remove the deleted user from the users list
        setUsers(users.filter(user => user._id !== id));

        setSuccessMessage('User deleted successfully!');
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.msg || 'Error deleting user: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Redirect if user is not an admin
  if (!currentUser) {
    console.log('No current user, waiting for auth...');
    return null; // Wait for auth to complete
  }

  if (currentUser.role !== 'admin') {
    console.log('User is not admin, redirecting...', currentUser);
    return <Navigate to="/dashboard" />;
  }

  console.log('Rendering ManageUsers with:', {
    currentUser,
    users: users.length,
    loading,
    showStudentSection,
    showTeacherSection,
    branchFilter
  });

  return (
    <div className="manage-users-page">
      <div className="page-header">
        <h1>Manage Users</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      <div className="admin-notice">
        <p><strong>Important:</strong> This is where you can add students and teachers to the system.</p>
        <p>Click the "Add New User" button to create new student or teacher accounts with name, email, password, and branch.</p>
        <p>Each user will receive a unique QR code for authentication and attendance tracking.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {showAddForm && (
        <div className="add-user-form">
          <h2>{formData.role === 'student' ? 'Add New Student' : 'Add New Teacher'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (minimum 6 characters)"
                minLength="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role <span className="required">*</span></label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <small className="form-text">Select whether this user is a student or teacher.</small>
              </div>

              <div className="form-group">
                <label htmlFor="branch">Branch <span className="required">*</span></label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                >
                  <option value="CSE">Computer Science Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="MEA">Mechanical Engineering Auto</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="EE">Electronic Engineering</option>
                  <option value="PHARM">Pharmacy</option>
                </select>
                <small className="form-text">Select the branch for this user. This is required.</small>
              </div>

              {formData.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="semester">Semester <span className="required">*</span></label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                  <small className="form-text">Select the semester for this student.</small>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : `Add ${formData.role === 'student' ? 'Student' : 'Teacher'}`}
            </button>
          </form>
        </div>
      )}

      <div className="users-container">
        <div className="user-filters">
          <div className="section-toggles">
            <button
              className={`toggle-btn ${showStudentSection ? 'active' : ''}`}
              onClick={() => setShowStudentSection(!showStudentSection)}
            >
              {showStudentSection ? 'Hide Students' : 'Show Students'}
            </button>
            <button
              className={`toggle-btn ${showTeacherSection ? 'active' : ''}`}
              onClick={() => setShowTeacherSection(!showTeacherSection)}
            >
              {showTeacherSection ? 'Hide Teachers' : 'Show Teachers'}
            </button>
          </div>

          <div className="branch-filter">
            <label htmlFor="branchSelect">Filter by Branch:</label>
            <select
              id="branchSelect"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All Branches</option>
              <option value="CSE">Computer Science Engineering</option>
              <option value="IT">Information Technology</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="MEA">Mechanical Engineering Auto</option>
              <option value="CE">Civil Engineering</option>
              <option value="EE">Electronic Engineering</option>
              <option value="PHARM">Pharmacy</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div className="sections-container">
            {/* Students Section */}
            {showStudentSection && (
              <div className="user-section">
                <h3 className="section-title">Students</h3>
                <div className="branch-badges">
                  {['all', 'CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'].map(branch => (
                    <button
                      key={branch}
                      className={`branch-badge ${branchFilter === branch ? 'active' : ''}`}
                      onClick={() => setBranchFilter(branch)}
                    >
                      {branch === 'all' ? 'All Branches' : branch}
                    </button>
                  ))}
                </div>
                {users.filter(u =>
                  u.role === 'student' &&
                  (branchFilter === 'all' || u.branch === branchFilter)
                ).length > 0 ? (
                  <div className="users-grid">
                    <div className="users-header">
                      <div className="user-name">Name</div>
                      <div className="user-email">Email</div>
                      <div className="user-branch">Branch</div>
                      <div className="user-actions">Actions</div>
                    </div>

                    {users.filter(u =>
                      u.role === 'student' &&
                      (branchFilter === 'all' || u.branch === branchFilter)
                    ).map(user => (
                      <div key={user._id} className="user-row">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-branch">{user.branch || 'N/A'}</div>
                        <div className="user-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(user._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-users">
                    <p>No students found{branchFilter !== 'all' ? ` in ${branchFilter} branch` : ''}.</p>
                  </div>
                )}
              </div>
            )}

            {/* Teachers Section */}
            {showTeacherSection && (
              <div className="user-section">
                <h3 className="section-title">Teachers</h3>
                <div className="branch-badges">
                  {['all', 'CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'].map(branch => (
                    <button
                      key={branch}
                      className={`branch-badge ${branchFilter === branch ? 'active' : ''}`}
                      onClick={() => setBranchFilter(branch)}
                    >
                      {branch === 'all' ? 'All Branches' : branch}
                    </button>
                  ))}
                </div>
                {users.filter(u =>
                  u.role === 'teacher' &&
                  (branchFilter === 'all' || u.branch === branchFilter)
                ).length > 0 ? (
                  <div className="users-grid">
                    <div className="users-header">
                      <div className="user-name">Name</div>
                      <div className="user-email">Email</div>
                      <div className="user-branch">Branch</div>
                      <div className="user-actions">Actions</div>
                    </div>

                    {users.filter(u =>
                      u.role === 'teacher' &&
                      (branchFilter === 'all' || u.branch === branchFilter)
                    ).map(user => (
                      <div key={user._id} className="user-row">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-branch">{user.branch || 'N/A'}</div>
                        <div className="user-actions">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(user._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-users">
                    <p>No teachers found{branchFilter !== 'all' ? ` in ${branchFilter} branch` : ''}.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
