const multer = require("multer");
const path = require("path");
const fs = require("fs");
const validator = require('validator');

// Directory where uploaded files will be stored
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Sanitize filename to prevent path traversal
    const sanitizedOriginalname = validator.escape(file.originalname);
    const safeName = sanitizedOriginalname.replace(/[^a-zA-Z0-9._-]/g, "_"); // Only allow safe characters
    cb(null, Date.now() + "-" + safeName);
  },
});

// Enhanced file filter to allow common image types with better validation
function fileFilter(req, file, cb) {
  // Check file extension and MIME type
  const allowedExtensions = /jpeg|jpg|png|gif|webp/i;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedMimeTypes.includes(file.mimetype);

  if (mimeType && extName) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
}

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum number of files
    fieldSize: 10 * 1024 * 1024 // Increase field size for large text fields
  },
  fileFilter,
});

module.exports = upload;
