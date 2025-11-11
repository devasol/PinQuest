const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String, // A unique identifier for the conversation between two users
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient querying
messageSchema.index({ conversationId: 1, date: -1 });

module.exports = mongoose.model('Message', messageSchema);