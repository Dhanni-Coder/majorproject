const { validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');

// @route   GET api/subjects
// @desc    Get all subjects
// @access  Private
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('branch', 'name code')
      .populate('createdBy', 'name');

    res.json(subjects);
  } catch (err) {
    console.error('Error fetching subjects:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/subjects/:id
// @desc    Get subject by ID
// @access  Private
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('createdBy', 'name');

    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    res.json(subject);
  } catch (err) {
    console.error('Error fetching subject:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/subjects
// @desc    Create a new subject
// @access  Private (Admin and Teacher)
exports.createSubject = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, code, branch, semester, description, credits } = req.body;

  try {
    // Check if branch exists
    const branchExists = await Branch.findById(branch);

    if (!branchExists) {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    // Check if subject with same code already exists in this branch
    let existingSubject = await Subject.findOne({
      branch,
      code: { $regex: new RegExp(`^${code}$`, 'i') }
    });

    if (existingSubject) {
      return res.status(400).json({ msg: 'Subject with this code already exists in this branch' });
    }

    // Create new subject
    const subject = new Subject({
      name,
      code,
      branch,
      semester,
      description: description || '',
      credits: credits || 3,
      createdBy: req.user.id
    });

    await subject.save();

    // Populate branch and createdBy fields
    const populatedSubject = await Subject.findById(subject._id)
      .populate('branch', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json({
      msg: 'Subject created successfully',
      subject: populatedSubject
    });
  } catch (err) {
    console.error('Error creating subject:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/subjects/:id
// @desc    Update a subject
// @access  Private (Admin and Teacher)
exports.updateSubject = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, code, branch, semester, description, credits } = req.body;

  try {
    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    // Check if user is authorized to update this subject
    if (req.user.role !== 'admin' && subject.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this subject' });
    }

    // If branch is being changed, check if it exists
    if (branch && branch !== subject.branch.toString()) {
      const branchExists = await Branch.findById(branch);

      if (!branchExists) {
        return res.status(404).json({ msg: 'Branch not found' });
      }
    }

    // Check if updated code conflicts with existing subjects in the same branch
    if (code && code !== subject.code) {
      const branchToCheck = branch || subject.branch;

      const existingSubject = await Subject.findOne({
        _id: { $ne: req.params.id },
        branch: branchToCheck,
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      });

      if (existingSubject) {
        return res.status(400).json({ msg: 'Subject with this code already exists in this branch' });
      }
    }

    // Update subject fields
    if (name) subject.name = name;
    if (code) subject.code = code;
    if (branch) subject.branch = branch;
    if (semester) subject.semester = semester;
    if (description !== undefined) subject.description = description;
    if (credits) subject.credits = credits;

    await subject.save();

    // Populate branch and createdBy fields
    const populatedSubject = await Subject.findById(subject._id)
      .populate('branch', 'name code')
      .populate('createdBy', 'name');

    res.json({
      msg: 'Subject updated successfully',
      subject: populatedSubject
    });
  } catch (err) {
    console.error('Error updating subject:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/subjects/branch/:branchId/semester/:semester
// @desc    Get subjects by branch and semester
// @access  Private
exports.getSubjectsByBranchAndSemester = async (req, res) => {
  try {
    const { branchId, semester } = req.params;

    // Validate semester
    const semesterNum = parseInt(semester);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({ msg: 'Invalid semester. Must be a number between 1 and 8' });
    }

    // Find subjects for the specified branch and semester
    const subjects = await Subject.find({
      branch: branchId,
      semester: semesterNum
    }).populate('branch', 'name code');

    res.json(subjects);
  } catch (err) {
    console.error('Error fetching subjects by branch and semester:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/subjects/:id
// @desc    Delete a subject
// @access  Private (Admin and Teacher)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    // Check if user is authorized to delete this subject
    if (req.user.role !== 'admin' && subject.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this subject' });
    }

    await subject.deleteOne();

    res.json({ msg: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Error deleting subject:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Subject not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
