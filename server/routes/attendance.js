const express = require('express');
const { check } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { auth, teacherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/attendance
// @desc    Mark attendance for a student
// @access  Private (Teacher only)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('studentId', 'Student ID is required').not().isEmpty().isMongoId(),
      check('date', 'Valid date is required').isISO8601().toDate(),
      check('present', 'Present status must be a boolean').isBoolean()
    ]
  ],
  attendanceController.markAttendance
);

// @route   GET api/attendance/date/:date/semester/:semester
// @desc    Get attendance for a specific date and semester
// @access  Private (Teacher only)
router.get(
  '/date/:date/semester/:semester',
  [auth, teacherAuth],
  attendanceController.getAttendanceByDateAndSemester
);

// @route   GET api/attendance/student/:studentId
// @desc    Get attendance history for a specific student
// @access  Private (Teacher, Admin, and the Student themselves)
router.get(
  '/student/:studentId',
  [auth], // Allow any authenticated user, permissions checked in controller
  attendanceController.getStudentAttendance
);

// @route   GET api/attendance/my-summary
// @desc    Get attendance summary for the logged-in student
// @access  Private (Student only)
router.get(
  '/my-summary',
  [auth],
  attendanceController.getMyAttendanceSummary
);

// @route   GET api/attendance/summary/semester/:semester
// @desc    Get attendance summary for a semester
// @access  Private (Teacher only)
router.get(
  '/summary/semester/:semester',
  [auth, teacherAuth],
  attendanceController.getSemesterAttendanceSummary
);

module.exports = router;
