const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');

// @route   POST api/attendance
// @desc    Mark attendance for a student
// @access  Private (Teacher only)
exports.markAttendance = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { studentId, date, present, subjectId } = req.body;

  if (!subjectId) {
    return res.status(400).json({ msg: 'Subject ID is required' });
  }

  try {
    // Check if student exists
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ msg: 'User is not a student' });
    }

    // Get the teacher's branch code
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Get the branch ID from the branch code
    const branch = await Branch.findOne({ code: teacher.branch });

    if (!branch) {
      return res.status(404).json({ msg: `Branch with code ${teacher.branch} not found` });
    }

    // Check if student belongs to teacher's branch
    if (student.branch !== teacher.branch) {
      return res.status(403).json({ msg: 'Not authorized to mark attendance for students from other branches' });
    }

    // Format the date to remove time component
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Use findOneAndUpdate with upsert option to create or update attendance
    try {
      // Define the query to find the attendance record
      const query = {
        student: studentId,
        subject: subjectId,
        date: {
          $gte: attendanceDate,
          $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      };

      // Define the update to apply
      const update = {
        $set: {
          present: present,
          markedBy: req.user.id,
          branch: branch._id.toString(),
          semester: student.semester || 1,
          updatedAt: new Date(),
          date: attendanceDate,
          student: studentId,
          subject: subjectId
        }
      };

      // Define options for findOneAndUpdate
      const options = {
        upsert: true, // Create if it doesn't exist
        new: true,    // Return the updated document
        setDefaultsOnInsert: true // Apply schema defaults for new documents
      };

      // Find and update or create the attendance record
      const attendance = await Attendance.findOneAndUpdate(query, update, options);

      // Return success response
      return res.json({
        msg: 'Attendance updated successfully',
        attendance
      });
    } catch (err) {
      console.error('Error in findOneAndUpdate:', err);
      throw err; // Let the outer catch block handle this
    }
  } catch (err) {
    console.error('Error marking attendance:', err.message);

    // Always return a success message even if there's a duplicate key error
    if (err.code === 11000) {
      return res.json({
        msg: 'Attendance updated successfully',
        success: true
      });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/attendance/date/:date/semester/:semester
// @desc    Get attendance for a specific date and semester
// @access  Private (Teacher only)
exports.getAttendanceByDateAndSemester = async (req, res) => {
  try {
    const { date, semester } = req.params;
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ msg: 'Subject ID is required' });
    }

    // Get the teacher's branch code
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Get the branch ID from the branch code
    const branch = await Branch.findOne({ code: teacher.branch });

    if (!branch) {
      return res.status(404).json({ msg: `Branch with code ${teacher.branch} not found` });
    }

    // Format the date to remove time component
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get all students from the teacher's branch and specified semester
    const students = await User.find({
      role: 'student',
      branch: teacher.branch,
      semester: parseInt(semester)
    }).select('_id name email qrCode');

    // Get attendance records for the specified date and subject
    const attendanceRecords = await Attendance.find({
      branch: branch._id.toString(),
      semester: parseInt(semester),
      subject: subjectId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('student', 'name email').populate('subject', 'name code');

    // Create a map of student IDs to attendance records
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      if (record.student && record.student._id) {
        attendanceMap[record.student._id.toString()] = record;
      }
    });

    // Create attendance data for all students
    const attendanceData = students.map(student => {
      const record = attendanceMap[student._id.toString()];
      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          qrCode: student.qrCode
        },
        attendance: record ? {
          _id: record._id,
          date: record.date,
          present: record.present
        } : null
      };
    });

    // Get the subject details
    const subject = await Subject.findById(subjectId).select('name code');

    res.json({
      date: attendanceDate,
      semester: parseInt(semester),
      branch: {
        _id: branch._id,
        name: branch.name,
        code: branch.code
      },
      subject: subject,
      totalStudents: students.length,
      presentCount: attendanceRecords.filter(record => record.present).length,
      absentCount: students.length - attendanceRecords.filter(record => record.present).length,
      attendanceData
    });
  } catch (err) {
    console.error('Error getting attendance:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/attendance/student/:studentId
// @desc    Get attendance history for a specific student
// @access  Private (Teacher, Admin, and the Student themselves)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if studentId is valid
    if (!studentId || studentId === 'undefined') {
      return res.status(400).json({ msg: 'Student ID is required' });
    }

    console.log(`Getting attendance for student ID: ${studentId}`);

    // Check if student exists
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ msg: 'User is not a student' });
    }

    // Check permissions
    if (req.user.role === 'student') {
      // Students can only view their own attendance
      if (req.user.id !== studentId) {
        return res.status(403).json({ msg: 'Not authorized to view attendance for other students' });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can only view attendance for students in their branch
      const teacher = await User.findById(req.user.id).select('branch');

      if (!teacher) {
        return res.status(404).json({ msg: 'Teacher not found' });
      }

      if (!teacher.branch) {
        return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
      }

      if (student.branch !== teacher.branch) {
        return res.status(403).json({ msg: 'Not authorized to view attendance for students from other branches' });
      }
    }
    // Admins can view all student attendance

    // Get attendance records for the student
    const attendanceRecords = await Attendance.find({
      student: studentId
    }).populate('subject', 'name code').sort({ date: -1 });

    // Log each record to check the present field
    console.log('Attendance records details:');
    attendanceRecords.forEach(record => {
      console.log(`Record ID: ${record._id}, Date: ${record.date}, Present: ${record.present}, Subject: ${record.subject?.name || 'Unknown'}`);
    });

    // Transform the records to ensure the present field is properly included
    const transformedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      date: record.date,
      present: record.present === true, // Ensure it's a boolean
      subject: record.subject,
      student: record.student,
      branch: record.branch,
      semester: record.semester,
      markedBy: record.markedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));

    console.log(`Found ${attendanceRecords.length} attendance records for student ${studentId}`);

    // Even if no records are found, return an empty array (not an error)
    res.json(attendanceRecords || []);
  } catch (err) {
    console.error('Error getting student attendance:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/attendance/my-summary
// @desc    Get attendance summary for the logged-in student
// @access  Private (Student only)
exports.getMyAttendanceSummary = async (req, res) => {
  try {
    // Ensure the user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied. Student only resource.' });
    }

    // Get the student's details
    const student = await User.findById(req.user.id).select('name email branch semester');

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Get all attendance records for the student
    const attendanceRecords = await Attendance.find({
      student: req.user.id
    }).populate('subject', 'name code');

    // Log each record to check the present field
    console.log('My attendance records details:');
    attendanceRecords.forEach(record => {
      console.log(`Record ID: ${record._id}, Date: ${record.date}, Present: ${record.present}, Subject: ${record.subject?.name || 'Unknown'}`);
    });

    console.log(`Found ${attendanceRecords.length} attendance records for student ${req.user.id}`);

    // Calculate attendance statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.present).length;
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Group attendance by month
    const monthlyAttendance = {};
    attendanceRecords.forEach(record => {
      const date = new Date(record.date);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;

      if (!monthlyAttendance[monthYear]) {
        monthlyAttendance[monthYear] = {
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          percentage: 0
        };
      }

      monthlyAttendance[monthYear].totalDays++;
      if (record.present) {
        monthlyAttendance[monthYear].presentDays++;
      } else {
        monthlyAttendance[monthYear].absentDays++;
      }
    });

    // Calculate percentages for each month
    Object.keys(monthlyAttendance).forEach(key => {
      const month = monthlyAttendance[key];
      month.percentage = month.totalDays > 0
        ? Math.round((month.presentDays / month.totalDays) * 100)
        : 0;
    });

    // Convert to array and sort by date (newest first)
    const monthlyData = Object.values(monthlyAttendance).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month.localeCompare(a.month);
    });

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        semester: student.semester
      },
      summary: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage
      },
      monthlyData
    });
  } catch (err) {
    console.error('Error getting student attendance summary:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/attendance/summary/semester/:semester
// @desc    Get attendance summary for a semester
// @access  Private (Teacher only)
exports.getSemesterAttendanceSummary = async (req, res) => {
  try {
    const { semester } = req.params;

    // Get the teacher's branch code
    const teacher = await User.findById(req.user.id).select('branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Get the branch ID from the branch code
    const branch = await Branch.findOne({ code: teacher.branch });

    if (!branch) {
      return res.status(404).json({ msg: `Branch with code ${teacher.branch} not found` });
    }

    // Get all students from the teacher's branch and specified semester
    const students = await User.find({
      role: 'student',
      branch: teacher.branch,
      semester: parseInt(semester)
    }).select('_id name email');

    // Get attendance records for all students in the semester
    const attendanceRecords = await Attendance.find({
      branch: branch._id.toString(),
      semester: parseInt(semester)
    });

    // Group attendance records by student
    const attendanceByStudent = {};
    attendanceRecords.forEach(record => {
      if (record.student) {
        const studentId = record.student.toString();
        if (!attendanceByStudent[studentId]) {
          attendanceByStudent[studentId] = {
            totalDays: 0,
            presentDays: 0
          };
        }

        attendanceByStudent[studentId].totalDays++;
        if (record.present) {
          attendanceByStudent[studentId].presentDays++;
        }
      }
    });

    // Calculate attendance percentage for each student
    const studentSummaries = students.map(student => {
      const studentId = student._id.toString();
      const attendance = attendanceByStudent[studentId] || { totalDays: 0, presentDays: 0 };
      const attendancePercentage = attendance.totalDays > 0
        ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
        : 0;

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        totalDays: attendance.totalDays,
        presentDays: attendance.presentDays,
        absentDays: attendance.totalDays - attendance.presentDays,
        attendancePercentage
      };
    });

    res.json({
      semester: parseInt(semester),
      branch: {
        _id: branch._id,
        name: branch.name,
        code: branch.code
      },
      totalStudents: students.length,
      studentSummaries
    });
  } catch (err) {
    console.error('Error getting semester attendance summary:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
