const Report = require('../models/Report');
const Post = require('../models/posts');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Report a post
// @route   POST /api/v1/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const { postId, reason, description } = req.body;

    if (!postId || !reason) {
      return res.status(400).json({
        status: 'fail',
        message: 'Post ID and reason are required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found'
      });
    }

    // Check if user has already reported this post
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      post: postId
    });

    if (existingReport) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already reported this post'
      });
    }

    // Create the report
    const report = new Report({
      reporter: req.user._id,
      post: postId,
      reason,
      description: description || ''
    });

    await report.save();

    // Create notification for admins about the new report
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      const postDetails = await Post.findById(postId).select('title');
      
      for (const admin of adminUsers) {
        const notification = new Notification({
          recipient: admin._id,
          sender: req.user._id,
          type: 'report',
          post: postId,
          message: `New report received: "${reason}" for post "${postDetails?.title || 'Untitled'}"`
        });
        
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating admin notification for new report:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/v1/reports/my-reports
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    const reports = await Report.find({ reporter: req.user._id })
      .populate('post', 'title description')
      .populate('reviewedBy', 'name')
      .sort({ dateReported: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ reporter: req.user._id });

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
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all reports (admin only)
// @route   GET /api/v1/reports
// @access  Private
const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, reason } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    // Calculate pagination
    const skip = (page - 1) * limit;

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
// @route   PUT /api/v1/reports/:id
// @access  Private
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
    const notification = new Notification({
      recipient: report.reporter,
      sender: req.user._id,
      type: 'post_update',
      post: report.post,
      message: `Your report for post "${report.post.title}" has been updated to status: ${status}`
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

// @desc    Get report by ID
// @route   GET /api/v1/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
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

module.exports = {
  createReport,
  getUserReports,
  getAllReports,
  updateReport,
  getReportById
};