const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');

// Generate a random string for QR code secret
const generateQRSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate QR code image as data URL
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { user: { id: user.id, role: user.role } },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST api/auth/register
// @desc    Register user and get token
// @access  Public
exports.register = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    console.log('Registration attempt:', { name, email, role });

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data (contains user email and secret)
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      qrCode,
      qrCodeSecret
    });

    // Save user to database
    await user.save();
    console.log('User saved to database:', user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        qrCode: user.qrCode
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    console.log('Login attempt:', { email });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Update last login time and activity
    user.lastLogin = new Date();
    user.lastActivity = 'Logged in via password';
    await user.save();

    console.log('Login successful for user:', user.id, 'at', user.lastLogin);

    // Generate JWT token
    const token = generateToken(user);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        qrCode: user.qrCode
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * @route   POST api/auth/login/qr
 * @desc    Login with QR code
 * @access  Public
 */
exports.loginWithQR = async (req, res) => {
  try {
    // Validate request
    const validationErrors = validateQRLoginRequest(req);
    if (validationErrors) {
      return res.status(400).json(validationErrors);
    }

    // Process and validate QR data
    const { qrData } = req.body;
    const userData = await processQRData(qrData);

    if (!userData) {
      return res.status(400).json({ msg: 'Invalid QR code format or data' });
    }

    // Authenticate user with QR data
    const { user, error } = await authenticateWithQR(userData);

    if (error) {
      return res.status(400).json({ msg: error });
    }

    // Update last login time and activity
    user.lastLogin = new Date();
    user.lastActivity = 'Logged in via QR code';
    await user.save();

    // Log successful login
    console.log(`QR Login successful for user: ${user.id}, ${user.name}, ${user.email} at ${user.lastLogin}`);

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;

        // Return token and user data
        res.json({
          token,
          user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            branch: user.branch,
            semester: user.semester,
            rollNumber: user.rollNumber,
            profilePicture: user.profilePicture
          }
        });
      }
    );
  } catch (err) {
    console.error('QR Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Validate QR login request
 * @param {Object} req - Express request object
 * @returns {Object|null} Validation errors or null if valid
 */
const validateQRLoginRequest = (req) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { errors: errors.array() };
  }

  // Check if qrData exists in request body
  if (!req.body.qrData) {
    return { msg: 'QR code data is required' };
  }

  return null;
};

/**
 * Process and validate QR code data
 * @param {string|Object} qrData - Raw QR code data
 * @returns {Object|null} Processed QR data or null if invalid
 */
const processQRData = async (qrData) => {
  console.log('Processing QR data type:', typeof qrData);

  try {
    // If qrData is a string, try to parse it as JSON
    if (typeof qrData === 'string') {
      try {
        return JSON.parse(qrData);
      } catch (parseError) {
        console.error('QR data parsing error:', parseError);
        return null;
      }
    }

    // If qrData is already an object, use it directly
    if (typeof qrData === 'object' && qrData !== null) {
      return qrData;
    }

    // Invalid data type
    console.error('Invalid QR data type:', typeof qrData);
    return null;
  } catch (err) {
    console.error('Error processing QR data:', err);
    return null;
  }
};

/**
 * Authenticate user with QR code data
 * @param {Object} userData - Processed QR code data
 * @returns {Object} Authentication result with user or error
 */
const authenticateWithQR = async (userData) => {
  try {
    const { email, secret } = userData;

    // Validate required fields
    if (!email || !secret) {
      return {
        error: 'Invalid QR code data: missing email or secret',
        user: null
      };
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return {
        error: 'Invalid QR code: user not found',
        user: null
      };
    }

    // Verify QR code secret
    if (!user.qrCodeSecret) {
      console.log(`User ${user.id} has no QR code secret`);
      return {
        error: 'QR code not set up for this user',
        user: null
      };
    }

    if (user.qrCodeSecret !== secret) {
      console.log(`QR code secret mismatch for user ${user.id}`);
      return {
        error: 'Invalid QR code: secret mismatch',
        user: null
      };
    }

    // Authentication successful
    return { user, error: null };
  } catch (err) {
    console.error('Error authenticating with QR:', err);
    return {
      error: 'Authentication error',
      user: null
    };
  }
};



// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('Getting current user with ID:', req.user.id);

    // Get user from database (excluding password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      console.error('User not found with ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('User found:', user.email);

    // Return all user fields
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      rollNumber: user.rollNumber,
      profilePicture: user.profilePicture,
      qrCode: user.qrCode,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      lastActivity: user.lastActivity
    });
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/auth/qrcode
// @desc    Get user's QR code
// @access  Private
exports.getQRCode = async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Return QR code
    res.json({ qrCode: user.qrCode });
  } catch (err) {
    console.error('Get QR code error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/auth/qrcode/regenerate
// @desc    Regenerate QR code
// @access  Private
exports.regenerateQRCode = async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(`Regenerating QR code for user: ${user.id}, ${user.name}, ${user.email}`);

    // Generate new QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data - simplified format for better compatibility
    const qrCodeData = JSON.stringify({
      email: user.email,
      secret: qrCodeSecret
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Update user with new QR code
    user.qrCode = qrCode;
    user.qrCodeSecret = qrCodeSecret;
    await user.save();

    console.log(`QR code regenerated successfully for user: ${user.id}`);

    // Return QR code
    res.json({
      qrCode,
      message: 'QR code regenerated successfully'
    });
  } catch (err) {
    console.error('Regenerate QR code error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
