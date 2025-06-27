import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { FaCalendarAlt, FaQrcode, FaCheck, FaTimes, FaUserGraduate, FaCamera, FaBook, FaPlus, FaSave, FaDatabase } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import '../styles/Attendance.css';

const Attendance = () => {
  const { user, token } = useContext(AuthContext);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    semester: 1,
    description: '',
    credits: 3
  });
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [markedStudents, setMarkedStudents] = useState([]);
  const [lastScannedQR, setLastScannedQR] = useState(null);
  const scannerRef = useRef(null);
  const qrContainerRef = useRef(null);

  useEffect(() => {
    if (token && selectedSemester) {
      fetchSubjects();
    }
  }, [token, selectedSemester]);

  useEffect(() => {
    if (selectedSemester && selectedDate && selectedSubject) {
      fetchAttendanceData();
    }
  }, [selectedSemester, selectedDate, selectedSubject]);

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

  const fetchAttendanceData = async (forceRefresh = false, retryCount = 0) => {
    if (!token) return;

    // Log if this is a forced refresh
    if (forceRefresh) {
      console.log('FORCE REFRESH: Fetching fresh attendance data');
    }

    // Log if this is a retry
    if (retryCount > 0) {
      console.log(`RETRY ATTEMPT ${retryCount}: Re-fetching attendance data`);
    }

    // IMPORTANT: Use the exact date string from the state
    // Do NOT create a new Date object as it can cause timezone issues
    const exactDate = selectedDate; // Use the raw date string
    console.log(`Using exact date for fetch: ${exactDate}`);

    // Log the date components for debugging
    const dateComponents = selectedDate.split('-');
    console.log(`Date components: Year=${dateComponents[0]}, Month=${dateComponents[1]}, Day=${dateComponents[2]}`);

    // Store the current date we're fetching for validation later
    const requestedDate = exactDate;

    try {
      setLoading(true);
      setError('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      console.log(`Fetching attendance data for date: ${selectedDate}, semester: ${selectedSemester}`);

      // First check if the teacher has a branch assigned
      const userRes = await axios.get('/api/auth/me');
      console.log('User data:', userRes.data);

      if (!userRes.data.branch) {
        setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
        setLoading(false);
        return;
      }

      console.log(`Teacher branch code: ${userRes.data.branch}, fetching students for semester ${selectedSemester}`);

      if (!selectedSubject) {
        setError('Please select a subject to view attendance.');
        setLoading(false);
        return;
      }

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

      try {
        console.log(`Fetching fresh attendance data for date: ${exactDate}, semester: ${selectedSemester}, subject: ${selectedSubject}`);

        // Add a timestamp parameter to prevent caching when force refreshing
        const cacheBuster = `&_t=${new Date().getTime()}`; // Always use cache buster

        const res = await axios.get(
          `/api/attendance/date/${exactDate}/semester/${selectedSemester}?subjectId=${selectedSubject}${cacheBuster}`
        );

        console.log('Attendance data received:', res.data);
        console.log('Students found:', res.data.attendanceData?.length || 0);
        console.log('Date from server:', res.data.date);

        // IMPORTANT: Get the raw date string from the server response
        // This is critical to ensure we're comparing the same format
        const rawResponseDate = res.data.date;
        console.log(`Raw date from server: ${rawResponseDate}`);

        // Convert server date to YYYY-MM-DD format for comparison
        // We need to handle potential timezone issues
        const responseDate = new Date(rawResponseDate);

        // Format the response date to match the input format (YYYY-MM-DD)
        const responseDateFormatted = responseDate.getFullYear() + '-' +
                                     String(responseDate.getMonth() + 1).padStart(2, '0') + '-' +
                                     String(responseDate.getDate()).padStart(2, '0');

        console.log(`Formatted response date: ${responseDateFormatted}`);
        console.log(`Comparing with requested date: ${exactDate}`);

        // Extract just the date part for comparison (ignore time)
        const requestedDateParts = exactDate.split('-');
        const responseDateParts = responseDateFormatted.split('-');

        // Check if the dates match (year, month, day)
        const datesMatch = requestedDateParts[0] === responseDateParts[0] &&
                          requestedDateParts[1] === responseDateParts[1] &&
                          requestedDateParts[2] === responseDateParts[2];

        if (!datesMatch) {
          console.warn(`DATE MISMATCH ERROR! Requested: ${exactDate}, Received: ${responseDateFormatted}`);
          console.warn(`Date parts - Requested: [${requestedDateParts.join(', ')}], Received: [${responseDateParts.join(', ')}]`);

          // If this is not already a retry and the dates don't match, try again
          if (retryCount < 2) {
            console.log(`Retrying fetch for date ${exactDate} due to date mismatch`);
            setLoading(false);
            // Wait a moment before retrying
            setTimeout(() => {
              fetchAttendanceData(true, retryCount + 1);
            }, 500);
            return;
          } else {
            // If we've already retried, show an error
            setError(`Error: Received data for ${responseDateFormatted} instead of ${exactDate}. Please try selecting the date again.`);
          }
        } else {
          console.log(`Date validation successful: Requested and received date match`);
        }

        // Set the attendance data with the fresh data from the server
        setAttendanceData(res.data);
        setError('');
      } catch (fetchErr) {
        console.error('Error fetching attendance data:', fetchErr);
        if (fetchErr.response?.status === 404) {
          setError(`No students found in semester ${selectedSemester} for your branch (${userRes.data.branch}). Please check if students are assigned to this semester.`);
        } else {
          setError('Failed to load attendance data: ' + (fetchErr.response?.data?.msg || fetchErr.message));
        }
      }
    } catch (err) {
      console.error('Error checking teacher branch:', err);
      if (err.response?.data?.msg === 'Teacher does not have an assigned branch') {
        setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
      } else {
        setError('Failed to load user data: ' + (err.response?.data?.msg || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (e) => {
    // Clear attendance data when semester changes
    setAttendanceData(null);
    setSelectedSemester(parseInt(e.target.value));
    // This will trigger a fetch of subjects for the new semester
  };

  const handleDateChange = (e) => {
    // Get the raw date string from the date picker
    const newDate = e.target.value;
    console.log('Date changed to:', newDate);

    // IMPORTANT: Use the exact date string from the date picker
    // Do NOT create a new Date object as it can cause timezone issues
    const exactDate = newDate; // Use the raw date string
    console.log(`Using exact date from picker: ${exactDate}`);

    // Log the date components for debugging
    const dateComponents = newDate.split('-');
    console.log(`Date components: Year=${dateComponents[0]}, Month=${dateComponents[1]}, Day=${dateComponents[2]}`);

    // Validate the date (don't allow future dates)
    // Create date objects at noon to avoid timezone issues
    const year = parseInt(dateComponents[0]);
    const month = parseInt(dateComponents[1]) - 1; // JS months are 0-indexed
    const day = parseInt(dateComponents[2]);

    // Create date at noon to avoid timezone issues
    const selectedDateObj = new Date(year, month, day, 12, 0, 0);

    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon

    // IMPORTANT: Force clear the attendance data when changing dates
    // This is critical to prevent showing stale data from a previous date
    setAttendanceData(null);
    console.log('RESET: Cleared attendance data due to date change');

    // Show a loading message to indicate data is being refreshed
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (selectedDateObj > today) {
      // If future date selected, set to today
      const todayStr = today.toISOString().split('T')[0];
      setSelectedDate(todayStr);
      console.log('Future date selected, setting to today:', todayStr);

      // Show a message to the user
      setError('Future dates are not allowed. Date set to today.');

      // If we have a subject selected, fetch attendance data
      if (selectedSubject) {
        // Use a longer timeout to ensure state is fully updated
        setTimeout(() => {
          console.log('Fetching attendance data for today after future date was selected');
          fetchAttendanceData(true); // Pass true to force refresh
        }, 500); // Increased timeout for better reliability
      } else {
        setLoading(false);
      }
    } else {
      // Valid date selected - use the exact date string
      setSelectedDate(exactDate);

      // If we have a subject selected, fetch attendance data for the new date
      if (selectedSubject) {
        // Use a longer timeout to ensure state is fully updated
        setTimeout(() => {
          console.log('Fetching attendance data for new date:', exactDate);
          fetchAttendanceData(true); // Pass true to force refresh
        }, 500); // Increased timeout for better reliability
      } else {
        setLoading(false);
      }
    }
  };

  const handleScanClick = () => {
    setShowScanner(true);
    setCurrentStudentId(null);
    setScanResult(null);
    setScannerError('');
    setScanning(false);
    setMarkedStudents([]);
    setLastScannedQR(null);

    // Initialize scanner in the next tick after the modal is shown
    setTimeout(() => {
      if (qrContainerRef.current) {
        startScanner();
      }
    }, 100);
  };

  const handleScannerClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
        .then(() => {
          console.log('Scanner stopped');
          scannerRef.current = null;
        })
        .catch(err => console.error('Error stopping scanner:', err));
    }
    setScanning(false);
    setShowScanner(false);
    setCurrentStudentId(null);
  };

  const startScanner = () => {
    if (scanning || !qrContainerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        handleScan,
        handleScanError
      )
      .then(() => {
        console.log('Scanner started successfully');
        setScanning(true);
      })
      .catch(err => {
        console.error('Error starting scanner:', err);
        setScannerError('Failed to start camera: ' + err.message);
      });
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setScannerError('Failed to initialize camera: ' + err.message);
    }
  };

  const handleScanError = (err) => {
    console.error('QR scan error:', err);
    setScannerError('Error scanning QR code: ' + err.message);
  };

  const handleScan = async (decodedText) => {
    if (!decodedText) return;

    // If this is the same QR code we just scanned, ignore it
    if (lastScannedQR === decodedText) {
      return;
    }

    try {
      console.log('QR code scanned:', decodedText);

      // For debugging - log the raw data
      console.log('Raw QR data:', decodedText);
      setLastScannedQR(decodedText);

      // Parse the QR code data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
        console.log('Parsed QR data:', qrData);
      } catch (parseErr) {
        console.error('Error parsing QR data:', parseErr);
        setScannerError('Invalid QR code format. Could not parse JSON data.');
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
        return;
      }

      // Verify that this is a valid student QR code
      if (!qrData.email || !qrData.secret || qrData.role !== 'student') {
        setScannerError('Invalid QR code. This is not a valid student QR code.');
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
        return;
      }

      // Find the student in the attendance data based on the email from QR code
      const studentToMark = attendanceData.attendanceData.find(
        item => item.student.email.toLowerCase() === qrData.email.toLowerCase()
      );

      if (!studentToMark) {
        setScannerError(`Student with email ${qrData.email} not found in this semester's attendance list.`);
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
        return;
      }

      // Check if this student has already been marked
      const alreadyMarked = markedStudents.some(s => s.id === studentToMark.student._id);
      if (alreadyMarked) {
        setSuccessMessage(`${studentToMark.student.name} is already marked present.`);
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => {
          setSuccessMessage('');
          setLastScannedQR(null);
        }, 2000);
        return;
      }

      console.log('Found student from QR code:', studentToMark.student.name);

      // Mark attendance for the found student
      try {
        const result = await markAttendance(studentToMark.student._id, true);

        if (result) {
          // Add to marked students list
          const newMarkedStudent = {
            id: studentToMark.student._id,
            name: studentToMark.student.name,
            email: studentToMark.student.email,
            timestamp: new Date().toLocaleTimeString()
          };

          setMarkedStudents(prev => [newMarkedStudent, ...prev]);
          setScanResult({
            email: studentToMark.student.email,
            name: studentToMark.student.name
          });

          // Show success message briefly
          setSuccessMessage(`${studentToMark.student.name} marked present successfully!`);
          setTimeout(() => {
            setSuccessMessage('');
            // Reset last scanned QR to allow scanning another code
            setLastScannedQR(null);
          }, 2000);
        }

        // Continue scanning - don't close the modal
      } catch (attendanceErr) {
        console.error('Error marking attendance:', attendanceErr);
        setScannerError('Failed to mark attendance: ' + (attendanceErr.response?.data?.msg || attendanceErr.message));
        // Reset last scanned QR after a delay to allow rescanning the same code
        setTimeout(() => setLastScannedQR(null), 2000);
      }
    } catch (err) {
      console.error('Error processing QR code:', err);
      setScannerError('Error processing QR code: ' + err.message);
      // Reset last scanned QR after a delay to allow rescanning the same code
      setTimeout(() => setLastScannedQR(null), 2000);
    }
  };

  const markAttendance = async (studentId, present) => {
    if (!token) return;

    try {
      // Don't set loading to true here as it will cause the UI to refresh and lose context
      setError('');
      setSuccessMessage('');

      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      console.log(`Marking attendance for student ${studentId} as ${present ? 'present' : 'absent'} on ${selectedDate}`);

      if (!selectedSubject) {
        setError('Please select a subject to mark attendance.');
        return false;
      }

      try {
        // IMPORTANT: Use the exact date string from the state
        // Do NOT create a new Date object as it can cause timezone issues
        const exactDate = selectedDate; // Use the raw date string
        console.log(`Marking attendance for date: ${exactDate}`);

        // Log the date components for debugging
        const dateComponents = selectedDate.split('-');
        console.log(`Date components: Year=${dateComponents[0]}, Month=${dateComponents[1]}, Day=${dateComponents[2]}`);

        // Add a timestamp to prevent caching issues
        const timestamp = new Date().getTime();

        const res = await axios.post(`/api/attendance?_t=${timestamp}`, {
          studentId,
          date: exactDate, // Use the exact date string
          present,
          subjectId: selectedSubject
        });

        console.log('Attendance response:', res.data);

        // Check if the attendance was already marked with the same status
        if (res.data.updated === false) {
          console.log('Attendance already marked with the same status');
          setSuccessMessage(`Student already marked as ${present ? 'present' : 'absent'}`);

          // Return true to indicate success, but we didn't actually change anything
          return true;
        }

        // IMPORTANT: Get the raw date string from the server response
        const rawResponseDate = res.data.attendance.date;
        console.log(`Raw date from server response: ${rawResponseDate}`);

        // Convert server date to YYYY-MM-DD format for comparison
        const responseDate = new Date(rawResponseDate);

        // Format the response date to match the input format (YYYY-MM-DD)
        const responseDateFormatted = responseDate.getFullYear() + '-' +
                                     String(responseDate.getMonth() + 1).padStart(2, '0') + '-' +
                                     String(responseDate.getDate()).padStart(2, '0');

        console.log(`Formatted response date: ${responseDateFormatted}`);
        console.log(`Comparing with requested date: ${exactDate}`);

        // Extract just the date part for comparison (ignore time)
        const requestedDateParts = exactDate.split('-');
        const responseDateParts = responseDateFormatted.split('-');

        // Check if the dates match (year, month, day)
        const datesMatch = requestedDateParts[0] === responseDateParts[0] &&
                          requestedDateParts[1] === responseDateParts[1] &&
                          requestedDateParts[2] === responseDateParts[2];

        if (!datesMatch) {
          console.warn(`DATE MISMATCH ERROR! Requested: ${exactDate}, Received: ${responseDateFormatted}`);
          console.warn(`Date parts - Requested: [${requestedDateParts.join(', ')}], Received: [${responseDateParts.join(', ')}]`);
        } else {
          console.log(`Date validation successful: Requested and received date match`);
        }

        console.log('Attendance marked successfully:', res.data);

        // Show appropriate success message based on whether it was created or updated
        if (res.data.created) {
          setSuccessMessage(`Student marked as ${present ? 'present' : 'absent'}`);
        } else if (res.data.updated) {
          setSuccessMessage(`Student attendance updated to ${present ? 'present' : 'absent'}`);
        } else {
          setSuccessMessage(res.data.msg);
        }

        // Update the UI directly
        setAttendanceData(prevData => {
          if (!prevData) return prevData;

          // Find if the student already had an attendance record
          const studentRecord = prevData.attendanceData.find(item => item.student._id === studentId);
          const wasPresent = studentRecord?.attendance?.present || false;

          // Calculate the new counts based on the previous state and the new state
          let newPresentCount = prevData.presentCount;
          let newAbsentCount = prevData.absentCount;

          // If student was absent and now present, increment present count and decrement absent count
          if (!wasPresent && present) {
            newPresentCount++;
            newAbsentCount--;
          }
          // If student was present and now absent, decrement present count and increment absent count
          else if (wasPresent && !present) {
            newPresentCount--;
            newAbsentCount++;
          }
          // Otherwise, no change in counts

          console.log(`Updating attendance UI: Student ${studentId} was ${wasPresent ? 'present' : 'absent'}, now ${present ? 'present' : 'absent'}`);
          console.log(`Counts: Present ${prevData.presentCount} -> ${newPresentCount}, Absent ${prevData.absentCount} -> ${newAbsentCount}`);

          // Create a new copy of the attendance data
          const updatedAttendanceData = {
            ...prevData,
            presentCount: newPresentCount,
            absentCount: newAbsentCount,
            attendanceData: prevData.attendanceData.map(item => {
              // If this is the student we just marked, update their attendance
              if (item.student._id === studentId) {
                return {
                  ...item,
                  attendance: {
                    _id: res.data.attendance._id,
                    date: res.data.attendance.date,
                    present: present
                  }
                };
              }
              return item;
            })
          };

          return updatedAttendanceData;
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);

        return true;
      } catch (markErr) {
        console.error('Error marking attendance:', markErr);

        if (markErr.response?.data?.msg === 'Teacher does not have an assigned branch') {
          setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
        } else if (markErr.response?.data?.msg === 'Not authorized to mark attendance for students from other branches') {
          setError('You are not authorized to mark attendance for students from other branches.');
        } else {
          setError('Failed to mark attendance: ' + (markErr.response?.data?.msg || markErr.message));
        }

        return false;
      }
    } catch (err) {
      console.error('Unexpected error marking attendance:', err);
      setError('An unexpected error occurred: ' + err.message);
      return false;
    }
  };

  const handleAddSubjectClick = () => {
    setNewSubject({
      name: '',
      code: '',
      semester: selectedSemester,
      description: '',
      credits: 3
    });
    setShowAddSubjectModal(true);
  };

  const handleAddSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'credits' ? parseInt(value) : value
    }));
  };

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

      // Check if branch is valid
      if (!userRes.data.branch) {
        setError('You do not have a branch assigned. Please go to your Profile page to set your branch.');
        setLoading(false);
        return;
      }

      console.log('User branch code:', userRes.data.branch);

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
      console.log('Creating subject with branch ID:', userBranch._id);

      // Create the subject
      const res = await axios.post('/api/subjects', {
        ...newSubject,
        branch: userBranch._id
      });

      console.log('Subject creation response:', res.data);

      console.log('Subject created:', res.data);
      setSuccessMessage('Subject created successfully!');

      // Close the modal and refresh subjects
      setShowAddSubjectModal(false);
      fetchSubjects();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error creating subject:', err);

      if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError('Failed to create subject: ' + errorMessages);
      } else if (err.response?.data?.msg) {
        // Handle specific error message from server
        setError('Failed to create subject: ' + err.response.data.msg);
      } else {
        // Handle generic error
        setError('Failed to create subject: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // CRITICAL FIX: Handle date formatting carefully to avoid timezone issues
    console.log(`Formatting date: ${dateString}`);

    // IMPORTANT: Check for exactDate or dateString properties from the server
    if (typeof dateString === 'object') {
      if (dateString.exactDate) {
        console.log(`Using exactDate property: ${dateString.exactDate}`);
        return formatExactDateString(dateString.exactDate);
      } else if (dateString.dateString) {
        console.log(`Using dateString property: ${dateString.dateString}`);
        return formatExactDateString(dateString.dateString);
      }
    }

    // If it's a simple string, use it directly
    if (typeof dateString === 'string') {
      return formatExactDateString(dateString);
    }

    // If it's a Date object, format it carefully
    if (dateString instanceof Date) {
      const year = dateString.getFullYear();
      const month = dateString.getMonth() + 1; // JS months are 0-indexed
      const day = dateString.getDate();

      // Create a formatted date string
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      return formatExactDateString(formattedDate);
    }

    // Fallback for unknown formats
    console.warn(`Invalid date format: ${dateString}`);
    return String(dateString);
  };

  // Helper function to format an exact date string
  const formatExactDateString = (exactDateStr) => {
    console.log(`Formatting exact date string: ${exactDateStr}`);

    // Parse the date parts directly
    const dateParts = exactDateStr.split('T')[0].split('-');

    if (dateParts.length !== 3) {
      console.warn(`Invalid date parts: ${dateParts.join(', ')}`);
      return exactDateStr;
    }

    // Create a date object with the date parts
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Subtract 1 for JS Date month (0-11)
    const day = parseInt(dateParts[2]);

    // Format the date using the browser's locale
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    try {
      // Use Intl.DateTimeFormat for more reliable formatting
      return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month, day));
    } catch (err) {
      console.error('Error formatting date:', err);
      return `${day}/${month + 1}/${year}`; // Fallback format
    }
  };

  // Function to save all attendance data to database
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

      // Get the subject name for logging
      const subjectName = subjects.find(s => s._id === selectedSubject)?.name || 'Unknown';

      console.log(`Saving attendance for ${attendanceData.attendanceData.length} students for subject ${subjectName} on ${selectedDate}`);

      // IMPORTANT: Use the exact date string from the state
      // Do NOT create a new Date object as it can cause timezone issues
      const exactDate = selectedDate; // Use the raw date string
      console.log(`Using exact date for batch save: ${exactDate}`);

      // Log the date components for debugging
      const dateComponents = selectedDate.split('-');
      console.log(`Date components: Year=${dateComponents[0]}, Month=${dateComponents[1]}, Day=${dateComponents[2]}`);

      // Create an array of attendance records to save
      const attendanceRecords = attendanceData.attendanceData.map(item => ({
        studentId: item.student._id,
        date: exactDate, // Use the exact date string
        present: item.attendance?.present || false,
        subjectId: selectedSubject
      }));

      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();

      // Send the batch update request
      const res = await axios.post(`/api/attendance/batch?_t=${timestamp}`, {
        records: attendanceRecords
      });

      console.log('Attendance saved successfully:', res.data);
      setSuccessMessage('Attendance data saved to database successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving attendance data:', err);
      setError('Failed to save attendance data: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1>
          <FaCalendarAlt className="icon" /> Attendance Management
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="attendance-filters">
        <div className="filter-group">
          <label htmlFor="semester">Semester:</label>
          <select
            id="semester"
            value={selectedSemester}
            onChange={handleSemesterChange}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="subject"><FaBook className="icon" /> Subject:</label>
          <div className="subject-select-container">
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => {
                // Clear attendance data when subject changes
                setAttendanceData(null);
                setSelectedSubject(e.target.value);
                // If a valid subject is selected, fetch attendance data
                if (e.target.value) {
                  setTimeout(() => fetchAttendanceData(true), 300); // Force refresh when subject changes
                }
              }}
              disabled={subjects.length === 0}
              className="subject-select"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm btn-primary add-subject-btn"
              onClick={handleAddSubjectClick}
              title="Add New Subject"
            >
              <FaPlus /> Add Subject
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="date"><FaCalendarAlt className="icon" /> Date:</label>
          <div className="date-input-container">
            <div className="relative">
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                title="Select a date to view attendance records"
                className="date-input w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 pointer-events-none">
                <FaCalendarAlt />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading attendance data...</div>
      ) : attendanceData ? (
        <div className="attendance-container">
          <div className="attendance-header">
            <h2>Attendance for {formatDate(attendanceData.exactDate || attendanceData.dateString || attendanceData.date)}</h2>
            <h3>
              <FaBook className="icon" /> Subject: {
                subjects.find(s => s._id === selectedSubject)?.name || 'Not selected'
              } (
              {subjects.find(s => s._id === selectedSubject)?.code || ''})
            </h3>
            <div className="attendance-stats">
              <div className="stat">
                <span className="stat-label">Total Students:</span>
                <span className="stat-value">{attendanceData.totalStudents}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Present:</span>
                <span className="stat-value">{attendanceData.presentCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Absent:</span>
                <span className="stat-value">{attendanceData.absentCount}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Attendance Rate:</span>
                <span className="stat-value">
                  {attendanceData.totalStudents > 0
                    ? Math.round((attendanceData.presentCount / attendanceData.totalStudents) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {attendanceData.attendanceData && attendanceData.attendanceData.length > 0 ? (
            <>
              <div className="attendance-actions-bar">
                <div className="flex flex-wrap gap-4 justify-center mb-2">
                  <button
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors duration-200 shadow-md"
                    onClick={handleScanClick}
                  >
                    <FaQrcode className="mr-2" /> Scan Student QR Code
                  </button>

                  <button
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 shadow-md"
                    onClick={saveAttendanceToDatabase}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Save Attendance to Database
                      </>
                    )}
                  </button>
                </div>

                <p className="attendance-help-text">
                  Scan a student's QR code to mark them present, or use the buttons below to mark attendance manually.
                  Click "Save Attendance to Database" to permanently save all attendance records.
                </p>
              </div>

              <div className="attendance-list">
                <div className="attendance-list-header">
                  <div className="header-name">Name</div>
                  <div className="header-email">Email</div>
                  <div className="header-status">Status</div>
                  <div className="header-actions">Actions</div>
                </div>

                {attendanceData.attendanceData.map(item => (
                  <div key={item.student._id} className="attendance-item">
                    <div className="student-name">
                      <FaUserGraduate className="icon" />
                      {item.student.name}
                    </div>
                    <div className="student-email">{item.student.email}</div>
                    <div className={`attendance-status ${item.attendance?.present ? 'present' : 'absent'}`}>
                      {item.attendance ? (
                        item.attendance.present ? (
                          <><FaCheck className="icon" /> Present</>
                        ) : (
                          <><FaTimes className="icon" /> Absent</>
                        )
                      ) : (
                        <><FaTimes className="icon" /> Absent</>
                      )}
                    </div>
                    <div className="attendance-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAttendance(item.student._id, true)}
                        disabled={item.attendance?.present}
                      >
                        <FaCheck /> Mark Present
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => markAttendance(item.student._id, false)}
                        disabled={item.attendance && !item.attendance.present}
                      >
                        <FaTimes /> Mark Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-students">
              <p>No students found for Semester {selectedSemester}.</p>
              <p>Make sure there are students assigned to this semester in your branch.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>Select a semester and date to view attendance.</p>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2><FaBook className="icon" /> Add New Subject</h2>

            <form onSubmit={handleAddSubjectSubmit} className="add-subject-form">
              <div className="form-group">
                <label htmlFor="name">Subject Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newSubject.name}
                  onChange={handleAddSubjectChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">Subject Code:</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={newSubject.code}
                  onChange={handleAddSubjectChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="semester">Semester:</label>
                <select
                  id="semester"
                  name="semester"
                  value={newSubject.semester}
                  onChange={handleAddSubjectChange}
                  className="form-control"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="credits">Credits:</label>
                <input
                  type="number"
                  id="credits"
                  name="credits"
                  value={newSubject.credits}
                  onChange={handleAddSubjectChange}
                  min="1"
                  max="10"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={newSubject.description}
                  onChange={handleAddSubjectChange}
                  className="form-control"
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay" onClick={handleScannerClose}>
          <div className="modal-content scanner-modal" onClick={e => e.stopPropagation()}>
            <h2>Scan Student QR Codes</h2>

            <div className="scanner-container">
              {successMessage && <div className="success-message">{successMessage}</div>}
              {scannerError && <div className="error-message">{scannerError}</div>}
              <div className="qr-scanner-container" ref={qrContainerRef}>
                <div id="qr-reader"></div>
                <div className="scanner-overlay">
                  <div className="scanner-frame"></div>
                </div>
                <p className="scanner-help">
                  <FaCamera className="icon" /> Position the QR code within the frame to scan
                </p>
                {!scanning && (
                  <div className="scanner-loading">
                    <div className="spinner"></div>
                    <p>Initializing camera...</p>
                  </div>
                )}
              </div>

              <div className="scanner-info">

                <div className="manual-mark-section">
                  <p>Having trouble with the scanner? You can enter a student's email to mark them present:</p>
                  <div className="manual-search">
                    <input
                      type="text"
                      placeholder="Enter student email"
                      value={searchEmail || ''}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="form-control"
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (!searchEmail) {
                          setScannerError('Please enter a student email');
                          return;
                        }

                        // Find student by email
                        const studentToMark = attendanceData.attendanceData.find(
                          item => item.student.email.toLowerCase() === searchEmail.toLowerCase()
                        );

                        if (studentToMark) {
                          // Check if already marked
                          const alreadyMarked = markedStudents.some(s => s.id === studentToMark.student._id);
                          if (alreadyMarked) {
                            setScannerError(`${studentToMark.student.name} has already been marked present.`);
                            return;
                          }

                          markAttendance(studentToMark.student._id, true);

                          // Add to marked students list
                          const newMarkedStudent = {
                            id: studentToMark.student._id,
                            name: studentToMark.student.name,
                            email: studentToMark.student.email,
                            timestamp: new Date().toLocaleTimeString()
                          };

                          setMarkedStudents(prev => [newMarkedStudent, ...prev]);
                          setSearchEmail('');
                          setSuccessMessage(`${studentToMark.student.name} marked present successfully!`);
                          setTimeout(() => setSuccessMessage(''), 2000);
                        } else {
                          setScannerError(`Student with email ${searchEmail} not found in this semester's attendance list`);
                        }
                      }}
                    >
                      <FaCheck /> Mark Present
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleScannerClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
