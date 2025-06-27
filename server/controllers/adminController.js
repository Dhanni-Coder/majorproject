const User = require('../models/User');
const Branch = require('../models/Branch');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Notice = require('../models/Notice');

// @route   GET api/admin/attendance-stats
// @desc    Get attendance statistics for admin dashboard
// @access  Private (Admin only)
exports.getAttendanceStats = async (req, res) => {
  try {
    // Get all branches
    const branches = await Branch.find();
    
    // Get all attendance records
    const attendanceRecords = await Attendance.find()
      .populate('student', 'name email branch semester')
      .populate('branch', 'name code');
    
    // Initialize data structures
    const attendanceByBranch = {};
    const attendanceBySemester = {};
    const attendanceByBranchAndSemester = {};
    
    // Initialize branch data
    branches.forEach(branch => {
      attendanceByBranch[branch.name] = {
        totalRecords: 0,
        presentCount: 0,
        percentage: 0
      };
      
      attendanceByBranchAndSemester[branch.name] = {};
      
      // Initialize semester data for each branch
      for (let sem = 1; sem <= 8; sem++) {
        attendanceByBranchAndSemester[branch.name][`Semester ${sem}`] = 0;
      }
    });
    
    // Initialize semester data
    for (let sem = 1; sem <= 8; sem++) {
      attendanceBySemester[`Semester ${sem}`] = {
        totalRecords: 0,
        presentCount: 0,
        percentage: 0
      };
    }
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      if (record.branch && record.branch.name && record.student && record.student.semester) {
        const branchName = record.branch.name;
        const semester = record.student.semester;
        const semesterKey = `Semester ${semester}`;
        
        // Update branch attendance
        if (attendanceByBranch[branchName]) {
          attendanceByBranch[branchName].totalRecords++;
          if (record.present) {
            attendanceByBranch[branchName].presentCount++;
          }
        }
        
        // Update semester attendance
        if (attendanceBySemester[semesterKey]) {
          attendanceBySemester[semesterKey].totalRecords++;
          if (record.present) {
            attendanceBySemester[semesterKey].presentCount++;
          }
        }
        
        // Update branch and semester attendance
        if (attendanceByBranchAndSemester[branchName] && 
            attendanceByBranchAndSemester[branchName][semesterKey] !== undefined) {
          // Count records for this branch and semester
          const branchSemRecords = attendanceRecords.filter(r => 
            r.branch && r.branch.name === branchName && 
            r.student && r.student.semester === semester
          );
          
          const totalRecords = branchSemRecords.length;
          const presentCount = branchSemRecords.filter(r => r.present).length;
          
          // Calculate percentage
          attendanceByBranchAndSemester[branchName][semesterKey] = 
            totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
        }
      }
    });
    
    // Calculate percentages for branch attendance
    Object.keys(attendanceByBranch).forEach(branch => {
      const data = attendanceByBranch[branch];
      data.percentage = data.totalRecords > 0 
        ? Math.round((data.presentCount / data.totalRecords) * 100) 
        : 0;
      
      // Replace the object with just the percentage for simpler frontend handling
      attendanceByBranch[branch] = data.percentage;
    });
    
    // Calculate percentages for semester attendance
    Object.keys(attendanceBySemester).forEach(semester => {
      const data = attendanceBySemester[semester];
      data.percentage = data.totalRecords > 0 
        ? Math.round((data.presentCount / data.totalRecords) * 100) 
        : 0;
      
      // Replace the object with just the percentage for simpler frontend handling
      attendanceBySemester[semester] = data.percentage;
    });
    
    res.json({
      attendanceByBranch,
      attendanceBySemester,
      attendanceByBranchAndSemester
    });
  } catch (err) {
    console.error('Error getting attendance stats:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
