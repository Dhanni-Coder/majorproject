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

    // CRITICAL FIX: Store the exact date string from the client
    console.log(`Received date string: ${date}`);

    // Store the exact date string for later use
    const exactDateString = typeof date === 'string' ? date.split('T')[0] : String(date);
    console.log(`Exact date string: ${exactDateString}`);

    // Parse the date parts directly
    let attendanceDate;
    let dateParts;

    if (typeof date === 'string') {
      // If it's a string (from client), parse it directly
      dateParts = date.split('T')[0].split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);

        // Create date at noon to avoid timezone issues
        attendanceDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
        console.log(`Parsed date parts: Year=${year}, Month=${month+1}, Day=${day}`);
      } else {
        // Fallback if format is unexpected
        attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        console.log(`Using fallback date parsing for: ${date}`);
      }
    } else {
      // If it's already a Date object
      attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      console.log(`Using Date object: ${attendanceDate.toISOString()}`);
    }

    console.log(`Final attendance date: ${attendanceDate.toISOString()}`);

    // Create start and end of day for date range queries
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // First check if an attendance record already exists for this student, subject, and date
    try {
      // Define the query to find the attendance record
      const query = {
        student: studentId,
        subject: subjectId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };

      // Check if an attendance record already exists
      const existingAttendance = await Attendance.findOne(query);

      if (existingAttendance) {
        console.log(`Attendance record already exists for student ${studentId}, subject ${subjectId}, date ${exactDateString}`);

        // Update the existing record if the present status is different
        if (existingAttendance.present !== present) {
          existingAttendance.present = present;
          existingAttendance.updatedAt = new Date();
          await existingAttendance.save();

          return res.json({
            msg: 'Attendance updated successfully',
            attendance: existingAttendance,
            updated: true
          });
        }

        // If the present status is the same, just return the existing record
        return res.json({
          msg: 'Attendance record already exists with the same status',
          attendance: existingAttendance,
          updated: false
        });
      }

      // If no existing record, create a new one
      const newAttendance = new Attendance({
        student: studentId,
        subject: subjectId,
        date: attendanceDate,
        present: present,
        markedBy: req.user.id,
        branch: branch._id.toString(),
        semester: student.semester || 1,
        exactDate: exactDateString // Store the exact date string
      });

      // Save the new attendance record
      await newAttendance.save();

      // Return success response
      return res.json({
        msg: 'Attendance created successfully',
        attendance: newAttendance,
        created: true
      });
    } catch (err) {
      console.error('Error in attendance operation:', err);

      // Handle duplicate key error (should not happen with our new approach, but just in case)
      if (err.code === 11000) {
        console.log('Duplicate key error detected, attempting to update existing record');

        // Try to find and update the existing record
        try {
          const query = {
            student: studentId,
            subject: subjectId,
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          };

          const existingAttendance = await Attendance.findOne(query);

          if (existingAttendance) {
            existingAttendance.present = present;
            existingAttendance.updatedAt = new Date();
            await existingAttendance.save();

            return res.json({
              msg: 'Attendance updated successfully (recovered from duplicate error)',
              attendance: existingAttendance,
              updated: true
            });
          }
        } catch (recoveryErr) {
          console.error('Error in recovery attempt:', recoveryErr);
        }

        return res.json({
          msg: 'Attendance record already exists',
          success: true
        });
      }

      throw err; // Let the outer catch block handle other errors
    }
  } catch (err) {
    console.error('Error marking attendance:', err.message);
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

    // CRITICAL FIX: Store the exact date string from the client
    console.log(`Received date string: ${date}`);

    // Store the exact date string for later use
    const exactDateString = typeof date === 'string' ? date.split('T')[0] : String(date);
    console.log(`Exact date string: ${exactDateString}`);

    // Parse the date parts directly
    let attendanceDate;
    let dateParts;

    if (typeof date === 'string') {
      // If it's a string (from client), parse it directly
      dateParts = date.split('T')[0].split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);

        // Create date at noon to avoid timezone issues
        attendanceDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
        console.log(`Parsed date parts: Year=${year}, Month=${month+1}, Day=${day}`);
      } else {
        // Fallback if format is unexpected
        attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        console.log(`Using fallback date parsing for: ${date}`);
      }
    } else {
      // If it's already a Date object
      attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      console.log(`Using Date object: ${attendanceDate.toISOString()}`);
    }

    console.log(`Final attendance date: ${attendanceDate.toISOString()}`);

    // Create start and end of day for date range queries
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

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
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('student', 'name email').populate('subject', 'name code');

    console.log(`Found ${attendanceRecords.length} attendance records for date ${attendanceDate.toISOString().split('T')[0]}, semester ${semester}, subject ${subjectId}`);

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

    // CRITICAL FIX: Use the exact date string from the client
    // This ensures we're using the exact same date string that was sent in the request

    // Include both the Date object and the exact date string
    res.json({
      date: attendanceDate,
      dateString: exactDateString, // Use the exact date string from the client
      exactDate: exactDateString, // Add another property for clarity
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

    // Log each record to ensure the present field is properly included
    attendanceRecords.forEach(record => {
      console.log(`Record ID: ${record._id}, Date: ${record.date}, Present: ${record.present === true}, Subject: ${record.subject?.name || 'Unknown'}`);
    });

    console.log(`Found ${attendanceRecords.length} attendance records for student ${studentId}`);

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

    // Return the attendance records along with summary data
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
      monthlyData,
      attendanceRecords
    });
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
      monthlyData,
      attendanceRecords // Include the attendance records in the response
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

