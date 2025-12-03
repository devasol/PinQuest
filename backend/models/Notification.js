const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'like',
      'comment',
      'follow',
      'mention',
      'reply',
      'post_update',
      'report',
      'new_user',
      'moderation',
      'system_alert',
      'admin_notification'
    ]
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
notificationSchema.index({ recipient: 1, date: -1 }); // For user's notifications sorted by date
notificationSchema.index({ recipient: 1, read: 1 }); // For user's read/unread notifications
notificationSchema.index({ recipient: 1, type: 1 }); // For user's notifications by type
notificationSchema.index({ date: -1 }); // For newest notifications
notificationSchema.index({ type: 1, date: -1 }); // For notifications by type sorted by date
notificationSchema.index({ sender: 1, date: -1 }); // For notifications from a sender
notificationSchema.index({ post: 1, date: -1 }); // For notifications related to a post

module.exports = mongoose.model('Notification', notificationSchema);