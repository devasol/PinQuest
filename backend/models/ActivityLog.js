const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 
      'login_failure', 
      'logout', 
      'password_change', 
      'security_settings_update', 
      'admin_panel_access',
      'user_management',
      'post_management',
      'report_management'
    ]
  },
  ip: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  success: {
    type: Boolean,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);