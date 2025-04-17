const express = require('express');
const { check } = require('express-validator');
const subjectController = require('../controllers/subjectController');
const { auth, teacherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/subjects
// @desc    Get all subjects
// @access  Private
router.get('/', auth, subjectController.getAllSubjects);

// @route   GET api/subjects/branch/:branchId/semester/:semester
// @desc    Get subjects by branch and semester
// @access  Private
router.get('/branch/:branchId/semester/:semester', auth, subjectController.getSubjectsByBranchAndSemester);

// @route   GET api/subjects/:id
// @desc    Get subject by ID
// @access  Private
router.get('/:id', auth, subjectController.getSubjectById);

// @route   POST api/subjects
// @desc    Create a new subject
// @access  Private (Admin and Teacher)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Subject name is required').not().isEmpty(),
      check('code', 'Subject code is required').not().isEmpty(),
      check('branch', 'Branch is required').not().isEmpty().isMongoId(),
      check('semester', 'Semester must be a number between 1 and 8').isInt({ min: 1, max: 8 })
    ]
  ],
  subjectController.createSubject
);

// @route   PUT api/subjects/:id
// @desc    Update a subject
// @access  Private (Admin and Teacher)
router.put(
  '/:id',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Subject name is required').optional().not().isEmpty(),
      check('code', 'Subject code is required').optional().not().isEmpty(),
      check('branch', 'Branch is required').optional().isMongoId(),
      check('semester', 'Semester must be a number between 1 and 8').optional().isInt({ min: 1, max: 8 }),
      check('credits', 'Credits must be a positive number').optional().isInt({ min: 1 })
    ]
  ],
  subjectController.updateSubject
);

// @route   DELETE api/subjects/:id
// @desc    Delete a subject
// @access  Private (Admin and Teacher)
router.delete('/:id', [auth, teacherAuth], subjectController.deleteSubject);

module.exports = router;
