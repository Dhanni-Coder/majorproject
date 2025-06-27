const { validationResult } = require('express-validator');
const Notice = require('../models/Notice');
const User = require('../models/User');

// @route   POST api/notices
// @desc    Create a new notice
// @access  Private (Admin and Teacher)
exports.createNotice = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content, targetRole, important } = req.body;

  try {
    // Check if user is authorized to send notices to the target role
    if (req.user.role === 'teacher' && targetRole === 'teacher') {
      return res.status(403).json({ msg: 'Teachers cannot send notices to other teachers' });
    }

    // Create new notice
    const notice = new Notice({
      title,
      content,
      sender: req.user.id,
      targetRole: targetRole || 'all',
      important: important || false
    });

    await notice.save();

    // Populate sender information
    const populatedNotice = await Notice.findById(notice._id).populate('sender', 'name role');

    res.status(201).json({
      msg: 'Notice created successfully',
      notice: populatedNotice
    });
  } catch (err) {
    console.error('Create notice error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/notices
// @desc    Get all notices for the current user's role
// @access  Private
exports.getNotices = async (req, res) => {
  try {
    let query = {};

    // Filter notices based on user role
    if (req.user.role === 'student') {
      // Students can see notices targeted to students or all
      query = { $or: [{ targetRole: 'student' }, { targetRole: 'all' }] };
    } else if (req.user.role === 'teacher') {
      // Teachers can see notices targeted to teachers, students, or all
      query = { $or: [{ targetRole: 'teacher' }, { targetRole: 'student' }, { targetRole: 'all' }] };
    }
    // Admins can see all notices

    // Get notices
    const notices = await Notice.find(query)
      .populate('sender', 'name role')
      .sort({ date: -1 });

    res.json(notices);
  } catch (err) {
    console.error('Get notices error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/notices/:id
// @desc    Get a notice by ID
// @access  Private
exports.getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('sender', 'name role');

    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    // Check if user is authorized to view this notice
    if (req.user.role === 'student' &&
        notice.targetRole !== 'student' &&
        notice.targetRole !== 'all') {
      return res.status(403).json({ msg: 'Not authorized to view this notice' });
    }

    if (req.user.role === 'teacher' &&
        notice.targetRole !== 'teacher' &&
        notice.targetRole !== 'student' &&
        notice.targetRole !== 'all') {
      return res.status(403).json({ msg: 'Not authorized to view this notice' });
    }

    res.json(notice);
  } catch (err) {
    console.error('Get notice by ID error:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/notices/:id
// @desc    Update a notice
// @access  Private (Admin and original sender)
exports.updateNotice = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content, targetRole, important } = req.body;

  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    // Check if user is authorized to update this notice
    const isAdmin = req.user.role === 'admin';
    const isOriginalSender = notice.sender.toString() === req.user.id;
    const isTeacherEditingStudentNotice = req.user.role === 'teacher' && notice.targetRole === 'student';

    // Log detailed authorization info for debugging
    console.log('Authorization check details:', {
      userId: req.user.id,
      userRole: req.user.role,
      noticeSenderId: notice.sender.toString(),
      noticeTargetRole: notice.targetRole,
      isAdmin,
      isOriginalSender,
      isTeacherEditingStudentNotice,
      authorized: isAdmin || isOriginalSender || isTeacherEditingStudentNotice
    });

    if (!isAdmin && !isOriginalSender && !isTeacherEditingStudentNotice) {
      return res.status(403).json({
        msg: 'Not authorized to update this notice',
        details: {
          userRole: req.user.role,
          noticeTargetRole: notice.targetRole,
          isOriginalSender: isOriginalSender
        }
      });
    }

    // Log authorization details for debugging
    console.log('Notice update authorization:', {
      userId: req.user.id,
      userRole: req.user.role,
      noticeSender: notice.sender.toString(),
      noticeTargetRole: notice.targetRole,
      isAdmin,
      isOriginalSender,
      isTeacherEditingStudentNotice
    });

    // Check if teacher is trying to change target role to teachers
    if (req.user.role === 'teacher' && targetRole === 'teacher') {
      return res.status(403).json({ msg: 'Teachers cannot send notices to other teachers' });
    }

    // Update notice - use direct assignment instead of || operator
    notice.title = title !== undefined ? title : notice.title;
    notice.content = content !== undefined ? content : notice.content;

    // Allow changing target role based on user role
    if (req.user.role === 'admin') {
      // Admins can change to any target role
      notice.targetRole = targetRole !== undefined ? targetRole : notice.targetRole;
    } else if (req.user.role === 'teacher') {
      // Teachers can only set target role to 'student'
      if (targetRole === 'student') {
        notice.targetRole = targetRole;
      }
    }

    // Handle important flag properly
    notice.important = important !== undefined ? important : notice.important;

    // Log the updated notice for debugging
    console.log('Updated notice:', {
      title: notice.title,
      content: notice.content,
      targetRole: notice.targetRole,
      important: notice.important
    });

    await notice.save();

    // Populate sender information
    const populatedNotice = await Notice.findById(notice._id).populate('sender', 'name role');

    res.json({
      msg: 'Notice updated successfully',
      notice: populatedNotice
    });
  } catch (err) {
    console.error('Update notice error:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/notices/:id
// @desc    Delete a notice
// @access  Private (Admin and original sender)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    // Check if user is authorized to delete this notice
    const isAdmin = req.user.role === 'admin';
    const isOriginalSender = notice.sender.toString() === req.user.id;
    const isTeacherDeletingStudentNotice = req.user.role === 'teacher' && notice.targetRole === 'student';

    if (!isAdmin && !isOriginalSender && !isTeacherDeletingStudentNotice) {
      return res.status(403).json({ msg: 'Not authorized to delete this notice' });
    }

    // Log authorization details for debugging
    console.log('Notice delete authorization:', {
      userId: req.user.id,
      userRole: req.user.role,
      noticeSender: notice.sender.toString(),
      noticeTargetRole: notice.targetRole,
      isAdmin,
      isOriginalSender,
      isTeacherDeletingStudentNotice
    });

    await Notice.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Delete notice error:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notice not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/notices/stats
// @desc    Get notice statistics for a teacher
// @access  Private
exports.getNoticeStats = async (req, res) => {
  try {
    const { teacherId } = req.query;

    console.log(`Getting notice stats for teacher: ${teacherId}`);

    if (!teacherId) {
      return res.status(400).json({ msg: 'Teacher ID is required' });
    }

    // Get total notices
    const total = await Notice.countDocuments({ sender: teacherId });

    // Get notices created this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newThisWeek = await Notice.countDocuments({
      sender: teacherId,
      date: { $gte: oneWeekAgo }
    });

    console.log(`Found ${total} total notices and ${newThisWeek} new notices this week`);

    res.json({ total, newThisWeek });
  } catch (err) {
    console.error('Get notice stats error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};