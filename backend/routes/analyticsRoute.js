const express = require('express');
const { 
  getPlatformStats,
  getUserAnalytics, 
  getPostAnalytics, 
  getTopPosts,
  getUserEngagement,
  getActivityTimeline
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for analytics
router.route('/platform').get(protect, getPlatformStats);
router.route('/user').get(protect, getUserAnalytics);
router.route('/post/:id').get(protect, getPostAnalytics);
router.route('/top-posts').get(protect, getTopPosts);
router.route('/user-engagement').get(protect, getUserEngagement);
router.route('/activity-timeline').get(protect, getActivityTimeline);

module.exports = router;