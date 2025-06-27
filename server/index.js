const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, 'uploads');
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// Define routes
app.get('/', (req, res) => {
  res.send('College Management System API is running');
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const noticeRoutes = require('./routes/notices');
const branchRoutes = require('./routes/branches');
const subjectRoutes = require('./routes/subjects');
const attendanceRoutes = require('./routes/attendance');
const bookRoutes = require('./routes/books');
const bookIssueRoutes = require('./routes/bookIssues');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/book-issues', bookIssueRoutes);
app.use('/api/admin', adminRoutes);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then((connected) => {
  // Start the server regardless of MongoDB connection status
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!connected) {
      console.warn('Warning: Server running without MongoDB connection. Some features may not work.');
    }
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});

// Add error handling for routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});
