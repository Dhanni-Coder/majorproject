const { validationResult } = require('express-validator');
const User = require('../models/User');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Getting all users, user ID:', req.user.id);
    const users = await User.find().select('-password');
    console.log('Found users:', users.length);
    res.json(users);
  } catch (err) {
    console.error('Error getting all users:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(500).send('Server error');
  }
};

// @route   GET api/users/role/:role
// @desc    Get users by role
// @access  Private (Admin and Teacher)
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, role, branch } = req.body;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (branch !== undefined) user.branch = branch;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(500).send('Server error');
  }
};

// @route   POST api/users
// @desc    Create a new user (admin only)
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, branch } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role,
      branch
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      branch,
      qrCode,
      qrCodeSecret
    });

    await user.save();

    res.status(201).json({
      msg: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // If the user is a student, delete their attendance records
    let attendanceRecordsDeleted = 0;
    if (user.role === 'student') {
      console.log(`Deleting attendance records for student: ${user._id}`);
      const Attendance = require('../models/Attendance');
      const deletedAttendance = await Attendance.deleteMany({ student: user._id });
      attendanceRecordsDeleted = deletedAttendance.deletedCount;
      console.log(`Deleted ${attendanceRecordsDeleted} attendance records`);
    }

    // Delete the user
    await user.deleteOne();

    // Return information about deleted records
    res.json({
      msg: 'User removed',
      attendanceRecordsDeleted: user.role === 'student' ? attendanceRecordsDeleted : undefined
    });
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(500).send('Server error');
  }
};

