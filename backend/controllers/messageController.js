const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../utils/socketUtils');

// @desc    Send a message
// @route   POST /api/v1/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Recipient ID and content are required'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Recipient not found'
      });
    }

    // Ensure you're not messaging yourself
    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot message yourself'
      });
    }

    // Create a conversation ID (alphanumeric, based on both user IDs sorted)
    const userIds = [req.user._id.toString(), recipientId.toString()].sort();
    const conversationId = `conv_${userIds[0]}_${userIds[1]}`;

    // Create the message
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      conversationId,
      content
    });

    await message.save();

    // Populate sender and recipient for response
    await message.populate('sender', 'name avatar');
    await message.populate('recipient', 'name avatar');

    // Emit real-time event for new message
    const io = req.app.get('io');
    if (io) {
      emitToUser(io, recipientId, 'newMessage', {
        message,
        message: 'You have a new message'
      });
    }

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's conversations
// @route   GET /api/v1/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Find all unique conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$content' },
          lastMessageDate: { $first: '$date' },
          participants: {
            $addToSet: {
              $cond: [
                { $eq: ['$sender', req.user._id] },
                '$recipient',
                '$sender'
              ]
            ]
          },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipient', req.user._id] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate participant details
    const populatedConversations = [];
    for (const conv of conversations) {
      const participant = await User.findById(conv.participants[0]).select('name avatar');
      populatedConversations.push({
        conversationId: conv._id,
        participant,
        lastMessage: conv.lastMessage,
        lastMessageDate: conv.lastMessageDate,
        unreadCount: conv.unreadCount
      });
    }

    res.status(200).json({
      status: 'success',
      data: populatedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/v1/messages/conversation/:userId
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID is required'
      });
    }

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Other user not found'
      });
    }

    // Create conversation ID
    const userIds = [req.user._id.toString(), userId.toString()].sort();
    const conversationId = `conv_${userIds[0]}_${userIds[1]}`;

    // Get messages in the conversation
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .sort({ date: 1 });

    // Mark messages as read if they were sent to the current user
    await Message.updateMany(
      { 
        conversationId, 
        recipient: req.user._id, 
        read: false 
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all messages for a user
// @route   GET /api/v1/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'all' } = req.query;

    let query = {};
    if (type === 'sent') {
      query.sender = req.user._id;
    } else if (type === 'received') {
      query.recipient = req.user._id;
    } else {
      query.$or = [
        { sender: req.user._id },
        { recipient: req.user._id }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: parseInt(page) * limit < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/v1/messages/:id/read
// @access  Private
const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found or you are not the recipient'
      });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  getMessages,
  markMessageAsRead,
  deleteMessage
};