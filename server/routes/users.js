const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, adminAuth, teacherAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET api/users/branch-students
// @desc    Get students from teacher's branch
// @access  Private (Teacher only)
router.get('/branch-students', [auth, teacherAuth], userController.getBranchStudents);

// @route   GET api/users/unassigned-students
// @desc    Get students without a branch assignment
// @access  Private (Teacher only)
router.get('/unassigned-students', [auth, teacherAuth], userController.getUnassignedStudents);

// @route   GET api/users/role/:role
// @desc    Get users by role
// @access  Private (Admin and Teacher)
router.get('/role/:role', [auth, teacherAuth], userController.getUsersByRole);

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', [auth, adminAuth], userController.getAllUsers);

// @route   POST api/users
// @desc    Create a new user (admin only)
// @access  Private (Admin only)
router.post(
  '/',
  [
    auth,
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Invalid role').isIn(['student', 'teacher', 'admin']),
      check('branch', 'Invalid branch').optional().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'])
    ]
  ],
  userController.createUser
);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin and Teacher)
router.get('/:id', [auth, teacherAuth], userController.getUserById);

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put(
  '/:id',
  [
    auth,
    adminAuth,
    [
      check('name', 'Name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('role', 'Invalid role').optional().isIn(['student', 'teacher', 'admin']),
      check('branch', 'Invalid branch').optional().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM', null])
    ]
  ],
  userController.updateUser
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', [auth, adminAuth], userController.deleteUser);

// @route   POST api/users/add-student
// @desc    Add a new student (admin only)
// @access  Private (Admin only)
router.post(
  '/add-student',
  [
    auth,
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('branch', 'Branch is required').not().isEmpty().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM']),
      check('semester', 'Semester must be between 1 and 8').optional().isInt({ min: 1, max: 8 })
    ]
  ],
  userController.addStudent
);

// @route   POST api/users/add-teacher
// @desc    Add a new teacher (admin only)
// @access  Private (Admin only)
router.post(
  '/add-teacher',
  [
    auth,
    adminAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('branch', 'Branch is required').not().isEmpty().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'])
    ]
  ],
  userController.addTeacher
);

// @route   PUT api/users/update-student/:id
// @desc    Update student (Teacher only - limited fields)
// @access  Private (Teacher only)
router.put(
  '/update-student/:id',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('semester', 'Semester must be between 1 and 8').optional().isInt({ min: 1, max: 8 })
    ]
  ],
  userController.updateStudent
);

// @route   DELETE api/users/delete-student/:id
// @desc    Delete student (Teacher only - from their branch)
// @access  Private (Teacher only)
router.delete('/delete-student/:id', [auth, teacherAuth], userController.deleteStudent);

// @route   POST api/users/add-branch-student
// @desc    Add a new student to teacher's branch (Teacher only)
// @access  Private (Teacher only)
router.post(
  '/add-branch-student',
  [
    auth,
    teacherAuth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('semester', 'Semester must be between 1 and 8').optional().isInt({ min: 1, max: 8 })
    ]
  ],
  userController.addBranchStudent
);

// @route   PUT api/users/assign-students
// @desc    Assign students to teacher's branch
// @access  Private (Teacher only)
router.put(
  '/assign-students',
  [
    auth,
    teacherAuth,
    [
      check('studentIds', 'Student IDs are required').isArray(),
      check('semester', 'Semester must be between 1 and 8').optional().isInt({ min: 1, max: 8 })
    ]
  ],
  userController.assignStudentsToBranch
);

// @route   PUT api/users/update-branch
// @desc    Update user's branch (for teachers)
// @access  Private (Teacher only)
router.put(
  '/update-branch',
  [
    auth,
    teacherAuth,
    [
      check('branch', 'Branch is required').not().isEmpty().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'])
    ]
  ],
  userController.updateBranch
);

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, userController.getCurrentUser);

// @route   PUT api/users/update-profile
// @desc    Update user profile
// @access  Private
router.put(
  '/update-profile',
  [
    auth,
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('branch', 'Invalid branch').optional().isIn(['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM', '']),
      check('semester', 'Semester must be between 1 and 8').optional().isInt({ min: 1, max: 8 })
    ]
  ],
  userController.updateProfile
);

// @route   PUT api/users/update-profile-picture
// @desc    Update user profile picture
// @access  Private
router.put('/update-profile-picture', auth, upload.single('profilePicture'), userController.updateProfilePicture);

// @route   GET api/users/by-email/:email
// @desc    Get user by email
// @access  Private (Admin and Teacher)
router.get('/by-email/:email', [auth, teacherAuth], userController.getUserByEmail);

module.exports = router;
