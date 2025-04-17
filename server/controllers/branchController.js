const { validationResult } = require('express-validator');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');

// @route   GET api/branches
// @desc    Get all branches
// @access  Private
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate('createdBy', 'name');
    res.json(branches);
  } catch (err) {
    console.error('Error fetching branches:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/branches/:id
// @desc    Get branch by ID
// @access  Private
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('createdBy', 'name');
    
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (err) {
    console.error('Error fetching branch:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/branches
// @desc    Create a new branch
// @access  Private (Admin and Teacher)
exports.createBranch = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, code, description } = req.body;
  
  try {
    // Check if branch with same name or code already exists
    let existingBranch = await Branch.findOne({ 
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: { $regex: new RegExp(`^${code}$`, 'i') } }
      ]
    });
    
    if (existingBranch) {
      return res.status(400).json({ msg: 'Branch with this name or code already exists' });
    }
    
    // Create new branch
    const branch = new Branch({
      name,
      code,
      description,
      createdBy: req.user.id
    });
    
    await branch.save();
    
    // Populate createdBy field
    const populatedBranch = await Branch.findById(branch._id).populate('createdBy', 'name');
    
    res.status(201).json({
      msg: 'Branch created successfully',
      branch: populatedBranch
    });
  } catch (err) {
    console.error('Error creating branch:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/branches/:id
// @desc    Update a branch
// @access  Private (Admin only)
exports.updateBranch = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, code, description } = req.body;
  
  try {
    let branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    // Check if updated name or code conflicts with existing branches
    if (name || code) {
      const query = {
        _id: { $ne: req.params.id },
        $or: []
      };
      
      if (name) {
        query.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }
      
      if (code) {
        query.$or.push({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      }
      
      if (query.$or.length > 0) {
        const existingBranch = await Branch.findOne(query);
        
        if (existingBranch) {
          return res.status(400).json({ msg: 'Branch with this name or code already exists' });
        }
      }
    }
    
    // Update branch fields
    if (name) branch.name = name;
    if (code) branch.code = code;
    if (description !== undefined) branch.description = description;
    
    await branch.save();
    
    // Populate createdBy field
    const populatedBranch = await Branch.findById(branch._id).populate('createdBy', 'name');
    
    res.json({
      msg: 'Branch updated successfully',
      branch: populatedBranch
    });
  } catch (err) {
    console.error('Error updating branch:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/branches/:id
// @desc    Delete a branch
// @access  Private (Admin only)
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    // Check if branch has subjects
    const subjectsCount = await Subject.countDocuments({ branch: req.params.id });
    
    if (subjectsCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete branch with subjects. Please delete all subjects in this branch first.' 
      });
    }
    
    await branch.deleteOne();
    
    res.json({ msg: 'Branch deleted successfully' });
  } catch (err) {
    console.error('Error deleting branch:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/branches/:id/subjects
// @desc    Get all subjects for a branch
// @access  Private
exports.getBranchSubjects = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    const subjects = await Subject.find({ branch: req.params.id })
      .populate('createdBy', 'name')
      .sort({ semester: 1, name: 1 });
    
    res.json(subjects);
  } catch (err) {
    console.error('Error fetching branch subjects:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
