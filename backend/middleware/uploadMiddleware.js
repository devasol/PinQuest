const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
    // keep original name but prefix with timestamp to avoid collisions
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

// Simple file filter to allow common image types
function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowed.test(file.mimetype.toLowerCase());
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (mimetype && ext) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter,
});

module.exports = upload;
