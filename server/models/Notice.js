const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    enum: ['all', 'teacher', 'student'],
    default: 'all'
  },
  date: {
    type: Date,
    default: Date.now
  },
  important: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Notice', NoticeSchema);
