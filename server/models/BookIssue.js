const mongoose = require('mongoose');

const BookIssueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  fine: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
});

// Create a compound index to prevent a student from borrowing the same book multiple times
BookIssueSchema.index({ book: 1, student: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'issued' } 
});

module.exports = mongoose.model('BookIssue', BookIssueSchema);
