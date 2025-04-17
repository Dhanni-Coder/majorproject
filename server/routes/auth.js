const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register user and get token
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['student', 'teacher', 'admin'])
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   POST api/auth/login/qr
// @desc    Login with QR code
// @access  Public
router.post(
  '/login/qr',
  [
    check('qrData', 'QR code data is required').not().isEmpty()
  ],
  authController.loginWithQR
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   GET api/auth/qrcode
// @desc    Get user's QR code
// @access  Private
router.get('/qrcode', auth, authController.getQRCode);

// @route   POST api/auth/qrcode/regenerate
// @desc    Regenerate QR code
// @access  Private
router.post('/qrcode/regenerate', auth, authController.regenerateQRCode);

module.exports = router;
