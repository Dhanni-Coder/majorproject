const { validationResult } = require('express-validator');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const User = require('../models/User');

// @route   GET api/books
// @desc    Get all books
// @access  Private
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .populate('branch', 'name code')
      .populate('addedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/books/:id
// @desc    Get book by ID
// @access  Private
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('addedBy', 'name role');

    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    res.json(book);
  } catch (err) {
    console.error('Error fetching book:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   POST api/books
// @desc    Create a new book
// @access  Private (Admin and Teacher)
exports.createBook = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, author, isbn, description, quantity, branch } = req.body;

  try {
    // Check if book with same ISBN already exists
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({ msg: 'A book with this ISBN already exists' });
      }
    }

    // Create new book
    const book = new Book({
      title,
      author,
      isbn: isbn || null,
      description: description || '',
      quantity: parseInt(quantity),
      availableQuantity: parseInt(quantity),
      branch: branch || null,
      addedBy: req.user.id,
      coverImage: req.file ? `/uploads/${req.file.filename}` : null
    });

    await book.save();

    // Populate branch and addedBy fields
    const populatedBook = await Book.findById(book._id)
      .populate('branch', 'name code')
      .populate('addedBy', 'name role');

    res.status(201).json({
      msg: 'Book added successfully',
      book: populatedBook
    });
  } catch (err) {
    console.error('Error creating book:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   PUT api/books/:id
// @desc    Update a book
// @access  Private (Admin and Teacher)
exports.updateBook = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    // Check if user is authorized to update the book
    if (req.user.role !== 'admin' && book.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this book' });
    }

    // Check if ISBN is being changed and if it already exists
    if (req.body.isbn && req.body.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: req.body.isbn });
      if (existingBook && existingBook._id.toString() !== req.params.id) {
        return res.status(400).json({ msg: 'A book with this ISBN already exists' });
      }
    }

    // Update book fields
    const updateFields = {};
    if (req.body.title) updateFields.title = req.body.title;
    if (req.body.author) updateFields.author = req.body.author;
    if (req.body.isbn !== undefined) updateFields.isbn = req.body.isbn || null;
    if (req.body.description !== undefined) updateFields.description = req.body.description;
    if (req.body.branch !== undefined) updateFields.branch = req.body.branch || null;
    
    // Handle quantity update
    if (req.body.quantity !== undefined) {
      const newQuantity = parseInt(req.body.quantity);
      const quantityDiff = newQuantity - book.quantity;
      
      updateFields.quantity = newQuantity;
      updateFields.availableQuantity = Math.max(0, book.availableQuantity + quantityDiff);
    }
    
    // Handle cover image update
    if (req.file) {
      updateFields.coverImage = `/uploads/${req.file.filename}`;
    }
    
    updateFields.updatedAt = Date.now();

    // Update the book
    book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate('branch', 'name code').populate('addedBy', 'name role');

    res.json({
      msg: 'Book updated successfully',
      book
    });
  } catch (err) {
    console.error('Error updating book:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   DELETE api/books/:id
// @desc    Delete a book
// @access  Private (Admin and Teacher who added the book)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ msg: 'Book not found' });
    }

    // Check if user is authorized to delete the book
    if (req.user.role !== 'admin' && book.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this book' });
    }

    // Check if book has any active issues
    const activeIssues = await BookIssue.countDocuments({ 
      book: req.params.id,
      status: 'issued'
    });

    if (activeIssues > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete book with active issues. Please return all copies first.' 
      });
    }

    // Delete all book issue records for this book
    await BookIssue.deleteMany({ book: req.params.id });
    
    // Delete the book
    await Book.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Book not found' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @route   GET api/books/search
// @desc    Search books
// @access  Private
exports.searchBooks = async (req, res) => {
  try {
    const { query, branch } = req.query;
    
    let searchQuery = {};
    
    // Add text search if query is provided
    if (query) {
      searchQuery = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
          { isbn: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    // Add branch filter if provided
    if (branch) {
      searchQuery.branch = branch;
    }
    
    const books = await Book.find(searchQuery)
      .populate('branch', 'name code')
      .populate('addedBy', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(books);
  } catch (err) {
    console.error('Error searching books:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
