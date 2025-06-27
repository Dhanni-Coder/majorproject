const express = require('express');
const { check } = require('express-validator');
const bookController = require('../controllers/bookController');
const { auth, teacherAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET api/books
// @desc    Get all books
// @access  Private
router.get('/', auth, bookController.getAllBooks);

// @route   GET api/books/search
// @desc    Search books
// @access  Private
router.get('/search', auth, bookController.searchBooks);

// @route   GET api/books/:id
// @desc    Get book by ID
// @access  Private
router.get('/:id', auth, bookController.getBookById);

// @route   POST api/books
// @desc    Create a new book
// @access  Private (Admin and Teacher)
router.post(
  '/',
  [
    auth,
    teacherAuth,
    upload.single('coverImage'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('author', 'Author is required').not().isEmpty(),
      check('quantity', 'Quantity must be a positive number').isInt({ min: 1 })
    ]
  ],
  bookController.createBook
);

// @route   PUT api/books/:id
// @desc    Update a book
// @access  Private (Admin and Teacher who added the book)
router.put(
  '/:id',
  [
    auth,
    teacherAuth,
    upload.single('coverImage'),
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('author', 'Author is required').optional().not().isEmpty(),
      check('quantity', 'Quantity must be a positive number').optional().isInt({ min: 1 })
    ]
  ],
  bookController.updateBook
);

// @route   DELETE api/books/:id
// @desc    Delete a book
// @access  Private (Admin and Teacher who added the book)
router.delete('/:id', [auth, teacherAuth], bookController.deleteBook);

module.exports = router;
