import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaUser,
  FaEnvelope,
  FaQrcode,
  FaSearch,
  FaDownload,
  FaEdit,
  FaTrash,
  FaPlus,
  FaGraduationCap,
  FaUserPlus,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaBookReader,
  FaIdCard,
  FaSchool,
  FaUserGraduate,
  FaUserEdit,
  FaInfoCircle,
  FaChalkboardTeacher,
  FaBook,
  FaSpinner
} from 'react-icons/fa';
import '../styles/ViewStudents.css';

const ViewStudents = () => {
  const { token, user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    semester: 1,
    branch: user?.role === 'admin' ? 'CSE' : ''
  });
  const [branches, setBranches] = useState([
    { code: 'CSE', name: 'Computer Science Engineering' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'MEA', name: 'Mechanical Automobile Engineering' },
    { code: 'CE', name: 'Civil Engineering' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'PHARM', name: 'Pharmacy' }
  ]);
  const [assignFormData, setAssignFormData] = useState({
    semester: 1
  });

  useEffect(() => {
    const fetchStudents = async () => {
      if (!token || !user) return;

      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        let endpoint;
        if (user.role === 'teacher') {
          endpoint = 'http://localhost:5000/api/users/branch-students';
          console.log('Using branch-students endpoint for teacher');
        } else if (user.role === 'admin') {
          endpoint = 'http://localhost:5000/api/users/role/student';
          console.log('Using role/student endpoint for admin');
        } else {
          setError('Unauthorized: Only teachers and admins can view students');
          setLoading(false);
          return;
        }

        console.log('Fetching students from endpoint:', endpoint);
        const res = await axios.get(endpoint);
        console.log('Fetched students:', res.data.length);
        setStudents(res.data);
        setFilteredStudents(res.data);

        setError('');
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [token, user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewQR = (student) => {
    setSelectedStudent(student);
    setShowQRModal(true);
  };

  const closeModal = () => {
    setShowQRModal(false);
    setSelectedStudent(null);
  };

  const downloadQRCode = () => {
    if (!selectedStudent || !selectedStudent.qrCode) return;

    const link = document.createElement('a');
    link.href = selectedStudent.qrCode;
    link.download = `${selectedStudent.name.replace(/\s+/g, '_')}_QR_Code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open add student modal
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      semester: 1,
      branch: user?.role === 'admin' ? 'CSE' : ''
    });
    setShowAddModal(true);
  };

  // Open assign students modal
  const openAssignModal = async () => {
    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Fetch unassigned students
      const res = await axios.get('http://localhost:5000/api/users/unassigned-students');

      setUnassignedStudents(res.data);
      setSelectedStudentIds([]);
      setAssignFormData({ semester: 1 });
      setShowAssignModal(true);
    } catch (err) {
      console.error('Error fetching unassigned students:', err);
      setError('Failed to fetch unassigned students: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox change for student selection
  const handleStudentSelection = (studentId) => {
    setSelectedStudentIds(prevSelected => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter(id => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };

  // Handle assign form input changes
  const handleAssignFormChange = (e) => {
    setAssignFormData({ ...assignFormData, [e.target.name]: e.target.value });
  };

  // Open edit student modal
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '',
      semester: student.semester || 1,
      branch: student.branch || (user.role === 'admin' ? 'CSE' : '')
    });
    setShowEditModal(true);
  };

  // Add new student
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!token) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      let endpoint;
      if (user.role === 'teacher') {
        endpoint = 'http://localhost:5000/api/users/add-branch-student';
      } else if (user.role === 'admin') {
        endpoint = 'http://localhost:5000/api/users/add-student';
      }

      const res = await axios.post(endpoint, formData);

      // Add the new student to the list
      setStudents([...students, res.data.user]);
      setFilteredStudents([...filteredStudents, res.data.user]);

      setSuccessMessage('Student added successfully!');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Update student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    if (!token || !selectedStudent) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      let endpoint;
      let updateData;

      if (user.role === 'teacher') {
        endpoint = `http://localhost:5000/api/users/update-student/${selectedStudent._id}`;
        updateData = {
          name: formData.name,
          email: formData.email,
          semester: formData.semester
        };
      } else if (user.role === 'admin') {
        endpoint = `http://localhost:5000/api/users/${selectedStudent._id}`;
        updateData = {
          name: formData.name,
          email: formData.email,
          semester: formData.semester,
          branch: formData.branch
        };
      }

      const res = await axios.put(endpoint, updateData);

      // Get the updated student data from the response
      const updatedStudent = res.data.student || res.data.user || res.data;

      // Update the student in the list
      const updatedStudents = students.map(student =>
        student._id === selectedStudent._id ? updatedStudent : student
      );

      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);

      setSuccessMessage('Student updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDelete = async (studentId) => {
    if (!token) return;

    if (window.confirm('Are you sure you want to delete this student? This will also delete all attendance records associated with this student.')) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        let endpoint;
        if (user.role === 'teacher') {
          endpoint = `http://localhost:5000/api/users/delete-student/${studentId}`;
        } else if (user.role === 'admin') {
          endpoint = `http://localhost:5000/api/users/${studentId}`;
        }

        const response = await axios.delete(endpoint);
        console.log('Delete student response:', response.data);

        // Remove the student from the list
        const updatedStudents = students.filter(student => student._id !== studentId);
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);

        // Show success message with attendance records deleted info
        if (response.data.attendanceRecordsDeleted !== undefined) {
          setSuccessMessage(`Student deleted successfully! Also deleted ${response.data.attendanceRecordsDeleted} attendance records.`);
        } else {
          setSuccessMessage('Student deleted successfully!');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
        setError('Failed to delete student: ' + (err.response?.data?.msg || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // Assign students to teacher's branch
  const handleAssignStudents = async (e) => {
    e.preventDefault();

    if (!token || selectedStudentIds.length === 0) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      const res = await axios.put('http://localhost:5000/api/users/assign-students', {
        studentIds: selectedStudentIds,
        semester: assignFormData.semester
      });

      // Refresh the student list
      const branchStudentsRes = await axios.get('http://localhost:5000/api/users/branch-students');
      setStudents(branchStudentsRes.data);
      setFilteredStudents(branchStudentsRes.data);

      setSuccessMessage(res.data.msg);
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error assigning students:', err);
      setError('Failed to assign students: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Group students by semester
  const groupStudentsBySemester = (students) => {
    const grouped = {};

    students.forEach(student => {
      const semester = student.semester || 1;
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(student);
    });

    return grouped;
  };

  return (
    <div className="view-students-page">
      <div className="page-header">
        <h1>
          <FaGraduationCap className="icon" />
          {user.role === 'teacher' ? `${user.branch || 'Unassigned'} Students` : 'All Students'}
        </h1>

        {user.role === 'teacher' && (
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={openAssignModal}>
              <FaUserPlus className="icon" /> Assign Existing Students
            </button>
            <button className="btn btn-secondary" onClick={openAddModal}>
              <FaPlus className="icon" /> Add New Student
            </button>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={openAddModal}>
              <FaPlus className="icon" /> Add New Student
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <FaExclamationCircle /> {error}
        </div>
      )}
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="students-container">
        {loading ? (
          <div className="loading">Loading students...</div>
        ) : filteredStudents.length > 0 ? (
          <div className="semester-sections">
            {Object.entries(groupStudentsBySemester(filteredStudents))
              .sort(([semA], [semB]) => Number(semA) - Number(semB))
              .map(([semester, semesterStudents]) => (
                <div key={semester} className="semester-section">
                  <h2 className="semester-heading">
                    <FaUserGraduate /> Semester {semester}
                  </h2>
                  <div className="students-grid">
                    <div className="students-header">
                      <div className="header-name">Name</div>
                      <div className="header-email">Email</div>
                      <div className="header-semester">Semester</div>
                      <div className="header-actions">Actions</div>
                    </div>

                    {semesterStudents.map(student => (
                      <div key={student._id} className="student-row">
                        <div className="student-name">
                          <FaUserGraduate />
                          {student.name}
                        </div>
                        <div className="student-email">
                          <FaEnvelope />
                          {student.email}
                        </div>
                        <div className="student-semester">
                          <FaGraduationCap /> {student.semester || 1}
                        </div>
                        <div className="student-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleViewQR(student)}
                            title="View QR Code"
                          >
                            <FaQrcode />
                          </button>

                          {/* Common actions for both teacher and admin */}
                          <Link
                            to={`/student-attendance/${student._id}`}
                            className="btn-icon"
                            title="View Attendance"
                          >
                            <FaCalendarAlt />
                          </Link>

                          {/* Teacher-specific actions */}
                          {user.role === 'teacher' && (
                            <>
                              <button
                                className="btn-icon"
                                onClick={() => handleEdit(student)}
                                title="Edit Student"
                              >
                                <FaUserEdit />
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(student._id)}
                                title="Delete Student"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}

                          {/* Admin-specific actions */}
                          {user.role === 'admin' && (
                            <>
                              <button
                                className="btn-icon"
                                onClick={() => handleEdit(student)}
                                title="Edit Student"
                              >
                                <FaUserEdit />
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDelete(student._id)}
                                title="Delete Student"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="no-students">
            <FaUserGraduate className="no-students-icon" />
            <p>No students found in the system.</p>
            {user.role === 'teacher' && (
              <button className="btn btn-primary" onClick={openAddModal}>
                <FaUserPlus /> Add Your First Student
              </button>
            )}
            {user.role === 'admin' && (
              <button className="btn btn-primary" onClick={openAddModal}>
                <FaUserPlus /> Add New Student
              </button>
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedStudent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2><FaQrcode /> Student QR Code</h2>
            <div>
              <div className="student-info">
                <p><strong>Name:</strong> <FaUserGraduate /> {selectedStudent.name}</p>
                <p><strong>Email:</strong> <FaEnvelope /> {selectedStudent.email}</p>
                <p><strong>Branch:</strong> <FaSchool /> {selectedStudent.branch}</p>
                <p><strong>Semester:</strong> <FaGraduationCap /> {selectedStudent.semester || 1}</p>
              </div>

              <div className="qr-code-container">
                {selectedStudent.qrCode ? (
                  <>
                    <img
                      src={selectedStudent.qrCode}
                      alt={`QR Code for ${selectedStudent.name}`}
                      className="qr-code-image"
                    />
                    <button
                      className="btn btn-primary"
                      onClick={downloadQRCode}
                    >
                      <FaDownload /> Download QR Code
                    </button>
                  </>
                ) : (
                  <p className="no-qr-code">No QR code available for this student.</p>
                )}
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>

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
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {user.role === 'admin' && (
                <div className="form-group">
                  <label htmlFor="branch">Branch</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  >
                    {branches.map(branch => (
                      <option key={branch.code} value={branch.code}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2><FaUserEdit /> Edit Student</h2>
            <form onSubmit={handleUpdateStudent}>
              <div className="form-group">
                <label htmlFor="edit-name"><FaUser /> Student Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email"><FaEnvelope /> Email Address</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter student's email address"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-semester"><FaGraduationCap /> Current Semester</label>
                <select
                  id="edit-semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {user.role === 'admin' && (
                <div className="form-group">
                  <label htmlFor="edit-branch"><FaSchool /> Branch</label>
                  <select
                    id="edit-branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  >
                    {branches.map(branch => (
                      <option key={branch.code} value={branch.code}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <FaSpinner className="icon-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Update Student
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content assign-modal" onClick={e => e.stopPropagation()}>
            <h2>Assign Students to {user.branch}</h2>

            {unassignedStudents.length > 0 ? (
              <form onSubmit={handleAssignStudents}>
                <div className="form-group">
                  <label htmlFor="assign-semester">Semester</label>
                  <select
                    id="assign-semester"
                    name="semester"
                    value={assignFormData.semester}
                    onChange={handleAssignFormChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                  <small className="form-text">All selected students will be assigned to this semester</small>
                </div>

                <div className="student-selection">
                  <div className="selection-header">
                    <h3>Available Students</h3>
                    <p>Select students to add to your branch:</p>
                  </div>

                  <div className="student-list">
                    {unassignedStudents.map(student => (
                      <div key={student._id} className="student-item">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                          />
                          <span className="checkmark"></span>
                          <div className="student-info">
                            <div className="student-name">{student.name}</div>
                            <div className="student-email">{student.email}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || selectedStudentIds.length === 0}
                  >
                    {loading ? 'Assigning...' : 'Assign Selected Students'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="no-students-message">
                <p>No unassigned students found in the system.</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStudents;
