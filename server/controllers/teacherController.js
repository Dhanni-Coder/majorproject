// Get teacher's students
exports.getTeacherStudents = async (req, res) => {
  try {
    console.log('Teacher ID:', req.user._id);
    
    // First, get the teacher's details
    const teacher = await Teacher.findById(req.user._id)
      .select('branch subjects')
      .lean();

    if (!teacher) {
      console.log('Teacher not found');
      return res.status(404).json({ message: 'Teacher not found' });
    }

    console.log('Teacher found:', teacher);

    // Get all students in the teacher's branch and subjects
    const students = await Student.find({
      branch: teacher.branch,
      semester: { $in: teacher.subjects.map(subject => subject.semester) }
    }).lean();

    console.log(`Found ${students.length} students`);
    res.json(students);

  } catch (err) {
    console.error('getTeacherStudents error:', err);
    res.status(500).json({ 
      message: 'Server error while fetching students',
      error: err.message 
    });
  }
};

// Get teacher's subjects
exports.getTeacherSubjects = async (req, res) => {
  try {
    console.log('Fetching subjects for teacher:', req.user._id);
    
    const subjects = await Subject.find({ 
      teacher: req.user._id 
    }).lean();

    console.log(`Found ${subjects.length} subjects`);
    res.json(subjects);

  } catch (err) {
    console.error('getTeacherSubjects error:', err);
    res.status(500).json({ 
      message: 'Server error while fetching subjects',
      error: err.message 
    });
  }
};

// Get teacher's notices
exports.getTeacherNotices = async (req, res) => {
  try {
    console.log('Fetching notices for teacher:', req.user._id);
    
    const notices = await Notice.find({ 
      createdBy: req.user._id 
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`Found ${notices.length} notices`);
    res.json(notices);

  } catch (err) {
    console.error('getTeacherNotices error:', err);
    res.status(500).json({ 
      message: 'Server error while fetching notices',
      error: err.message 
    });
  }
};

// Get teacher's attendance stats
exports.getTeacherAttendanceStats = async (req, res) => {
  try {
    console.log('Calculating attendance stats for teacher:', req.user._id);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await Attendance.find({
      teacher: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).lean();

    console.log(`Found ${attendanceRecords.length} attendance records`);

    // Process attendance data
    const stats = {
      totalStudents: 0,
      totalPresent: 0,
      totalSessions: 0,
      byDate: {},
      recent: []
    };

    // Group attendance by date
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!stats.byDate[dateStr]) {
        stats.byDate[dateStr] = { present: 0, total: 0 };
        stats.totalSessions++;
      }
      stats.byDate[dateStr].total++;
      if (record.present) {
        stats.byDate[dateStr].present++;
        stats.totalPresent++;
      }
      stats.totalStudents++;
    });

    // Get recent records
    stats.recent = attendanceRecords
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    console.log('Calculated stats:', stats);
    res.json(stats);

  } catch (err) {
    console.error('getTeacherAttendanceStats error:', err);
    res.status(500).json({ 
      message: 'Server error while calculating attendance stats',
      error: err.message 
    });
  }
};
