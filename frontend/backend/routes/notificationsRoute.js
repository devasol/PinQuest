const express = require('express');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for notifications
router.route('/').get(protect, getNotifications);
router.route('/unread-count').get(protect, getUnreadCount);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id').put(protect, markAsRead).delete(protect, deleteNotification);

module.exports = router;