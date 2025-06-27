const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    console.log(`Creating directory: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  } else {
    console.log(`Directory exists: ${directory}`);
  }
};

// Get absolute paths for upload directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const booksDir = path.join(uploadsDir, 'books');

// Ensure upload directories exist
ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(profilesDir);
ensureDirectoryExists(booksDir);

// Set storage engine for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Storing file in: ${profilesDir}`);
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    const filename = `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Set storage engine for book covers
const bookStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Storing file in: ${booksDir}`);
    cb(null, booksDir);
  },
  filename: function (req, file, cb) {
    const filename = `book-${Date.now()}${path.extname(file.originalname)}`;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow only image files
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  console.log(`File validation: ${file.originalname}, mimetype: ${file.mimetype}, valid: ${mimetype && extname}`);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Initialize upload for profile pictures
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5000000 }, // 5MB max file size
  fileFilter: fileFilter
});

// Initialize upload for book covers
const bookUpload = multer({
  storage: bookStorage,
  limits: { fileSize: 5000000 }, // 5MB max file size
  fileFilter: fileFilter
});

// Create a combined upload object
const upload = {
  single: (fieldName) => {
    console.log(`Upload requested for field: ${fieldName}`);
    if (fieldName === 'profilePicture') {
      return profileUpload.single(fieldName);
    } else if (fieldName === 'coverImage') {
      return bookUpload.single(fieldName);
    }
    // Default to profile upload
    return profileUpload.single(fieldName);
  }
};

module.exports = upload;
