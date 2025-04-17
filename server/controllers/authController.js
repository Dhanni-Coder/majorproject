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

    console.log('Login successful for user:', user.id);

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

// @route   POST api/auth/login/qr
// @desc    Login with QR code
// @access  Public
exports.loginWithQR = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { qrData } = req.body;

  try {
    console.log('QR Login attempt with data:', qrData);

    // Parse QR code data
    let userData;
    try {
      userData = JSON.parse(qrData);
    } catch (parseError) {
      console.error('QR data parsing error:', parseError);
      return res.status(400).json({ msg: 'Invalid QR code format' });
    }

    const { email, secret } = userData;

    if (!email || !secret) {
      return res.status(400).json({ msg: 'Invalid QR code data' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid QR code' });
    }

    // Verify QR code secret
    if (user.qrCodeSecret !== secret) {
      return res.status(400).json({ msg: 'Invalid QR code' });
    }

    console.log('QR Login successful for user:', user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('QR Login error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    // Get user from database (excluding password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
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

    // Generate new QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email: user.email,
      secret: qrCodeSecret,
      role: user.role
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Update user with new QR code
    user.qrCode = qrCode;
    user.qrCodeSecret = qrCodeSecret;
    await user.save();

    console.log('QR code regenerated for user:', user.id);

    // Return new QR code
    res.json({ qrCode });
  } catch (err) {
    console.error('Regenerate QR code error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
