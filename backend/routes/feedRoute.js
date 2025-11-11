const express = require('express');
const { 
  getActivityFeed, 
  getPersonalActivity, 
  getTrendingPosts,
  getNotificationFeed
} = require('../controllers/feedController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for activity feed
router.route('/').get(protect, getActivityFeed);
router.route('/personal').get(protect, getPersonalActivity);
router.route('/trending').get(getTrendingPosts);
router.route('/notifications').get(protect, getNotificationFeed);

module.exports = router;