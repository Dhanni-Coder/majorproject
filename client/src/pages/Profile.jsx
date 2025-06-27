import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaUser, FaCamera, FaEnvelope, FaUserTag, FaBuilding, FaCalendarAlt,
  FaEdit, FaSave, FaTimes, FaIdCard
} from 'react-icons/fa';
import '../styles/Profile.css';

const Profile = () => {
  const { user, token, loadUser } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(user.branch || '');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editSection, setEditSection] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    branch: user.branch || '',
    semester: user.semester || 1
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

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
    setProfileData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      branch: user.branch || '',
      semester: user.semester || 1
    });
  }, [user]);

  // Effect for handling profile picture preview
  useEffect(() => {
    if (!profilePicture) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(profilePicture);
    setPreviewUrl(objectUrl);

    // Free memory when this component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePicture]);

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) return;

    setUploadingPicture(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      console.log('Uploading profile picture:', profilePicture.name, profilePicture.type, profilePicture.size);

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(profilePicture.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (profilePicture.size > maxSize) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

      // Create form data
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Upload profile picture - use the API_URL from constants
      const res = await axios.put('/api/users/update-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', res.data);
      setSuccess(true);
      setMessage(res.data.msg || 'Profile picture updated successfully');

      // Reload the user data to get the updated profile picture
      await loadUser();

      // Reset file input
      setProfilePicture(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      if (err.response?.data?.error) {
        console.error('Server error details:', err.response.data.error);
        if (err.response.data.stack) {
          console.error('Server error stack:', err.response.data.stack);
        }
      }
      setError('Failed to upload profile picture: ' + (err.response?.data?.msg || err.message));
    } finally {
      setUploadingPicture(false);
    }
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

      // Create update data object (email removed - only admins can change email)
      const updateData = {
        name: profileData.name,
        branch: profileData.branch,
        semester: profileData.semester
      };

      console.log('Sending profile update request with data:', updateData);

      // Update profile
      const res = await axios.put('/api/users/update-profile', updateData);

      console.log('Profile update response:', res.data);

      setSuccess(true);
      setMessage(res.data.msg || 'Profile updated successfully');
      setEditSection(null);

      // Reload the user data
      console.log('Reloading user data after profile update');
      await loadUser();
      console.log('User data reloaded successfully');
    } catch (err) {
      console.error('Error updating profile:', err);

      // Handle different types of error responses
      if (err.response?.data?.errors) {
        // Validation errors
        const errorMessages = err.response.data.errors.map(e => e.msg).join(', ');
        setError('Validation error: ' + errorMessages);
      } else if (err.response?.data?.msg) {
        // Server error with message
        setError(err.response.data.msg);
      } else {
        // Generic error
        setError('Failed to update profile: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBranchUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setSuccess(false);

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Update the user's branch
      const res = await axios.put('/api/users/update-branch', {
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
        {error && <div className="error-message">{error}</div>}
        {message && <div className={success ? "success-message" : "message"}>{message}</div>}

        <div className="profile-header-bg"></div>

        <div className="profile-header">
          <div className="profile-picture-container">
            <div className="profile-picture">
              {user.profilePicture ? (
                <img
                  src={previewUrl || `/api${user.profilePicture}`}
                  alt={user.name}
                  className="profile-image"
                  onError={(e) => {
                    console.error('Error loading profile image');
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.svg';
                  }}
                />
              ) : (
                <div className="profile-placeholder">
                  <FaUser className="placeholder-icon" />
                </div>
              )}
              <label htmlFor="profile-picture-input" className="profile-picture-edit">
                <FaCamera />
                <input
                  type="file"
                  id="profile-picture-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {profilePicture && (
              <div className="profile-picture-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleProfilePictureUpload}
                  disabled={uploadingPicture}
                >
                  {uploadingPicture ? 'Uploading...' : 'Save Picture'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setProfilePicture(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={uploadingPicture}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="profile-name">
            <h2>{user.name}</h2>
            <p className="profile-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <div
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser className="icon" /> Profile
          </div>
          {user.role === 'teacher' && (
            <div
              className={`profile-tab ${activeTab === 'branch' ? 'active' : ''}`}
              onClick={() => setActiveTab('branch')}
            >
              <FaBuilding className="icon" /> Branch
            </div>
          )}
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">
                  <FaIdCard className="profile-section-icon" /> Personal Information
                </h3>
                <button
                  className="edit-button"
                  onClick={() => setEditSection(editSection === 'personal' ? null : 'personal')}
                >
                  {editSection === 'personal' ? (
                    <><FaTimes className="icon" /> Cancel</>
                  ) : (
                    <><FaEdit className="icon" /> Edit</>
                  )}
                </button>
              </div>

              {editSection === 'personal' ? (
                <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                  <div className="form-group">
                    <label htmlFor="name"><FaUser className="icon" /> Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email"><FaEnvelope className="icon" /> Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                      readOnly={true}
                      className="readonly-field"
                      title="Email cannot be changed. Please contact an administrator if you need to update your email."
                    />
                    <small className="field-note">Email cannot be changed. Please contact an administrator if you need to update your email.</small>
                  </div>

                  {user.role === 'student' && (
                    <div className="form-group">
                      <label htmlFor="semester"><FaCalendarAlt className="icon" /> Semester</label>
                      <select
                        id="semester"
                        name="semester"
                        value={profileData.semester}
                        onChange={handleInputChange}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="branch"><FaBuilding className="icon" /> Branch</label>
                    <select
                      id="branch"
                      name="branch"
                      value={profileData.branch}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map(branch => (
                        <option key={branch.value} value={branch.value}>
                          {branch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      <FaSave className="icon" /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditSection(null);
                        setProfileData({
                          ...profileData,
                          name: user.name || '',
                          email: user.email || '',
                          branch: user.branch || '',
                          semester: user.semester || 1
                        });
                      }}
                    >
                      <FaTimes className="icon" /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <div className="info-group">
                    <label><FaUser className="icon" /> Name</label>
                    <p>{user.name}</p>
                  </div>

                  <div className="info-group">
                    <label><FaEnvelope className="icon" /> Email</label>
                    <p>{user.email}</p>
                  </div>

                  <div className="info-group">
                    <label><FaUserTag className="icon" /> Role</label>
                    <p>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </div>

                  {user.role === 'student' && user.semester && (
                    <div className="info-group">
                      <label><FaCalendarAlt className="icon" /> Semester</label>
                      <p>{user.semester}</p>
                    </div>
                  )}

                  <div className="info-group">
                    <label><FaBuilding className="icon" /> Branch</label>
                    <p>
                      {user.branch ? branches.find(b => b.value === user.branch)?.label || user.branch : 'Not assigned'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}



          {activeTab === 'branch' && user.role === 'teacher' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h3 className="profile-section-title">
                  <FaBuilding className="profile-section-icon" /> Branch Assignment
                </h3>
              </div>

              <div className="profile-form branch-form">
                <p className="form-help">As a teacher, you need to have a branch assigned to manage students and attendance.</p>

                <div className="form-group">
                  <label htmlFor="branch"><FaBuilding className="icon" /> Select Branch:</label>
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
                    onClick={handleBranchUpdate}
                    disabled={loading || selectedBranch === user.branch}
                  >
                    {loading ? 'Updating...' : <><FaBuilding className="icon" /> Update Branch</>}
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default Profile;
