import { useState, useEffect, useContext, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
  FaCalendarAlt, FaChevronLeft, FaChevronRight, FaMapMarkerAlt,
  FaClock, FaUserGraduate, FaBook, FaDownload, FaPrint,
  FaFilter, FaSearch, FaPlus, FaEdit, FaTrash, FaEye,
  FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import '../styles/TeacherSchedule.css';

const TeacherSchedule = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [scheduleData, setScheduleData] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'list'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    class: '',
    room: '',
    date: '',
    startTime: '09:00',
    endTime: '10:30',
    students: 0,
    color: '#4361ee'
  });

  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  const successTimeoutRef = useRef(null);

  // Redirect if not logged in or not a teacher
  if (!user) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading user data...</p></div>;
  }

  if (user.role !== 'teacher') {
    console.log('User is not a teacher, redirecting to dashboard');
    return <Navigate to="/dashboard" />;
  }

  // Get current week dates
  function getCurrentWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday

    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDates.push(day);
    }

    return weekDates;
  }

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7);
      return newDate;
    });
    setCurrentWeek(prevWeek);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7);
      return newDate;
    });
    setCurrentWeek(nextWeek);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeek(getCurrentWeek());
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Get week range string
  const getWeekRangeString = () => {
    const startDate = currentWeek[0];
    const endDate = currentWeek[6];

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  // Filter schedule data
  const filterScheduleData = () => {
    let filtered = [...scheduleData];

    // Apply subject filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.subject === filter);
    }

    // Apply search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.subject.toLowerCase().includes(term) ||
        item.room.toLowerCase().includes(term) ||
        item.class.toLowerCase().includes(term)
      );
    }

    setFilteredSchedule(filtered);
  };

  // Get unique subjects for filter
  const getUniqueSubjects = () => {
    const subjects = scheduleData.map(item => item.subject);
    return ['all', ...new Set(subjects)];
  };

  // Get classes for a specific day and time slot
  const getClassesForTimeSlot = (day, timeSlot) => {
    return filteredSchedule.filter(item =>
      new Date(item.date).getDay() === day.getDay() &&
      item.startTime === timeSlot
    );
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle opening the add class modal
  const handleAddClass = () => {
    // Reset form data
    setFormData({
      subject: '',
      class: '',
      room: '',
      date: currentWeek[0].toISOString().split('T')[0], // Default to Monday of current week
      startTime: '09:00',
      endTime: '10:30',
      students: 0,
      color: '#4361ee'
    });
    setModalMode('add');
    setShowModal(true);
  };

  // Handle opening the edit class modal
  const handleEditClass = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      subject: classItem.subject,
      class: classItem.class,
      room: classItem.room,
      date: new Date(classItem.date).toISOString().split('T')[0],
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      students: classItem.students,
      color: classItem.color
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (modalMode === 'add') {
      // Generate a new ID (in a real app, this would be handled by the backend)
      const newId = Math.max(0, ...scheduleData.map(item => item.id)) + 1;

      // Create new class object
      const newClass = {
        id: newId,
        ...formData,
        date: new Date(formData.date)
      };

      // Add to schedule data
      setScheduleData(prev => [...prev, newClass]);
      showSuccess('Class added successfully!');
    } else {
      // Update existing class
      const updatedSchedule = scheduleData.map(item =>
        item.id === selectedClass.id
          ? { ...item, ...formData, date: new Date(formData.date) }
          : item
      );

      setScheduleData(updatedSchedule);
      showSuccess('Class updated successfully!');
    }

    // Close modal
    setShowModal(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (classItem) => {
    setClassToDelete(classItem);
    setShowConfirmDialog(true);
  };

  // Handle actual deletion
  const handleDelete = () => {
    if (!classToDelete) return;

    // Filter out the class to delete
    const updatedSchedule = scheduleData.filter(item => item.id !== classToDelete.id);
    setScheduleData(updatedSchedule);

    // Close confirmation dialog
    setShowConfirmDialog(false);
    setClassToDelete(null);

    showSuccess('Class deleted successfully!');
  };

  // Show success message with timeout
  const showSuccess = (message) => {
    setSuccessMessage(message);

    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    // Set new timeout to clear message after 3 seconds
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Close confirmation dialog
  const handleCloseConfirm = () => {
    setShowConfirmDialog(false);
    setClassToDelete(null);
  };

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError('');

        // In a real application, you would fetch the schedule data from the server
        // For now, we'll use sample data
        const sampleScheduleData = [
          {
            id: 1,
            subject: 'Mathematics',
            class: 'Class 10-A',
            room: 'Room 101',
            date: new Date(currentWeek[0]), // Monday
            startTime: '09:00',
            endTime: '10:30',
            students: 35,
            color: '#4361ee'
          },
          {
            id: 2,
            subject: 'Physics',
            class: 'Class 11-B',
            room: 'Lab 3',
            date: new Date(currentWeek[0]), // Monday
            startTime: '11:00',
            endTime: '12:30',
            students: 28,
            color: '#3a0ca3'
          },
          {
            id: 3,
            subject: 'Computer Science',
            class: 'Class 12-A',
            room: 'Computer Lab',
            date: new Date(currentWeek[1]), // Tuesday
            startTime: '10:00',
            endTime: '11:30',
            students: 25,
            color: '#4cc9f0'
          },
          {
            id: 4,
            subject: 'Mathematics',
            class: 'Class 11-A',
            room: 'Room 102',
            date: new Date(currentWeek[2]), // Wednesday
            startTime: '09:00',
            endTime: '10:30',
            students: 32,
            color: '#4361ee'
          },
          {
            id: 5,
            subject: 'Physics',
            class: 'Class 10-B',
            room: 'Lab 2',
            date: new Date(currentWeek[3]), // Thursday
            startTime: '13:00',
            endTime: '14:30',
            students: 30,
            color: '#3a0ca3'
          },
          {
            id: 6,
            subject: 'Computer Science',
            class: 'Class 11-B',
            room: 'Computer Lab',
            date: new Date(currentWeek[4]), // Friday
            startTime: '14:00',
            endTime: '15:30',
            students: 27,
            color: '#4cc9f0'
          },
          {
            id: 7,
            subject: 'Mathematics',
            class: 'Class 12-B',
            room: 'Room 103',
            date: new Date(currentWeek[2]), // Wednesday
            startTime: '11:00',
            endTime: '12:30',
            students: 29,
            color: '#4361ee'
          },
          {
            id: 8,
            subject: 'Physics Lab',
            class: 'Class 11-A',
            room: 'Lab 1',
            date: new Date(currentWeek[4]), // Friday
            startTime: '09:00',
            endTime: '11:00',
            students: 32,
            color: '#3a0ca3'
          }
        ];

        // Adjust dates to match the current week
        const adjustedSchedule = sampleScheduleData.map(item => {
          const dayOfWeek = new Date(item.date).getDay();
          const newDate = new Date(currentWeek[dayOfWeek === 0 ? 6 : dayOfWeek - 1]);
          return {
            ...item,
            date: newDate
          };
        });

        setScheduleData(adjustedSchedule);
        setFilteredSchedule(adjustedSchedule);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError('Failed to load schedule data');
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [currentWeek]);

  useEffect(() => {
    filterScheduleData();
  }, [filter, searchTerm, scheduleData]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading schedule data...</p>
      </div>
    );
  }

  return (
    <div className="teacher-schedule">
      <div className="schedule-header">
        <div className="schedule-title-section">
          <h1 className="schedule-title">
            <FaCalendarAlt className="icon" /> Class Schedule
          </h1>
          <p className="schedule-subtitle">Manage your weekly teaching schedule</p>
        </div>

        <div className="schedule-actions">
          <button className="btn btn-secondary" onClick={() => setViewMode(viewMode === 'week' ? 'list' : 'week')}>
            {viewMode === 'week' ? 'List View' : 'Week View'}
          </button>
          <button className="btn btn-primary" onClick={handleAddClass}>
            <FaPlus /> Add Class
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}

      <div className="schedule-controls">
        <div className="week-navigation">
          <button className="nav-btn" onClick={goToPreviousWeek}>
            <FaChevronLeft />
          </button>
          <div className="current-week">
            <h3>{getWeekRangeString()}</h3>
            <button className="today-btn" onClick={goToCurrentWeek}>Today</button>
          </div>
          <button className="nav-btn" onClick={goToNextWeek}>
            <FaChevronRight />
          </button>
        </div>

        <div className="schedule-filters">
          <div className="filter-group">
            <label htmlFor="subject-filter">
              <FaFilter className="icon" /> Filter:
            </label>
            <select
              id="subject-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <FaSearch className="icon" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="export-group">
            <button className="icon-btn" title="Print Schedule">
              <FaPrint />
            </button>
            <button className="icon-btn" title="Download as PDF">
              <FaDownload />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        <div className="schedule-week-view">
          <div className="time-column">
            <div className="day-header"></div>
            {timeSlots.map(timeSlot => (
              <div className="time-slot" key={timeSlot}>
                <span>{formatTime(timeSlot)}</span>
              </div>
            ))}
          </div>

          {currentWeek.map((day, index) => (
            <div className={`day-column ${isToday(day) ? 'today' : ''}`} key={index}>
              <div className={`day-header ${isToday(day) ? 'today' : ''}`}>
                <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="day-date">{day.getDate()}</span>
              </div>

              {timeSlots.map(timeSlot => {
                const classes = getClassesForTimeSlot(day, timeSlot);
                return (
                  <div className="time-slot" key={timeSlot}>
                    {classes.length > 0 ? (
                      classes.map(classItem => (
                        <div
                          className="class-item"
                          key={classItem.id}
                          style={{
                            backgroundColor: classItem.color,
                            height: calculateClassHeight(classItem.startTime, classItem.endTime)
                          }}
                        >
                          <h4 className="class-subject">{classItem.subject}</h4>
                          <p className="class-details">
                            <span><FaUserGraduate /> {classItem.class}</span>
                            <span><FaMapMarkerAlt /> {classItem.room}</span>
                            <span><FaClock /> {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}</span>
                          </p>
                          <div className="class-actions">
                            <button className="class-action-btn" title="View Details">
                              <FaEye />
                            </button>
                            <button
                              className="class-action-btn"
                              title="Edit Class"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClass(classItem);
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="class-action-btn"
                              title="Delete Class"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm(classItem);
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="schedule-list-view">
          {filteredSchedule.length > 0 ? (
            <div className="schedule-list">
              {currentWeek.map((day, dayIndex) => {
                const dayClasses = filteredSchedule.filter(item =>
                  new Date(item.date).getDate() === day.getDate() &&
                  new Date(item.date).getMonth() === day.getMonth() &&
                  new Date(item.date).getFullYear() === day.getFullYear()
                );

                if (dayClasses.length === 0) return null;

                return (
                  <div className="schedule-day" key={dayIndex}>
                    <h3 className={`day-heading ${isToday(day) ? 'today' : ''}`}>
                      {formatDate(day)}
                      {isToday(day) && <span className="today-badge">Today</span>}
                    </h3>
                    <div className="day-classes">
                      {dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(classItem => (
                        <div className="list-class-item" key={classItem.id}>
                          <div className="class-time">
                            <span className="start-time">{formatTime(classItem.startTime)}</span>
                            <span className="time-separator">-</span>
                            <span className="end-time">{formatTime(classItem.endTime)}</span>
                          </div>
                          <div className="class-content" style={{ borderLeftColor: classItem.color }}>
                            <h4 className="class-subject">{classItem.subject}</h4>
                            <div className="class-details">
                              <span><FaUserGraduate /> {classItem.class}</span>
                              <span><FaMapMarkerAlt /> {classItem.room}</span>
                              <span><FaUserGraduate /> {classItem.students} students</span>
                            </div>
                          </div>
                          <div className="class-actions">
                            <button className="class-action-btn" title="View Details">
                              <FaEye />
                            </button>
                            <button
                              className="class-action-btn"
                              title="Edit Class"
                              onClick={() => handleEditClass(classItem)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="class-action-btn"
                              title="Delete Class"
                              onClick={() => handleDeleteConfirm(classItem)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-schedule">
              <FaCalendarAlt className="empty-icon" />
              <h3>No classes found</h3>
              <p>There are no classes scheduled for this week that match your filters.</p>
              <button className="btn btn-primary" onClick={() => { setFilter('all'); setSearchTerm(''); }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <FaCheck className="success-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Class Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Add New Class' : 'Edit Class'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="class-form">
              <div className="form-group">
                <label htmlFor="subject">
                  <FaBook className="form-icon" /> Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter subject name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="class">
                  <FaUserGraduate className="form-icon" /> Class
                </label>
                <input
                  type="text"
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter class name (e.g. Class 10-A)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="room">
                    <FaMapMarkerAlt className="form-icon" /> Room
                  </label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter room number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="students">
                    <FaUserGraduate className="form-icon" /> Students
                  </label>
                  <input
                    type="number"
                    id="students"
                    name="students"
                    value={formData.students}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="Number of students"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="date">
                  <FaCalendarAlt className="form-icon" /> Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">
                    <FaClock className="form-icon" /> Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">
                    <FaClock className="form-icon" /> End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="color">
                  <FaInfoCircle className="form-icon" /> Color
                </label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="color-picker"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Add Class' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Confirm Deletion</h3>
            </div>

            <div className="confirm-content">
              <p>Are you sure you want to delete this class?</p>
              {classToDelete && (
                <div className="class-summary">
                  <p><strong>{classToDelete.subject}</strong> - {classToDelete.class}</p>
                  <p>{formatDate(new Date(classToDelete.date))}, {formatTime(classToDelete.startTime)} - {formatTime(classToDelete.endTime)}</p>
                </div>
              )}
              <p className="warning-text">This action cannot be undone.</p>
            </div>

            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={handleCloseConfirm}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate class height based on duration
const calculateClassHeight = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const durationMinutes = endMinutes - startMinutes;

  // Base height for a 60-minute class
  const baseHeight = 60;

  // Calculate height proportional to duration
  return `${(durationMinutes / 60) * baseHeight}px`;
};

export default TeacherSchedule;
