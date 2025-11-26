const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String, // 'post', 'comment', 'like', etc.
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId, // ID of the target (post, comment, etc.)
    required: true
  },
  targetTitle: {
    type: String, // Title of the target for display
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Additional data related to the activity
    default: {}
  },
  ip: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  location: {
    type: String, // Geolocation information
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying by user and date
activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ date: -1 });

module.exports = mongoose.model('Activity', activitySchema);