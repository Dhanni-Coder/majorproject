const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);

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
