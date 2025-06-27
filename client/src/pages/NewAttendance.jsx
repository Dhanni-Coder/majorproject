import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import '../styles/NewAttendance.css';

// Import components
import {
  AttendanceHeader,
  AttendanceStats,
  AttendanceTable,
  AttendanceActions,
  SimpleAttendanceSelector,
  AddSubjectModal
} from '../components/attendance';

const NewAttendance = () => {
  // Context and state
  const { token } = useContext(AuthContext);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [markedStudents, setMarkedStudents] = useState([]);

  // New subject form state
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    semester: 1,
    description: '',
    credits: 3
  });

  // Fetch subjects when semester changes
  useEffect(() => {
    if (token && selectedSemester) {
      fetchSubjects();
    }
  }, [token, selectedSemester]);

  // Fetch attendance data when subject, date, or semester changes
  useEffect(() => {
    if (selectedSemester && selectedDate && selectedSubject) {
      fetchAttendanceData();
    }
  }, [selectedSemester, selectedDate, selectedSubject]);

  // Fetch subjects for the selected semester
  const fetchSubjects = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // First check if the teacher has a branch assigned
      const userRes = await axios.get('/api/auth/me');
      console.log('User data:', userRes.data);

      if (!userRes.data.branch) {
        setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
        setLoading(false);
        return;
      }

      console.log(`Fetching subjects for branch code ${userRes.data.branch} and semester ${selectedSemester}`);

      // First, get the branch ID from the branch code
      const branchRes = await axios.get('/api/branches');
      console.log('All branches:', branchRes.data);

      // Find the branch with the matching code
      const userBranch = branchRes.data.find(branch => branch.code === userRes.data.branch);

      if (!userBranch) {
        setError(`Branch with code ${userRes.data.branch} not found. Please contact an administrator.`);
        setLoading(false);
        return;
      }

      console.log('Found branch:', userBranch);
      console.log(`Fetching subjects for branch ID ${userBranch._id} and semester ${selectedSemester}`);

      // Fetch subjects for the teacher's branch and selected semester
      const res = await axios.get(`/api/subjects/branch/${userBranch._id}/semester/${selectedSemester}`);

      console.log('Subjects fetched:', res.data);
      setSubjects(res.data);

      // If we have subjects and none is selected, select the first one
      if (res.data.length > 0 && !selectedSubject) {
        setSelectedSubject(res.data[0]._id);
      } else if (res.data.length === 0) {
        setSelectedSubject('');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects: ' + (err.response?.data?.msg || err.message));
      setSubjects([]);
      setSelectedSubject('');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data for the selected date, semester, and subject
  const fetchAttendanceData = async (forceRefresh = false) => {
    if (!token || !selectedSubject) return;

    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Use the exact date string to avoid timezone issues
      const exactDate = selectedDate;
      console.log(`Fetching attendance data for date: ${exactDate}, semester: ${selectedSemester}, subject: ${selectedSubject}`);

      // Add a timestamp parameter to prevent caching
      const cacheBuster = `&_t=${new Date().getTime()}`;

      const res = await axios.get(
        `/api/attendance/date/${exactDate}/semester/${selectedSemester}?subjectId=${selectedSubject}${cacheBuster}`
      );

      console.log('Attendance data received:', res.data);

      // Set the attendance data
      setAttendanceData(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching attendance data:', err);

      if (err.response?.status === 404) {
        setError('No students found for the selected semester and branch. Please check if students are assigned to this semester.');
      } else {
        setError('Failed to load attendance data: ' + (err.response?.data?.msg || err.message));
      }

      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    console.log('Date changed to:', newDate);

    // Validate the date (don't allow future dates)
    const selectedDateObj = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateObj > today) {
      // If future date selected, set to today
      const todayStr = today.toISOString().split('T')[0];
      setSelectedDate(todayStr);
      setError('Future dates are not allowed. Date set to today.');
    } else {
      // Valid date selected
      setSelectedDate(newDate);
      setError('');
    }

    // Clear attendance data when date changes
    setAttendanceData(null);
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSelectedSemester(parseInt(e.target.value));
    setAttendanceData(null); // Clear attendance data when semester changes
  };

  // Handle subject change
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setAttendanceData(null); // Clear attendance data when subject changes
  };

  // Mark attendance for a student
  const markAttendance = async (studentId, present) => {
    if (!token) return false;

    try {
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      console.log(`Marking attendance for student ${studentId} as ${present ? 'present' : 'absent'} on ${selectedDate}`);

      if (!selectedSubject) {
        setError('Please select a subject to mark attendance.');
        return false;
      }

      // Use the exact date string to avoid timezone issues
      const exactDate = selectedDate;

      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();

      const res = await axios.post(`/api/attendance?_t=${timestamp}`, {
        studentId,
        date: exactDate,
        present,
        subjectId: selectedSubject
      });

      console.log('Attendance response:', res.data);

      // Check if the attendance was already marked with the same status
      if (res.data.updated === false) {
        console.log('Attendance already marked with the same status');
        setSuccessMessage(`Student already marked as ${present ? 'present' : 'absent'}`);

        // If this was marked via QR scanner, still add to marked students list
        if (showQRScanner && present) {
          const student = attendanceData.attendanceData.find(item => item.student._id === studentId);
          if (student) {
            const newMarkedStudent = {
              id: studentId,
              name: student.student.name,
              email: student.student.email,
              timestamp: new Date().toLocaleTimeString()
            };
            setMarkedStudents(prev => {
              // Check if student is already in the list
              if (prev.some(s => s.id === studentId)) {
                return prev;
              }
              return [newMarkedStudent, ...prev];
            });
          }
        }

        return true;
      }

      console.log('Attendance marked successfully:', res.data);

      // If this was marked via QR scanner, add to marked students list
      if (showQRScanner && present) {
        const student = attendanceData.attendanceData.find(item => item.student._id === studentId);
        if (student) {
          const newMarkedStudent = {
            id: studentId,
            name: student.student.name,
            email: student.student.email,
            timestamp: new Date().toLocaleTimeString()
          };
          setMarkedStudents(prev => {
            // Check if student is already in the list
            if (prev.some(s => s.id === studentId)) {
              return prev;
            }
            return [newMarkedStudent, ...prev];
          });
        }
      }

      // Update the UI directly
      setAttendanceData(prevData => {
        if (!prevData) return prevData;

        // Find if the student already had an attendance record
        const studentRecord = prevData.attendanceData.find(item => item.student._id === studentId);
        const wasPresent = studentRecord?.attendance?.present || false;

        // Calculate the new counts
        let newPresentCount = prevData.presentCount;
        let newAbsentCount = prevData.absentCount;

        // Update counts based on the change
        if (!wasPresent && present) {
          newPresentCount++;
          newAbsentCount--;
        } else if (wasPresent && !present) {
          newPresentCount--;
          newAbsentCount++;
        }

        // Create a new copy of the attendance data with updated values
        return {
          ...prevData,
          presentCount: newPresentCount,
          absentCount: newAbsentCount,
          attendanceData: prevData.attendanceData.map(item => {
            if (item.student._id === studentId) {
              return {
                ...item,
                attendance: {
                  ...item.attendance,
                  present: present
                }
              };
            }
            return item;
          })
        };
      });

      // Show appropriate success message based on whether it was created or updated
      if (res.data.created) {
        setSuccessMessage(`Student marked as ${present ? 'present' : 'absent'}`);
      } else if (res.data.updated) {
        setSuccessMessage(`Student attendance updated to ${present ? 'present' : 'absent'}`);
      } else {
        setSuccessMessage(`Attendance for student marked ${present ? 'present' : 'absent'} successfully!`);
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      return true;
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance: ' + (err.response?.data?.msg || err.message));
      return false;
    }
  };

  // Save all attendance data to database
  const saveAttendanceToDatabase = async () => {
    if (!attendanceData || !attendanceData.attendanceData) {
      setError('No attendance data to save');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      const subjectName = subjects.find(s => s._id === selectedSubject)?.name || 'Unknown';
      console.log(`Saving attendance for ${attendanceData.attendanceData.length} students for subject ${subjectName} on ${selectedDate}`);

      // Use the exact date string to avoid timezone issues
      const exactDate = selectedDate;

      // Create an array of attendance records to save
      const attendanceRecords = attendanceData.attendanceData.map(item => ({
        studentId: item.student._id,
        date: exactDate,
        present: item.attendance?.present || false,
        subjectId: selectedSubject
      }));

      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();

      // Send the batch update request
      const res = await axios.post(`/api/attendance/batch?_t=${timestamp}`, {
        records: attendanceRecords
      });

      console.log('Batch save response:', res.data);

      // Show success message
      setSuccessMessage(`Attendance saved successfully for ${res.data.results.length} students!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to save attendance: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle new subject form change
  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'credits' ? parseInt(value) : value
    }));
  };

  // Handle new subject form submit
  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();

    if (!token) return;

    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Get the teacher's branch
      const userRes = await axios.get('/api/auth/me');

      if (!userRes.data.branch) {
        setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
        setLoading(false);
        return;
      }

      // Get the branch ID from the branch code
      const branchRes = await axios.get('/api/branches');
      const userBranch = branchRes.data.find(branch => branch.code === userRes.data.branch);

      if (!userBranch) {
        setError(`Branch with code ${userRes.data.branch} not found. Please contact an administrator.`);
        setLoading(false);
        return;
      }

      // Create the new subject
      const res = await axios.post('/api/subjects', {
        ...newSubject,
        branch: userBranch._id
      });

      console.log('Subject created:', res.data);

      // Show success message
      setSuccessMessage(`Subject "${res.data.name}" created successfully!`);

      // Close the modal and reset form
      setShowAddSubjectModal(false);
      setNewSubject({
        name: '',
        code: '',
        semester: selectedSemester,
        description: '',
        credits: 3
      });

      // Refresh subjects list
      fetchSubjects();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Failed to create subject: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      {/* Success Message */}
      {successMessage && (
        <div className="message-container success">
          <FaCheckCircle className="message-icon" />
          <div className="message-content">
            <div className="message-title">Success</div>
            <div className="message-text">{successMessage}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="message-container error">
          <FaExclamationTriangle className="message-icon" />
          <div className="message-content">
            <div className="message-title">Error</div>
            <div className="message-text">{error}</div>
          </div>
        </div>
      )}

      {/* Header with Filters */}
      <AttendanceHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedSemester={selectedSemester}
        onSemesterChange={handleSemesterChange}
        selectedSubject={selectedSubject}
        onSubjectChange={handleSubjectChange}
        subjects={subjects}
        onAddSubjectClick={() => setShowAddSubjectModal(true)}
      />

      {/* Action Buttons */}
      <AttendanceActions
        onScanQR={() => setShowQRScanner(true)}
        onSaveAttendance={saveAttendanceToDatabase}
        onRefreshData={() => fetchAttendanceData(true)}
        hasAttendanceData={!!attendanceData}
      />

      {/* Main Content */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading attendance data...</div>
        </div>
      ) : attendanceData ? (
        <>
          {/* Attendance Stats */}
          <AttendanceStats
            totalStudents={attendanceData.totalStudents}
            presentCount={attendanceData.presentCount}
            absentCount={attendanceData.absentCount}
          />

          {/* Attendance Table */}
          <AttendanceTable
            attendanceData={attendanceData.attendanceData}
            onMarkAttendance={markAttendance}
          />
        </>
      ) : (
        <div className="loading-container">
          <div className="message-text">
            {selectedSubject ? 'No attendance data available. Please check your filters.' : 'Please select a subject to view attendance data.'}
          </div>
        </div>
      )}

      {/* Student Selector Modal */}
      {showQRScanner && (
        <div className="modal-overlay">
          <SimpleAttendanceSelector
            onClose={() => setShowQRScanner(false)}
            onScanSuccess={markAttendance}
            attendanceData={attendanceData?.attendanceData || []}
            markedStudents={markedStudents}
          />
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <AddSubjectModal
          onClose={() => setShowAddSubjectModal(false)}
          newSubject={newSubject}
          onChange={handleNewSubjectChange}
          onSubmit={handleAddSubjectSubmit}
          selectedSemester={selectedSemester}
        />
      )}
    </div>
  );
};

export default NewAttendance;
