const express = require('express');
const { 
  createReport, 
  getUserReports
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Basic reports routes for regular users
router.route('/').post(protect, createReport); // Any user can create a report
router.route('/my-reports').get(protect, getUserReports); // Any authenticated user can get their reports

module.exports = router;