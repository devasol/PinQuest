const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/posts');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, read = 'all' } = req.query;
    
    // Build query based on read status
    let query = { recipient: req.user._id };
    if (read === 'read') {
      query.read = true;
    } else if (read === 'unread') {
      query.read = false;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('post', 'title')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: parseInt(page) * limit < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};