// @route   POST api/users/add-student
// @desc    Add a new student (admin only)
// @access  Private (Admin only)
exports.addStudent = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, branch, semester } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role: 'student',
      branch
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new student
    user = new User({
      name,
      email,
      password,
      role: 'student',
      branch,
      semester: semester || 1,
      qrCode,
      qrCodeSecret
    });

    await user.save();

    res.status(201).json({
      msg: 'Student added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester
      }
    });
  } catch (err) {
    console.error('Add student error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/users/add-teacher
// @desc    Add a new teacher (admin only)
// @access  Private (Admin only)
exports.addTeacher = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, branch } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role: 'teacher',
      branch
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new teacher
    user = new User({
      name,
      email,
      password,
      role: 'teacher',
      branch,
      qrCode,
      qrCodeSecret
    });

    await user.save();

    res.status(201).json({
      msg: 'Teacher added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error('Add teacher error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/users/branch-students
// @desc    Get students from teacher's branch
// @access  Private (Teacher only)
exports.getBranchStudents = async (req, res) => {
  try {
    // Get the teacher's branch
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Find all students from the teacher's branch
    const students = await User.find({
      role: 'student',
      branch: teacher.branch
    }).select('-password').sort({ semester: 1, name: 1 });

    res.json(students);
  } catch (err) {
    console.error('Error getting branch students:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/update-student/:id
// @desc    Update student (Teacher only - limited fields)
// @access  Private (Teacher only)
exports.updateStudent = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, semester } = req.body;

  try {
    // Get the teacher's branch
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    // Find the student
    let student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Check if student belongs to teacher's branch
    if (student.branch !== teacher.branch) {
      return res.status(403).json({ msg: 'Not authorized to update students from other branches' });
    }

    // Check if the user is actually a student
    if (student.role !== 'student') {
      return res.status(400).json({ msg: 'User is not a student' });
    }

    // Update student fields
    if (name) student.name = name;
    if (email) student.email = email;
    if (semester) student.semester = semester;

    await student.save();

    res.json({
      msg: 'Student updated successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        semester: student.semester
      }
    });
  } catch (err) {
    console.error('Update student error:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/users/delete-student/:id
// @desc    Delete student (Teacher only - from their branch)
// @access  Private (Teacher only)
exports.deleteStudent = async (req, res) => {
  try {
    // Get the teacher's branch
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    // Find the student
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Check if student belongs to teacher's branch
    if (student.branch !== teacher.branch) {
      return res.status(403).json({ msg: 'Not authorized to delete students from other branches' });
    }

    // Check if the user is actually a student
    if (student.role !== 'student') {
      return res.status(400).json({ msg: 'User is not a student' });
    }

    // Delete the student's attendance records
    console.log(`Deleting attendance records for student: ${student._id}`);
    const Attendance = require('../models/Attendance');
    const deletedAttendance = await Attendance.deleteMany({ student: student._id });
    console.log(`Deleted ${deletedAttendance.deletedCount} attendance records`);

    // Delete the student
    await student.deleteOne();

    res.json({
      msg: 'Student removed successfully',
      attendanceRecordsDeleted: deletedAttendance.deletedCount
    });
  } catch (err) {
    console.error('Delete student error:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/users/add-branch-student
// @desc    Add a new student to teacher's branch (Teacher only)
// @access  Private (Teacher only)
exports.addBranchStudent = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, semester } = req.body;

  try {
    // Get the teacher's branch
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate QR code secret
    const qrCodeSecret = generateQRSecret();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      email,
      secret: qrCodeSecret,
      role: 'student',
      branch: teacher.branch
    });

    // Generate QR code image
    const qrCode = await generateQRCode(qrCodeData);

    // Create new student with teacher's branch
    user = new User({
      name,
      email,
      password,
      role: 'student',
      branch: teacher.branch,
      semester: semester || 1,
      qrCode,
      qrCodeSecret
    });

    await user.save();

    res.status(201).json({
      msg: 'Student added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        qrCode: user.qrCode // Include QR code in the response
      }
    });
  } catch (err) {
    console.error('Add branch student error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/users/unassigned-students
// @desc    Get students without a branch assignment
// @access  Private (Teacher only)
exports.getUnassignedStudents = async (req, res) => {
  try {
    console.log('Getting unassigned students, user role:', req.user.role);

    // Find all students without a branch or with null branch
    const students = await User.find({
      role: 'student',
      $or: [{ branch: null }, { branch: { $exists: false } }]
    }).select('-password').sort({ name: 1 });

    console.log('Found unassigned students:', students.length);
    res.json(students);
  } catch (err) {
    console.error('Error getting unassigned students:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/assign-students
// @desc    Assign students to teacher's branch
// @access  Private (Teacher only)
exports.assignStudentsToBranch = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { studentIds, semester } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ msg: 'Student IDs are required' });
  }

  try {
    // Get the teacher's branch
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Update all selected students
    const updatePromises = studentIds.map(async (studentId) => {
      const student = await User.findById(studentId);

      if (!student || student.role !== 'student') {
        return { success: false, id: studentId, error: 'Student not found or invalid role' };
      }

      // Update student branch and semester
      student.branch = teacher.branch;
      if (semester) student.semester = semester;

      // Generate new QR code with updated branch info
      const qrCodeSecret = student.qrCodeSecret || generateQRSecret();

      // Create QR code data
      const qrCodeData = JSON.stringify({
        email: student.email,
        secret: qrCodeSecret,
        role: 'student',
        branch: teacher.branch
      });

      // Generate QR code image
      student.qrCode = await generateQRCode(qrCodeData);
      student.qrCodeSecret = qrCodeSecret;

      await student.save();

      return {
        success: true,
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        semester: student.semester
      };
    });

    const results = await Promise.all(updatePromises);

    const successCount = results.filter(r => r.success).length;

    res.json({
      msg: `${successCount} students assigned to ${teacher.branch} branch`,
      results
    });
  } catch (err) {
    console.error('Assign students error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error getting current user:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/users/update-profile
// @desc    Update user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, branch, semester } = req.body;
    console.log('Update profile request received:', { name, email, branch, semester });

    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      console.error('User not found with ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    // Only allow admins to change email
    if (email && email !== user.email) {
      // Check if user is admin
      if (user.role !== 'admin') {
        console.log('Non-admin user attempted to change email:', user.id);
        return res.status(403).json({ msg: 'Only administrators can change email addresses' });
      }

      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Email already in use by another account' });
      }
    }

    // Update user fields
    if (name) user.name = name;
    // Only update email if user is admin
    if (email && user.role === 'admin') user.email = email;
    if (branch !== undefined) user.branch = branch;
    if (semester !== undefined && user.role === 'student') user.semester = semester;

    console.log('Updating user with data:', {
      name: user.name,
      email: user.email,
      branch: user.branch,
      semester: user.semester
    });

    await user.save();
    console.log('User updated successfully');

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/users/update-profile-picture
// @desc    Update user profile picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    console.log('Update profile picture request received');

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file);

    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('User found:', user.email);

    // Make sure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory:', uploadsDir);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // If user already has a profile picture, delete the old one
    if (user.profilePicture) {
      try {
        const oldPicturePath = path.join(__dirname, '..', user.profilePicture.replace(/^\/?uploads/, 'uploads'));
        console.log('Checking for old profile picture:', oldPicturePath);
        if (fs.existsSync(oldPicturePath)) {
          console.log('Deleting old profile picture');
          fs.unlinkSync(oldPicturePath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue even if old picture deletion fails
      }
    }

    // Set the new profile picture path
    user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    console.log('New profile picture path:', user.profilePicture);

    await user.save();
    console.log('User saved with new profile picture');

    res.json({
      msg: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
  } catch (err) {
    console.error('Update profile picture error:', err);
    res.status(500).json({
      msg: 'Server error',
      error: err.message,
      stack: err.stack
    });
  }
};

// @route   PUT api/users/update-branch
// @desc    Update user's branch (for teachers)
// @access  Private (Teacher only)
exports.updateBranch = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { branch } = req.body;

  if (!branch) {
    return res.status(400).json({ msg: 'Branch is required' });
  }

  // Validate branch
  const validBranches = ['CSE', 'IT', 'ME', 'MEA', 'CE', 'EE', 'PHARM'];
  if (!validBranches.includes(branch)) {
    return res.status(400).json({ msg: 'Invalid branch' });
  }

  try {
    // Get the user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Only teachers can update their branch
    if (user.role !== 'teacher') {
      return res.status(403).json({ msg: 'Only teachers can update their branch' });
    }

    // Update branch
    user.branch = branch;

    // If the user has a QR code, update it with the new branch
    if (user.qrCodeSecret) {
      // Create QR code data
      const qrCodeData = JSON.stringify({
        email: user.email,
        secret: user.qrCodeSecret,
        role: user.role,
        branch: branch
      });

      // Generate QR code image
      user.qrCode = await generateQRCode(qrCodeData);
    }

    await user.save();

    res.json({
      msg: 'Branch updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });
  } catch (err) {
    console.error('Update branch error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/users/by-email/:email
// @desc    Get user by email
// @access  Private (Admin and Teacher)
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .select('-password -qrCode -qrCodeSecret');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user by email:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};