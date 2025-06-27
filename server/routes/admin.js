const express = require('express');
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/admin/attendance-stats
// @desc    Get attendance statistics for admin dashboard
// @access  Private (Admin only)
router.get('/attendance-stats', [auth, adminAuth], adminController.getAttendanceStats);

module.exports = router;
