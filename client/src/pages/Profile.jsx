import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Profile = () => {
  const { user, token, loadUser } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(user.branch || '');
  const [success, setSuccess] = useState(false);

  const branches = [
    { value: 'CSE', label: 'Computer Science Engineering' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'MEA', label: 'Mechanical Engineering Auto' },
    { value: 'CE', label: 'Civil Engineering' },
    { value: 'EE', label: 'Electronic Engineering' },
    { value: 'PHARM', label: 'Pharmacy' }
  ];

  useEffect(() => {
    setSelectedBranch(user.branch || '');
  }, [user]);

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Update the user's branch
      const res = await axios.put('http://localhost:5000/api/users/update-branch', {
        branch: selectedBranch
      });

      setSuccess(true);
      setMessage(res.data.msg || 'Branch updated successfully');

      // Reload the user data to get the updated branch
      await loadUser();
    } catch (err) {
      console.error('Error updating branch:', err);
      setError('Failed to update branch: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>User Profile</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className={success ? "success-message" : "message"}>{message}</div>}

        <div className="profile-info">
          <div className="info-group">
            <label>Name</label>
            <p>{user.name}</p>
          </div>

          <div className="info-group">
            <label>Email</label>
            <p>{user.email}</p>
          </div>

          <div className="info-group">
            <label>Role</label>
            <p>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>

          {user.role === 'student' && user.semester && (
            <div className="info-group">
              <label>Semester</label>
              <p>{user.semester}</p>
            </div>
          )}

          <div className="info-group">
            <label>Branch</label>
            <p>
              {user.branch ? branches.find(b => b.value === user.branch)?.label || user.branch : 'Not assigned'}
            </p>
          </div>
        </div>

        {user.role === 'teacher' && (
          <div className="profile-form">
            <h2>Update Branch</h2>
            <p className="form-help">As a teacher, you need to have a branch assigned to manage students and attendance.</p>

            <div className="form-group">
              <label htmlFor="branch">Select Branch:</label>
              <select
                id="branch"
                value={selectedBranch}
                onChange={handleBranchChange}
                className="form-control"
              >
                <option value="">-- Select Branch --</option>
                {branches.map(branch => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-actions">
              <button
                className="btn btn-primary"
                onClick={handleProfileUpdate}
                disabled={loading || selectedBranch === user.branch}
              >
                {loading ? 'Updating...' : 'Update Branch'}
              </button>
            </div>
          </div>
        )}

        {user.role !== 'teacher' && (
          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                setMessage('Profile update functionality will be implemented in the future.');
              }}
            >
              Update Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
