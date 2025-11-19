const express = require('express');
const { 
  createReport, 
  getUserReports, 
  getAllReports, 
  updateReport,
  getReportById
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for reports
router.route('/').post(protect, createReport).get(protect, getAllReports);
router.route('/my-reports').get(protect, getUserReports);
router.route('/:id').get(protect, getReportById).put(protect, updateReport);

module.exports = router;