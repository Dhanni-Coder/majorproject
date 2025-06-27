import { useState, useEffect, useContext, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaUserPlus, FaFilter, FaTrash, FaEdit, FaTimes,
  FaEye, FaEyeSlash, FaSearch, FaChevronDown
} from 'react-icons/fa';
import '../styles/ManageUsers.css';

const ManageUsers = () => {
  const { user: currentUser, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    branch: 'CSE',
    semester: 1
  });
  const [editUserId, setEditUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    branch: 'all',
    role: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      axios.defaults.headers.common['x-auth-token'] = token;
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesBranch = filters.branch === 'all' || user.branch === filters.branch;
      const matchesRole = filters.role === 'all' || user.role === filters.role;
      const matchesSearch = !filters.search ||
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase());

      return matchesBranch && matchesRole && matchesSearch;
    });
  }, [users, filters]);

  // Form handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Authentication required');
      return;
    }

    // Validate password
    if (!formData.password || formData.password.trim().length < 6) {
      setError('Password must be at least 6 characters long');
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
        res = await axios.post('/api/users/add-student', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          branch: formData.branch,
          semester: formData.semester
        });
        console.log('Student creation response:', res.data);
      } else if (formData.role === 'teacher') {
        res = await axios.post('/api/users/add-teacher', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          branch: formData.branch
        });
        console.log('Teacher creation response:', res.data);
      } else if (formData.role === 'admin') {
        // For admin users, use the general user creation endpoint
        res = await axios.post('/api/users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'admin',
          branch: formData.branch
        });
        console.log('Admin creation response:', res.data);
      }

      if (!res || !res.data || !res.data.user) {
        throw new Error('Invalid response from server');
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

  const handleEdit = (user) => {
    // Set the form data with the user's current information
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password for security reasons
      role: user.role,
      branch: user.branch || 'CSE',
      semester: user.semester || 1
    });

    // Set the user ID being edited
    setEditUserId(user._id);

    // Show the edit form
    setShowEditForm(true);

    // Hide the add form if it's open
    setShowAddForm(false);
  };

  const handleUpdate = async (e) => {
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

      // Create update data object (exclude password if empty)
      const updateData = {
        name: formData.name,
        email: formData.email,
        branch: formData.branch
      };

      // Only include password if it's provided (not empty)
      if (formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      // Include semester only for students
      if (formData.role === 'student') {
        updateData.semester = formData.semester;
      }

      // Send update request
      const res = await axios.put(`/api/users/${editUserId}`, updateData);

      // Update the user in the users list
      setUsers(users.map(user =>
        user._id === editUserId ? { ...user, ...updateData } : user
      ));

      // Reset form and close edit form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        branch: 'CSE',
        semester: 1
      });

      setShowEditForm(false);
      setEditUserId(null);
      setSuccessMessage('User updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.msg || 'Error updating user: ' + err.message);
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

        await axios.delete(`/api/users/${id}`);

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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      branch: 'CSE',
      semester: 1
    });
    setShowAddForm(false);
    setShowEditForm(false);
    setEditUserId(null);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="manage-users-container">
      {/* Header Section */}
      <div className="page-header">
        <h1>Manage Users</h1>
        <button
          className="btn btn-primary add-user-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowEditForm(false);
          }}
        >
          <FaUserPlus /> {showAddForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Alert Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Add/Edit User Form */}
      {(showAddForm || showEditForm) && (
        <div className="user-form-container">
          <div className="user-form-header">
            <h2>{showEditForm ? 'Edit User' : 'Add New User'}</h2>
            <button className="close-btn" onClick={resetForm}>
              <FaTimes />
            </button>
          </div>
          <form onSubmit={showEditForm ? handleUpdate : handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password {showEditForm && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!showEditForm}
                  minLength="6"
                  className="form-control"
                  placeholder={showEditForm ? "Enter new password (optional)" : "Enter password (min 6 characters)"}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control"
                  disabled={showEditForm} // Can't change role when editing
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="CSE">Computer Science Engineering (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ME">Mechanical Engineering (ME)</option>
                  <option value="MEA">Mechanical Automobile Engineering (MEA)</option>
                  <option value="CE">Civil Engineering (CE)</option>
                  <option value="EE">Electrical Engineering (EE)</option>
                  <option value="PHARM">Pharmacy (PHARM)</option>
                </select>
              </div>
              {(formData.role === 'student' || (showEditForm && formData.role === 'student')) && (
                <div className="form-group">
                  <label>Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="form-control"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {showEditForm ? 'Update User' : 'Add User'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header" onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> Filters
          <FaChevronDown className={`dropdown-icon ${showFilters ? 'open' : ''}`} />
        </div>

        {showFilters && (
          <div className="filters-body">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                name="search"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={handleFilterChange}
                className="search-input"
              />
            </div>

            <div className="filter-options">
              <div className="filter-group">
                <label>Role:</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Branch:</label>
                <select
                  name="branch"
                  value={filters.branch}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="all">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  {/* Add more branches as needed */}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="users-table-container">
          <div className="users-count">
            Showing {filteredUsers.length} of {users.length} users
          </div>

          <div className="responsive-table">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-users">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>{user.branch || 'N/A'}</td>
                      <td>{user.role === 'student' ? user.semester : 'N/A'}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(user._id)}
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
