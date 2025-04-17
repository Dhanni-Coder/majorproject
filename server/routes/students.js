const express = require('express');
const { check } = require('express-validator');
const studentController = require('../controllers/studentController');
const { auth, teacherAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/students
// @desc    Create a new student
// @access  Private (Teacher and Admin only)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('branch', 'Branch is required').not().isEmpty()
    ]
  ],
  studentController.createStudent
);

module.exports = router;
