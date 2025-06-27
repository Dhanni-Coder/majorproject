const { validationResult } = require('express-validator');
const BookIssue = require('../models/BookIssue');
const Book = require('../models/Book');
const User = require('../models/User');

// @route   GET api/book-issues
// @desc    Get all book issues
// @access  Private (Admin and Teacher)
exports.getAllBookIssues = async (req, res) => {
  try {
    const { status, student } = req.query;

    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by student if provided
    if (student) {
      query.student = student;
    }

    // For teachers, only show issues they created
    if (req.user.role === 'teacher') {
      query.issuedBy = req.user.id;
    }

    const bookIssues = await BookIssue.find(query)
      .populate('book', 'title author isbn coverImage')
      .populate('student', 'name email branch')
      .populate('issuedBy', 'name role')
      .sort({ issueDate: -1 });

    res.json(bookIssues);
  } catch (err) {
    console.error('Error fetching book issues:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/book-issues/student
// @desc    Get book issues for the current student
// @access  Private (Student)
exports.getStudentBookIssues = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { student: req.user.id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const bookIssues = await BookIssue.find(query)
      .populate('book', 'title author isbn coverImage')
      .populate('issuedBy', 'name role')
      .sort({ issueDate: -1 });

    res.json(bookIssues);
  } catch (err) {
    console.error('Error fetching student book issues:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/book-issues/:id
// @desc    Get book issue by ID
// @access  Private
exports.getBookIssueById = async (req, res) => {
  try {
    const bookIssue = await BookIssue.findById(req.params.id)
      .populate('book', 'title author isbn coverImage')
      .populate('student', 'name email branch')
      .populate('issuedBy', 'name role');

    if (!bookIssue) {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    // Check if user is authorized to view this book issue
    if (
      req.user.role === 'student' &&
      bookIssue.student._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this book issue' });
    }

    if (
      req.user.role === 'teacher' &&
      bookIssue.issuedBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this book issue' });
    }

    res.json(bookIssue);
  } catch (err) {
    console.error('Error fetching book issue:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/book-issues
// @desc    Issue a book to a student
// @access  Private (Admin and Teacher)
exports.issueBook = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { bookId, studentId, dueDate, notes } = req.body;

  try {
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    // Check if book is available
    if (book.availableQuantity <= 0) {
      return res.status(400).json({ msg: 'Book is not available for issue' });
    }

    // Check if student exists and is a student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ msg: 'User is not a student' });
    }

    // Check if student already has this book issued
    const existingIssue = await BookIssue.findOne({
      book: bookId,
      student: studentId,
      status: 'issued'
    });

    if (existingIssue) {
      return res.status(400).json({ msg: 'Student already has this book issued' });
    }

    // Check if student has reached the maximum limit of 5 books
    const issuedBooksCount = await BookIssue.countDocuments({
      student: studentId,
      status: 'issued'
    });

    if (issuedBooksCount >= 5) {
      return res.status(400).json({ msg: 'Student has already issued the maximum limit of 5 books' });
    }

    // Create new book issue
    const bookIssue = new BookIssue({
      book: bookId,
      student: studentId,
      issuedBy: req.user.id,
      dueDate: new Date(dueDate),
      notes: notes || ''
    });

    // Update book available quantity
    book.availableQuantity -= 1;
    await book.save();

    await bookIssue.save();

    // Populate book issue fields
    const populatedBookIssue = await BookIssue.findById(bookIssue._id)
      .populate('book', 'title author isbn coverImage')
      .populate('student', 'name email branch')
      .populate('issuedBy', 'name role');

    res.status(201).json({
      msg: 'Book issued successfully',
      bookIssue: populatedBookIssue
    });
  } catch (err) {
    console.error('Error issuing book:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/book-issues/:id/return
// @desc    Return a book
// @access  Private (Admin and Teacher)
exports.returnBook = async (req, res) => {
  try {
    const bookIssue = await BookIssue.findById(req.params.id);

    if (!bookIssue) {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    // Check if book is already returned
    if (bookIssue.status === 'returned') {
      return res.status(400).json({ msg: 'Book is already returned' });
    }

    // Update book issue
    bookIssue.status = 'returned';
    bookIssue.returnDate = Date.now();

    // Calculate fine if returned after due date
    const dueDate = new Date(bookIssue.dueDate);
    const returnDate = new Date(bookIssue.returnDate);

    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      // Fine calculation: $1 per day late
      bookIssue.fine = daysLate * 1;
    }

    await bookIssue.save();

    // Update book available quantity
    const book = await Book.findById(bookIssue.book);
    if (book) {
      book.availableQuantity += 1;
      await book.save();
    }

    // Populate book issue fields
    const populatedBookIssue = await BookIssue.findById(bookIssue._id)
      .populate('book', 'title author isbn coverImage')
      .populate('student', 'name email branch')
      .populate('issuedBy', 'name role');

    res.json({
      msg: 'Book returned successfully',
      bookIssue: populatedBookIssue
    });
  } catch (err) {
    console.error('Error returning book:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/book-issues/:id
// @desc    Update a book issue
// @access  Private (Admin and Teacher who issued the book)
exports.updateBookIssue = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let bookIssue = await BookIssue.findById(req.params.id);

    if (!bookIssue) {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    // Check if user is authorized to update this book issue
    if (
      req.user.role !== 'admin' &&
      bookIssue.issuedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to update this book issue' });
    }

    // Update book issue fields
    const updateFields = {};

    if (req.body.dueDate) {
      updateFields.dueDate = new Date(req.body.dueDate);
    }

    if (req.body.notes !== undefined) {
      updateFields.notes = req.body.notes;
    }

    if (req.body.fine !== undefined && req.user.role === 'admin') {
      updateFields.fine = parseFloat(req.body.fine);
    }

    // Update the book issue
    bookIssue = await BookIssue.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )
      .populate('book', 'title author isbn coverImage')
      .populate('student', 'name email branch')
      .populate('issuedBy', 'name role');

    res.json({
      msg: 'Book issue updated successfully',
      bookIssue
    });
  } catch (err) {
    console.error('Error updating book issue:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/book-issues/:id
// @desc    Delete a book issue
// @access  Private (Admin only)
exports.deleteBookIssue = async (req, res) => {
  try {
    const bookIssue = await BookIssue.findById(req.params.id);

    if (!bookIssue) {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    // Only admin can delete book issues
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete book issues' });
    }

    // If book is still issued, update book available quantity
    if (bookIssue.status === 'issued') {
      const book = await Book.findById(bookIssue.book);
      if (book) {
        book.availableQuantity += 1;
        await book.save();
      }
    }

    await BookIssue.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Book issue deleted successfully' });
  } catch (err) {
    console.error('Error deleting book issue:', err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book issue not found' });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
