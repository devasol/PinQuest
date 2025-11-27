const express = require('express');
const { 
  getPlatformStats,
  getUserAnalytics, 
  getPostAnalytics, 
  getTopPosts,
  getUserEngagement,
  getActivityTimeline,
  getUserGrowth,
  getPlatformGrowth
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for analytics
router.route('/platform').get(protect, admin, getPlatformStats);
router.route('/user').get(protect, getUserAnalytics);
router.route('/post/:id').get(protect, getPostAnalytics);
router.route('/top-posts').get(protect, getTopPosts);
router.route('/user-engagement').get(protect, getUserEngagement);
router.route('/activity-timeline').get(protect, getActivityTimeline);
router.route('/user-growth').get(protect, admin, getUserGrowth);
router.route('/platform-growth').get(protect, admin, getPlatformGrowth);

module.exports = router;