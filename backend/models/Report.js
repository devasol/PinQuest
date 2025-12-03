const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'inappropriate_content',
      'harassment',
      'hate_speech',
      'misinformation',
      'copyright_violation',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin/moderator who reviewed the report
  },
  reviewedAt: {
    type: Date
  },
  resolutionNote: {
    type: String
  },
  dateReported: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
reportSchema.index({ status: 1, dateReported: -1 }); // For reports by status sorted by date
reportSchema.index({ post: 1, status: 1 }); // For reports on specific posts by status
reportSchema.index({ reporter: 1, dateReported: -1 }); // For user's reports
reportSchema.index({ dateReported: -1 }); // For newest reports
reportSchema.index({ reviewedBy: 1, dateReported: -1 }); // For admin reports
reportSchema.index({ reason: 1, status: 1 }); // For reports by reason and status
reportSchema.index({ status: 1, reviewedBy: 1 }); // For unreviewed reports by admin

module.exports = mongoose.model('Report', reportSchema);