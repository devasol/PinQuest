const express = require('express');
const { 
  sendMessage, 
  getConversations, 
  getConversationMessages,
  getMessages,
  markMessageAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for messaging
router.route('/').post(protect, sendMessage).get(protect, getMessages);
router.route('/conversations').get(protect, getConversations);
router.route('/conversation/:userId').get(protect, getConversationMessages);
router.route('/:id/read').put(protect, markMessageAsRead);
router.route('/:id').delete(protect, deleteMessage);

module.exports = router;