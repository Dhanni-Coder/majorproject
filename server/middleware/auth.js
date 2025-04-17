const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    console.log('Auth middleware - token received:', token ? 'Yes' : 'No');

    // Check if no token
    if (!token) {
      console.log('Auth middleware - no token provided');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - token decoded, user id:', decoded.user.id);

    // Add user from payload
    req.user = await User.findById(decoded.user.id).select('-password');
    console.log('Auth middleware - user found:', req.user ? 'Yes' : 'No', req.user ? `Role: ${req.user.role}` : '');

    if (!req.user) {
      console.log('Auth middleware - user not found');
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid', error: err.message });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    console.log('Admin auth check - user role:', req.user.role);
    if (req.user.role !== 'admin') {
      console.log('Admin auth check - access denied, not an admin');
      return res.status(403).json({ msg: 'Access denied. Admin privileges required' });
    }
    console.log('Admin auth check - access granted');
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Middleware to check if user is teacher
const teacherAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Teacher privileges required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { auth, adminAuth, teacherAuth };
