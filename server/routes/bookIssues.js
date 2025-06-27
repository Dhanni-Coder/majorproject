const express = require('express');
const { check } = require('express-validator');
const bookIssueController = require('../controllers/bookIssueController');
const { auth, teacherAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/book-issues
// @desc    Get all book issues
// @access  Private (Admin and Teacher)
router.get('/', [auth, teacherAuth], bookIssueController.getAllBookIssues);

// @route   GET api/book-issues/student
// @desc    Get book issues for the current student
// @access  Private (Student)
router.get('/student', auth, bookIssueController.getStudentBookIssues);

// @route   GET api/book-issues/:id
// @desc    Get book issue by ID
// @access  Private
router.get('/:id', auth, bookIssueController.getBookIssueById);

// @route   POST api/book-issues
// @desc    Issue a book to a student
// @access  Private (Admin and Teacher)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('bookId', 'Book ID is required').not().isEmpty().isMongoId(),
      check('studentId', 'Student ID is required').not().isEmpty().isMongoId(),
      check('dueDate', 'Due date is required').not().isEmpty().isISO8601().toDate()
    ]
  ],
  bookIssueController.issueBook
);

// @route   PUT api/book-issues/:id/return
// @desc    Return a book
// @access  Private (Admin and Teacher)
router.put('/:id/return', [auth, teacherAuth], bookIssueController.returnBook);

// @route   PUT api/book-issues/:id
// @desc    Update a book issue
// @access  Private (Admin and Teacher who issued the book)
router.put(
  '/:id',
  [
    auth,
    teacherAuth,
    [
      check('dueDate', 'Due date must be a valid date').optional().isISO8601().toDate(),
      check('fine', 'Fine must be a positive number').optional().isFloat({ min: 0 })
    ]
  ],
  bookIssueController.updateBookIssue
);

// @route   DELETE api/book-issues/:id
// @desc    Delete a book issue
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], bookIssueController.deleteBookIssue);

module.exports = router;
