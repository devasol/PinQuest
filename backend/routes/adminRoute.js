const express = require('express');
const User = require('../models/User');
const Post = require('../models/posts');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { deleteImageFromCloudinary } = require('../utils/mediaUtils');
const { protect, admin } = require('../middleware/authMiddleware');
const { getAllPostsForAdmin, deletePostByAdmin } = require('../controllers/postController');
const router = express.Router();

// @desc    Initialize admin user (only works if no admin exists)
// @route   POST /api/v1/admin/init
// @access  Public (for initial setup only)
const initAdmin = async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admin user already exists. Cannot initialize again for security reasons.'
      });
    }

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create admin user with role set to admin
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin'  // This is the key - setting the role to admin
    });

    // Generate JWT token
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        token
      }
    });
  } catch (error) {
    console.error('Error initializing admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create admin user (admin only)
// @route   POST /api/v1/admin/create
// @access  Private (admin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create admin user
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create regular user (admin only)
// @route   POST /api/v1/admin/users
// @access  Private (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid role specified. Must be user, admin, or moderator'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create user with specified role (default to 'user')
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/v1/admin/users
// @access  Private (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get a specific user by ID (admin only)
// @route   GET /api/v1/admin/users/:id
// @access  Private (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Verify admin access (admin only)
// @route   GET /api/v1/admin/verify
// @access  Private (admin only)
const verifyAdmin = async (req, res) => {
  try {
    // If we reach this function, the user has passed both protect and admin middleware
    res.status(200).json({
      status: 'success',
      message: 'Admin access verified successfully',
      data: {
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        }
      }
    });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (admin only)
const deleteUser = async (req, res) => {
  try {
    // Check if the requesting user is an admin (this should already be handled by middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Admin privileges required.',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Delete user's avatar if it exists
    if (user.avatar && user.avatar.publicId) {
      try {
        await deleteImageFromCloudinary(user.avatar.publicId);
      } catch (delErr) {
        console.error('Error deleting user avatar:', delErr);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Get all posts (admin only)
// @route   GET /api/v1/admin/posts
// @access  Private (admin only)
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "name email role")
      .sort({ datePosted: -1 });
    res.status(200).json({
      status: 'success',
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update any post (admin only)
// @route   PUT /api/v1/admin/posts/:id
// @access  Private (admin only)
const updatePost = async (req, res) => {
  try {
    const Post = require('../models/posts'); // Import Post model inside the function

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }

    // Update the post with provided data
    const allowedUpdates = ['title', 'description', 'category'];
    const updates = Object.keys(req.body);

    // Validate that all updates are allowed
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid updates provided'
      });
    }

    // Update the post fields
    updates.forEach(update => {
      post[update] = req.body[update];
    });

    await post.save();

    res.status(200).json({
      status: 'success',
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Approve a pending post (admin only)
// @route   PUT /api/v1/admin/posts/:id/approve
// @access  Private (admin only)
const approvePost = async (req, res) => {
  try {
    const Post = require('../models/posts'); // Import Post model inside the function

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }

    // Update post status to published
    post.status = 'published';
    await post.save();

    res.status(200).json({
      status: 'success',
      message: 'Post approved successfully',
      data: post
    });
  } catch (error) {
    console.error("Error approving post:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Reject a pending post (admin only)
// @route   PUT /api/v1/admin/posts/:id/reject
// @access  Private (admin only)
const rejectPost = async (req, res) => {
  try {
    const Post = require('../models/posts'); // Import Post model inside the function

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }

    // Update post status to rejected
    post.status = 'rejected';
    await post.save();

    res.status(200).json({
      status: 'success',
      message: 'Post rejected successfully',
      data: post
    });
  } catch (error) {
    console.error("Error rejecting post:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Delete any post (admin only)
// @route   DELETE /api/v1/admin/posts/:id
// @access  Private (admin only)
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found',
      });
    }

    // If the post has images stored locally, delete them from disk
    if (Array.isArray(post.images) && post.images.length > 0) {
      for (const img of post.images) {
        try {
          if (img && img.localPath) {
            await require('fs').promises.unlink(img.localPath).catch(() => {});
          } else if (img && img.filename) {
            const path = require('path');
            const p = path.join(__dirname, '..', 'uploads', img.filename);
            await require('fs').promises.unlink(p).catch(() => {});
          }
        } catch (e) {
          console.error("Error deleting local image during post deletion", e);
        }
      }
    } else if (post.image && post.image.localPath) {
      // Fallback for posts using legacy single image field stored locally
      try {
        await require('fs').promises.unlink(post.image.localPath).catch(() => {});
      } catch (e) {
        console.error(
          "Error deleting legacy local image during post deletion",
          e
        );
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Update any user's password (admin only)
// @route   PUT /api/v1/admin/users/:userId/password
// @access  Private (admin only)
const updateUserPassword = async (req, res) => {
  try {
    const { adminUpdateUserPassword } = require('../controllers/passwordController');
    await adminUpdateUserPassword(req, res);
  } catch (error) {
    console.error("Error in admin update user password:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get all reports (admin only)
// @route   GET /api/v1/admin/reports
// @access  Private (admin only)
const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, reason } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const Report = require('../models/Report');
    const Post = require('../models/posts');

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('post', 'title description postedBy')
      .populate('reviewedBy', 'name')
      .sort({ dateReported: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: parseInt(page) * limit < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update report status (admin only)
// @route   PUT /api/v1/admin/reports/:id
// @access  Private (admin only)
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid status is required (pending, reviewed, resolved, dismissed)'
      });
    }

    const Report = require('../models/Report');
    const Post = require('../models/posts');
    const Notification = require('../models/Notification');

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        status: 'fail',
        message: 'Report not found'
      });
    }

    // Update the report
    report.status = status;
    report.reviewedBy = req.user._id; // Current user is reviewing
    report.reviewedAt = Date.now();
    if (resolutionNote) report.resolutionNote = resolutionNote;

    await report.save();

    // If the report is resolved or dismissed, we might want to notify the reporter
    // For now, let's create a notification for the reporter
    const post = await Post.findById(report.post);
    const notification = new Notification({
      recipient: report.reporter,
      sender: req.user._id,
      type: 'post_update',
      post: report.post,
      message: `Your report for post "${post ? post.title : 'Unknown Post'}" has been updated to status: ${status}`
    });
    
    await notification.save();

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get report by ID (admin only)
// @route   GET /api/v1/admin/reports/:id
// @access  Private (admin only)
const getReportById = async (req, res) => {
  try {
    const Report = require('../models/Report');

    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('post', 'title description postedBy')
      .populate('reviewedBy', 'name');

    if (!report) {
      return res.status(404).json({
        status: 'fail',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/v1/admin/users/:userId/role
// @access  Private (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid role is required (user, admin, moderator)'
      });
    }

    // Check if the current user is an admin (already verified by middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Admin privileges required.',
      });
    }

    const User = require('../models/User');

    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update the user's role
    user.role = role;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Ban/Unban user (admin only)
// @route   PUT /api/v1/admin/users/:userId/ban
// @access  Private (admin only)
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ban } = req.body; // true to ban, false to unban

    // Check if the current user is an admin (already verified by middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Admin privileges required.',
      });
    }

    const User = require('../models/User');

    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update the user's ban status
    user.isBanned = !!ban; // ban = true means isBanned should be true
    await user.save();

    res.status(200).json({
      status: 'success',
      message: ban ? 'User banned successfully' : 'User unbanned successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    TEMPORARY: Promote any user to admin (for development only)
// @route   POST /api/v1/admin/promote-user
// @access  Private (requires special DEV_ADMIN_KEY)
const promoteUserToAdmin = async (req, res) => {
  try {
    // This is a development-only endpoint that should be disabled in production
    if (process.env.ENABLE_DEV_ADMIN !== 'true') {
      return res.status(404).json({
        status: 'fail',
        message: 'Endpoint not found'
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is required'
      });
    }

    const User = require('../models/User');

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update the user's role to admin
    user.role = 'admin';
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User promoted to admin successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all admin notifications (admin only)
// @route   GET /api/v1/admin/notifications
// @access  Private (admin only)
const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, read = 'all' } = req.query;
    
    // Get admin user IDs to build query
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(user => user._id);
    
    // Build query for admin notifications only
    let query = {
      recipient: { $in: adminIds }
    };
    
    if (type) {
      query.type = type;
    }
    
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
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create admin notification (for system events)
// @route   POST /api/v1/admin/notifications
// @access  Private (admin only)
const createAdminNotification = async (req, res) => {
  try {
    const { type, message, post, comment } = req.body;
    
    // Validate required fields
    if (!type || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Type and message are required'
      });
    }
    
    // Validate notification type
    const validTypes = ['report', 'new_user', 'moderation', 'system_alert', 'admin_notification'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Get all admin users to send the notification to
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    
    if (adminUsers.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No admin users found'
      });
    }
    
    // Create notification for each admin
    const createdNotifications = [];
    for (const admin of adminUsers) {
      const notification = new Notification({
        recipient: admin._id,
        sender: req.user._id,
        type,
        message,
        post: post || undefined,
        comment: comment || undefined
      });
      
      await notification.save();
      createdNotifications.push(notification);
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Admin notifications created successfully',
      data: createdNotifications
    });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get admin notifications count (admin only)
// @route   GET /api/v1/admin/notifications/count
// @access  Private (admin only)
const getAdminNotificationCount = async (req, res) => {
  try {
    // Get admin user IDs
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(user => user._id);
    
    const count = await Notification.countDocuments({
      recipient: { $in: adminIds },
      read: false
    });
    
    res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching admin notifications count:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Mark all admin notifications as read
// @route   PUT /api/v1/admin/notifications/read-all
// @access  Private (admin only)
const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    // Get admin user IDs
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminIds = adminUsers.map(user => user._id);
    
    await Notification.updateMany(
      { recipient: { $in: adminIds }, read: false },
      { read: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All admin notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

router.route('/init').post(initAdmin);
router.route('/create').post(protect, admin, createAdmin);
router.route('/users').get(protect, admin, getAllUsers);
router.route('/users/:id')
  .get(protect, admin, getUserById)
  .delete(protect, admin, deleteUser);
router.route('/users/:userId/password')
  .put(protect, admin, updateUserPassword);
router.route('/verify').get(protect, admin, verifyAdmin);
router.route('/posts').get(protect, admin, getAllPosts);
router.route('/posts/:id')
  .put(protect, admin, updatePost)
  .delete(protect, admin, deletePost);
router.route('/posts/:id/approve')
  .put(protect, admin, approvePost);
router.route('/posts/:id/reject')
  .put(protect, admin, rejectPost);
router.route('/reports').get(protect, admin, getAllReports);
router.route('/reports/:id')
  .get(protect, admin, getReportById)
  .put(protect, admin, updateReport);
router.route('/users/:userId/role')
  .put(protect, admin, updateUserRole);
router.route('/users/:userId/ban')
  .put(protect, admin, banUser);
router.route('/users')
  .post(protect, admin, createUser);
router.route('/promote-user')
  .post(protect, promoteUserToAdmin);

// Admin notifications routes
router.route('/notifications')
  .get(protect, admin, getAdminNotifications)
  .post(protect, admin, createAdminNotification);
router.route('/notifications/count')
  .get(protect, admin, getAdminNotificationCount);
router.route('/notifications/read-all')
  .put(protect, admin, markAllAdminNotificationsAsRead);

module.exports = router;