// @route   GET api/attendance/teacher-data
// @desc    Get attendance data for the teacher's dashboard
// @access  Private (Teacher only)
exports.getTeacherAttendanceData = async (req, res) => {
  try {
    // Get the teacher's ID and branch
    const teacherId = req.user.id;
    console.log(`Getting dashboard data for teacher: ${teacherId}`);

    // Get the teacher's details
    const teacher = await User.findById(teacherId).select('name email branch');

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    if (!teacher.branch) {
      return res.status(400).json({ msg: 'Teacher does not have an assigned branch' });
    }

    // Get the branch details
    const branch = await Branch.findOne({ code: teacher.branch });

    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    console.log(`Teacher branch: ${teacher.branch}, Branch ID: ${branch._id}`);

    // Get subjects for this branch
    const subjects = await Subject.find({ branch: branch._id });

    if (!subjects || subjects.length === 0) {
      console.log('No subjects found for this branch');
      return res.json({
        subjects: [],
        recentAttendance: [],
        attendanceByDate: {},
        averageAttendance: 0,
        totalStudents: 0,
        totalSubjects: 0
      });
    }

    console.log(`Found ${subjects.length} subjects for branch ${branch.name}`);

    // Get all students from the teacher's branch
    const students = await User.find({
      role: 'student',
      branch: teacher.branch
    }).select('_id name email semester');

    console.log(`Found ${students.length} students in branch ${branch.name}`);

    // Get all attendance records for these subjects
    const subjectIds = subjects.map(subject => subject._id);

    // Get attendance records for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await Attendance.find({
      subject: { $in: subjectIds },
      date: { $gte: thirtyDaysAgo }
    })
    .populate('student', 'name email')
    .populate('subject', 'name code')
    .sort({ date: -1 });

    console.log(`Found ${attendanceRecords.length} attendance records for the last 30 days`);

    // Process attendance data for each subject
    const subjectAttendanceMap = {};
    subjects.forEach(subject => {
      subjectAttendanceMap[subject._id.toString()] = {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        totalRecords: 0,
        presentCount: 0,
        attendancePercentage: 0
      };
    });

    // Process attendance by date
    const attendanceByDate = {};
    const last7Days = [];

    // Generate the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days.push(dateString);
      attendanceByDate[dateString] = 0;
    }

    // Group attendance records by subject and date
    attendanceRecords.forEach(record => {
      const subjectId = record.subject._id.toString();
      const dateString = record.date.toISOString().split('T')[0];

      // Update subject attendance stats
      if (subjectAttendanceMap[subjectId]) {
        subjectAttendanceMap[subjectId].totalRecords++;
        if (record.present) {
          subjectAttendanceMap[subjectId].presentCount++;
        }
      }

      // Update attendance by date (for the last 7 days)
      if (last7Days.includes(dateString)) {
        if (record.present) {
          attendanceByDate[dateString] = (attendanceByDate[dateString] || 0) + 1;
        }
      }
    });

    // Calculate attendance percentage for each subject
    let totalAttendancePercentage = 0;
    let subjectsWithData = 0;

    Object.values(subjectAttendanceMap).forEach(subject => {
      if (subject.totalRecords > 0) {
        subject.attendancePercentage = Math.round((subject.presentCount / subject.totalRecords) * 100);
        totalAttendancePercentage += subject.attendancePercentage;
        subjectsWithData++;
      }
    });

    // Calculate average attendance percentage
    // If we have attendance data, use it to calculate the average
    // Otherwise, default to 0
    const averageAttendance = subjectsWithData > 0
      ? Math.round(totalAttendancePercentage / subjectsWithData)
      : 0;

    console.log(`Average attendance percentage: ${averageAttendance}%`);

    // Get recent attendance records (last 5 days with attendance)
    const recentDates = [...new Set(attendanceRecords.map(record =>
      record.date.toISOString().split('T')[0]
    ))].slice(0, 5);

    const recentAttendance = [];

    for (const dateString of recentDates) {
      const recordsForDate = attendanceRecords.filter(record =>
        record.date.toISOString().split('T')[0] === dateString
      );

      // Group by subject
      const subjectGroups = {};

      recordsForDate.forEach(record => {
        const subjectId = record.subject._id.toString();
        if (!subjectGroups[subjectId]) {
          subjectGroups[subjectId] = {
            _id: `${dateString}-${subjectId}`,
            date: record.date,
            subject: record.subject,
            students: [],
            presentCount: 0,
            totalCount: 0
          };
        }

        subjectGroups[subjectId].students.push({
          student: record.student,
          present: record.present
        });

        subjectGroups[subjectId].totalCount++;
        if (record.present) {
          subjectGroups[subjectId].presentCount++;
        }
      });

      // Add to recent attendance
      Object.values(subjectGroups).forEach(group => {
        recentAttendance.push(group);
      });
    }

    // Prepare the response
    const response = {
      subjects: Object.values(subjectAttendanceMap),
      recentAttendance,
      attendanceByDate,
      averageAttendance,
      totalStudents: students.length,
      totalSubjects: subjects.length
    };

    console.log('Sending teacher dashboard data');
    res.json(response);
  } catch (err) {
    console.error('Error getting teacher attendance data:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/attendance/batch
// @desc    Save batch attendance records
// @access  Private (Teacher only)
exports.saveBatchAttendance = async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ msg: 'Valid attendance records array is required' });
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

    // Process each attendance record
    const results = [];
    const errors = [];

    for (const record of records) {
      const { studentId, date, present, subjectId } = record;

      if (!studentId || !date || present === undefined || !subjectId) {
        errors.push({ record, error: 'Missing required fields' });
        continue;
      }

      try {
        // Check if student exists
        const student = await User.findById(studentId);

        if (!student) {
          errors.push({ record, error: 'Student not found' });
          continue;
        }

        if (student.role !== 'student') {
          errors.push({ record, error: 'User is not a student' });
          continue;
        }

        // Check if student belongs to teacher's branch
        if (student.branch !== teacher.branch) {
          errors.push({ record, error: 'Not authorized to mark attendance for students from other branches' });
          continue;
        }

        // CRITICAL FIX: Store the exact date string from the client
        console.log(`Batch processing - Received date string: ${date}`);

        // Store the exact date string for later use
        const exactDateString = typeof date === 'string' ? date.split('T')[0] : String(date);
        console.log(`Exact date string: ${exactDateString}`);

        // Parse the date parts directly
        let attendanceDate;
        let dateParts;

        if (typeof date === 'string') {
          // If it's a string (from client), parse it directly
          dateParts = date.split('T')[0].split('-');
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[2]);

            // Create date at noon to avoid timezone issues
            attendanceDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
            console.log(`Parsed date parts: Year=${year}, Month=${month+1}, Day=${day}`);
          } else {
            // Fallback if format is unexpected
            attendanceDate = new Date(date);
            attendanceDate.setHours(0, 0, 0, 0);
            console.log(`Using fallback date parsing for: ${date}`);
          }
        } else {
          // If it's already a Date object
          attendanceDate = new Date(date);
          attendanceDate.setHours(0, 0, 0, 0);
          console.log(`Using Date object: ${attendanceDate.toISOString()}`);
        }

        console.log(`Final attendance date: ${attendanceDate.toISOString()}`);

        // Create start and end of day for date range queries
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Define the query to find the attendance record
        const query = {
          student: studentId,
          subject: subjectId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        };

        // Check if an attendance record already exists
        const existingAttendance = await Attendance.findOne(query);

        let attendance;

        if (existingAttendance) {
          console.log(`Batch processing - Attendance record already exists for student ${studentId}, subject ${subjectId}, date ${exactDateString}`);

          // Update the existing record if the present status is different
          if (existingAttendance.present !== present) {
            existingAttendance.present = present;
            existingAttendance.updatedAt = new Date();
            attendance = await existingAttendance.save();
            console.log(`Batch processing - Updated existing attendance record for student ${studentId}`);
          } else {
            // If the present status is the same, just use the existing record
            attendance = existingAttendance;
            console.log(`Batch processing - Existing attendance record has same status for student ${studentId}`);
          }
        } else {
          // If no existing record, create a new one
          const newAttendance = new Attendance({
            student: studentId,
            subject: subjectId,
            date: attendanceDate,
            present: present,
            markedBy: req.user.id,
            branch: branch._id.toString(),
            semester: student.semester || 1,
            exactDate: exactDateString // Store the exact date string
          });

          // Save the new attendance record
          attendance = await newAttendance.save();
          console.log(`Batch processing - Created new attendance record for student ${studentId}`);
        }

        results.push({
          studentId,
          date: attendanceDate,
          present,
          subjectId,
          success: true,
          attendanceId: attendance._id
        });
      } catch (err) {
        console.error(`Error processing attendance record for student ${studentId}:`, err.message);
        errors.push({ record, error: err.message });
      }
    }

    // Return the results
    res.json({
      success: true,
      message: `Successfully processed ${results.length} attendance records with ${errors.length} errors`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error saving batch attendance:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};