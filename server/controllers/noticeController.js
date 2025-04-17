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
      // Teachers can see notices targeted to teachers or all
      query = { $or: [{ targetRole: 'teacher' }, { targetRole: 'all' }] };
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
    if (req.user.role !== 'admin' && notice.sender.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this notice' });
    }

    // Check if teacher is trying to change target role to teachers
    if (req.user.role === 'teacher' && targetRole === 'teacher') {
      return res.status(403).json({ msg: 'Teachers cannot send notices to other teachers' });
    }

    // Update notice
    notice.title = title || notice.title;
    notice.content = content || notice.content;

    // Only allow changing target role if user is admin
    if (req.user.role === 'admin') {
      notice.targetRole = targetRole || notice.targetRole;
    }

    notice.important = important !== undefined ? important : notice.important;

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
    if (req.user.role !== 'admin' && notice.sender.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this notice' });
    }

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
