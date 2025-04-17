const { validationResult } = require('express-validator');
const User = require('../models/User');
const QRCode = require('qrcode');
const crypto = require('crypto');

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

// @route   POST api/students
// @desc    Create a new student
// @access  Private (Teacher and Admin only)
exports.createStudent = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, branch } = req.body;

  try {
    // Check if student already exists
    let student = await User.findOne({ email });

    if (student) {
      return res.json({
        msg: 'Student already exists',
        student
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 10);

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role: 'student'
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new student
    student = new User({
      name,
      email,
      password: tempPassword, // This will be hashed by the pre-save hook in the User model
      role: 'student',
      branch,
      qrCode,
      qrCodeSecret
    });

    await student.save();

    res.status(201).json({
      msg: 'Student created successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        branch: student.branch,
        tempPassword
      }
    });
  } catch (err) {
    console.error('Create student error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
