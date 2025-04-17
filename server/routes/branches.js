const express = require('express');
const { check } = require('express-validator');
const branchController = require('../controllers/branchController');
const { auth, adminAuth, teacherAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/branches
// @desc    Get all branches
// @access  Private
router.get('/', auth, branchController.getAllBranches);

// @route   GET api/branches/:id
// @desc    Get branch by ID
// @access  Private
router.get('/:id', auth, branchController.getBranchById);

// @route   POST api/branches
// @desc    Create a new branch
// @access  Private (Admin and Teacher)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Branch name is required').not().isEmpty(),
      check('code', 'Branch code is required').not().isEmpty()
    ]
  ],
  branchController.createBranch
);

// @route   PUT api/branches/:id
// @desc    Update a branch
// @access  Private (Admin only)
router.put(
  '/:id',
  [
    auth,
    adminAuth,
    [
      check('name', 'Branch name is required').optional().not().isEmpty(),
      check('code', 'Branch code is required').optional().not().isEmpty()
    ]
  ],
  branchController.updateBranch
);

// @route   DELETE api/branches/:id
// @desc    Delete a branch
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], branchController.deleteBranch);

// @route   GET api/branches/:id/subjects
// @desc    Get all subjects for a branch
// @access  Private
router.get('/:id/subjects', auth, branchController.getBranchSubjects);

module.exports = router;
