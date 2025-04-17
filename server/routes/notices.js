const express = require('express');
const { check } = require('express-validator');
const noticeController = require('../controllers/noticeController');
const { auth, teacherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/notices
// @desc    Create a new notice
// @access  Private (Admin and Teacher)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty(),
      check('targetRole', 'Invalid target role').optional().isIn(['all', 'teacher', 'student']),
      check('important', 'Important must be a boolean').optional().isBoolean()
    ]
  ],
  noticeController.createNotice
);

// @route   GET api/notices
// @desc    Get all notices for the current user's role
// @access  Private
router.get('/', auth, noticeController.getNotices);

// @route   GET api/notices/:id
// @desc    Get a notice by ID
// @access  Private
router.get('/:id', auth, noticeController.getNoticeById);

// @route   PUT api/notices/:id
// @desc    Update a notice
// @access  Private (Admin and original sender)
router.put(
  '/:id',
  [
    auth,
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('content', 'Content is required').optional().not().isEmpty(),
      check('targetRole', 'Invalid target role').optional().isIn(['all', 'teacher', 'student']),
      check('important', 'Important must be a boolean').optional().isBoolean()
    ]
  ],
  noticeController.updateNotice
);

// @route   DELETE api/notices/:id
// @desc    Delete a notice
// @access  Private (Admin and original sender)
router.delete('/:id', auth, noticeController.deleteNotice);

module.exports = router;
