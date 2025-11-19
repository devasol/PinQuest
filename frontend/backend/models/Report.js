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

module.exports = mongoose.model('Report', reportSchema);