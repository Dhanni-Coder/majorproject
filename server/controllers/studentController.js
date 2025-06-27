const { validationResult } = require('express-validator');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const BookIssue = require('../models/BookIssue');
const Notice = require('../models/Notice');
const Branch = require('../models/Branch');
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
// @route   GET api/students/dashboard
// @desc    Get student dashboard data
// @access  Private (Student only)
exports.getStudentDashboard = async (req, res) => {
  try {
    // Get the current student
    const student = await User.findById(req.user.id);

    if (!student || student.role !== 'student') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    console.log('Student found:', student.name, 'Branch:', student.branch, 'Semester:', student.semester);

    // Initialize variables with default empty values
    let attendanceData = [];
    let subjects = [];
    let borrowedBooks = [];
    let notices = [];
    let branch = null;

    try {
      // Get attendance data
      attendanceData = await Attendance.find({ student: req.user.id })
        .populate('subject', 'name code')
        .sort({ date: -1 });

      console.log('Attendance data found:', attendanceData.length, 'records');
    } catch (err) {
      console.error('Error fetching attendance data:', err.message);
      // Continue execution with empty attendance data
    }

    try {
      // Get the branch ID for the student's branch code
      if (student.branch) {
        branch = await Branch.findOne({ code: student.branch });
        console.log('Branch found:', branch ? branch.name : 'None');
      }
    } catch (err) {
      console.error('Error fetching branch:', err.message);
      // Continue execution with null branch
    }

    try {
      // Get subjects for the student's branch and semester
      const query = { semester: student.semester };
      if (branch) {
        query.branch = branch._id;
      }

      subjects = await Subject.find(query);
      console.log('Subjects found:', subjects.length);
    } catch (err) {
      console.error('Error fetching subjects:', err.message);
      // Continue execution with empty subjects
    }

    try {
      // Get borrowed books
      borrowedBooks = await BookIssue.find({
        student: req.user.id,
        status: { $in: ['issued', 'overdue'] }
      })
      .populate('book', 'title author isbn coverImage')
      .sort({ dueDate: 1 });

      console.log('Borrowed books found:', borrowedBooks.length);
    } catch (err) {
      console.error('Error fetching borrowed books:', err.message);
      // Continue execution with empty borrowed books
    }

    try {
      // Get recent notices
      notices = await Notice.find({
        $or: [
          { targetRole: 'all' },
          { targetRole: 'student' }
        ]
      })
      .sort({ date: -1 })
      .limit(5);

      console.log('Notices found:', notices.length);
    } catch (err) {
      console.error('Error fetching notices:', err.message);
      // Continue execution with empty notices
    }

    // Process attendance data by subject
    const attendanceBySubject = {};

    // Initialize with subjects from the database
    subjects.forEach(subject => {
      if (subject && subject.name) {
        attendanceBySubject[subject.name] = { present: 0, total: 0 };
      }
    });

    // Add attendance data
    attendanceData.forEach(record => {
      if (record.subject && record.subject.name) {
        const subjectName = record.subject.name;
        if (!attendanceBySubject[subjectName]) {
          attendanceBySubject[subjectName] = { present: 0, total: 0 };
        }
        attendanceBySubject[subjectName].total += 1;
        if (record.present) {
          attendanceBySubject[subjectName].present += 1;
        }
      }
    });

    // If no subjects found, add some sample data
    if (Object.keys(attendanceBySubject).length === 0) {
      attendanceBySubject['Mathematics'] = { present: 0, total: 0 };
      attendanceBySubject['Physics'] = { present: 0, total: 0 };
      attendanceBySubject['Computer Science'] = { present: 0, total: 0 };
    }

    console.log('Processed attendance by subject:', Object.keys(attendanceBySubject).length, 'subjects');

    // Process attendance data by month
    const attendanceByMonth = {};
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Add attendance data by month
    attendanceData.forEach(record => {
      try {
        const date = new Date(record.date);
        const monthName = months[date.getMonth()];

        if (!attendanceByMonth[monthName]) {
          attendanceByMonth[monthName] = { present: 0, total: 0 };
        }

        attendanceByMonth[monthName].total += 1;
        if (record.present) {
          attendanceByMonth[monthName].present += 1;
        }
      } catch (err) {
        console.error('Error processing attendance record:', err.message);
      }
    });

    // If no months found, add current month with empty data
    if (Object.keys(attendanceByMonth).length === 0) {
      const currentMonth = months[new Date().getMonth()];
      attendanceByMonth[currentMonth] = { present: 0, total: 0 };
    }

    console.log('Processed attendance by month:', Object.keys(attendanceByMonth).length, 'months');

    // Get recent attendance (last 5 records)
    const recentAttendance = attendanceData.slice(0, 5);

    // Check for overdue books
    const today = new Date();
    borrowedBooks.forEach(book => {
      try {
        if (new Date(book.dueDate) < today && book.status === 'issued') {
          book.status = 'overdue';
        }
      } catch (err) {
        console.error('Error processing book due date:', err.message);
      }
    });

    // Return dashboard data
    const dashboardData = {
      attendanceBySubject,
      attendanceByMonth,
      recentAttendance,
      borrowedBooks,
      totalSubjects: subjects.length,
      totalNotices: notices.length
    };

    console.log('Returning dashboard data');
    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching student dashboard data:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

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
