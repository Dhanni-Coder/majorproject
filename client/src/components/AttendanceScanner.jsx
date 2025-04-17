import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import QRCodeScanner from './QRCodeScanner';

const AttendanceScanner = ({ courseId }) => {
  const { token } = useContext(AuthContext);
  const [qrInput, setQrInput] = useState('');
  // Status is now automatically set to 'present' when QR code is scanned
  const [notes, setNotes] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState(null);

  // Fetch course details and recent attendance records
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !token) return;

      try {
        setLoading(true);
        setError('');

        // Set up axios headers
        axios.defaults.headers.common['x-auth-token'] = token;

        // Fetch course details
        const courseRes = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourseDetails(courseRes.data);

        // Fetch recent attendance records
        const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/course/${courseId}`);
        setRecentAttendance(attendanceRes.data.slice(0, 5)); // Show only the 5 most recent records

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. ' + (err.response?.data?.msg || err.message));
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, token]);

  const handleQRCodeScan = async (decodedText) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Set up axios headers
      axios.defaults.headers.common['x-auth-token'] = token;

      // Process QR code data - ensure it's valid JSON
      let qrDataToSend;

      try {
        // First, check if it's already a valid JSON string
        if (decodedText.trim().startsWith('{') && decodedText.trim().endsWith('}')) {
          // Try to parse it as JSON
          JSON.parse(decodedText);
          // If it parses successfully, use it as is
          qrDataToSend = decodedText;
        } else {
          // If it's not valid JSON, assume it's just an email and create a simple object
          qrDataToSend = JSON.stringify({
            email: decodedText.trim(),
            secret: '123456' // Default secret for demo purposes
          });
        }

        console.log('Processed QR data:', qrDataToSend);
      } catch (jsonError) {
        console.error('Error processing QR data:', jsonError);
        // If there's any error in processing, create a simple object with the input as email
        qrDataToSend = JSON.stringify({
          email: decodedText.trim(),
          secret: '123456' // Default secret for demo purposes
        });
      }

      console.log('Sending QR data:', qrDataToSend);

      const res = await axios.post('http://localhost:5000/api/attendance/mark', {
        qrData: qrDataToSend,
        courseId,
        status: 'present', // Always mark as present when QR code is scanned
        notes,
        date: attendanceDate // Send the selected date to the server
      });

      setMessage(res.data.msg);
      setNotes('');

      // Refresh recent attendance
      const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/course/${courseId}`);
      setRecentAttendance(attendanceRes.data.slice(0, 5));
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.response?.data?.msg || 'Error marking attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeError = (errorMessage) => {
    // Only set error for significant errors, not for normal scanning errors
    if (errorMessage.includes('Camera access denied') ||
        errorMessage.includes('No camera')) {
      setError(errorMessage);
    }
  };

  if (loading && !courseDetails) {
    return <div className="loading">Loading course data...</div>;
  }

  return (
    <div className="attendance-scanner">
      <h2>Mark Attendance</h2>

      {courseDetails && (
        <div className="course-info-banner">
          <h3>{courseDetails.name} ({courseDetails.code})</h3>
          <p>Teacher: {courseDetails.teacher?.name}</p>
          <p>Students enrolled: {courseDetails.students?.length || 0}</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="qr-scanner-section">
        <h3>Scan Student QR Code</h3>
        <QRCodeScanner
          onScanSuccess={handleQRCodeScan}
          onScanError={handleQRCodeError}
        />
      </div>

      <form>

        <div className="form-group">
          <label htmlFor="attendanceDate">Attendance Date:</label>
          <input
            type="date"
            id="attendanceDate"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
          <small className="form-text">Select the date for which you want to mark attendance</small>
        </div>

        <div className="attendance-status-info">
          <div className="status-badge status-present">
            <span className="status-icon">✓</span>
            <span className="status-text">Present</span>
          </div>
          <p className="status-explanation">Students are automatically marked as <strong>Present</strong> when their QR code is scanned</p>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this attendance record"
            rows="3"
          ></textarea>
        </div>

        <div className="form-note">
          <p>Scan a student's QR code above to mark them as <strong>Present</strong>.</p>
          <p>You can select the date and add optional notes before scanning.</p>
          <p><strong>Note:</strong> The date defaults to today, but you can change it to record attendance for a different day.</p>
          <p><strong>Important:</strong> Students are automatically marked as present when their QR code is scanned. Students who don't scan are considered absent.</p>
        </div>
      </form>

      {recentAttendance.length > 0 ? (
        <div className="recent-attendance">
          <h3>Recent Attendance</h3>
          <ul className="attendance-list">
            {recentAttendance.map((record) => (
              <li key={record._id} className={`attendance-item status-${record.status}`}>
                <div className="attendance-info">
                  <strong>{record.student?.name || 'Unknown Student'}</strong>
                  <span className="attendance-date">
                    {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                  </span>
                  <span className="attendance-status">
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
                {record.notes && <p className="attendance-notes">{record.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="no-records">
          <p>No attendance records found for this course.</p>
        </div>
      )}

      <div className="scanner-instructions">
        <h3>Instructions</h3>
        <ul>
          <li>Position the student's QR code in front of the camera.</li>
          <li>Make sure the QR code is well-lit and clearly visible.</li>
          <li>The student must be enrolled in this course for attendance to be marked.</li>
          <li>Select the date for which you want to mark attendance (defaults to today).</li>
          <li>Students are automatically marked as <strong>Present</strong> when their QR code is scanned.</li>
          <li>Add optional notes about the attendance if needed.</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceScanner;
