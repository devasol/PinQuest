const Post = require('../models/posts');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user's activity feed
// @route   GET /api/v1/feed
// @access  Private
const getActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Get the current user's following list
    const user = await User.findById(req.user._id).populate('following.user', '_id');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Extract IDs of users that the current user is following
    const followingIds = user.following.map(follow => follow.user._id);
    followingIds.push(req.user._id); // Include user's own posts in their feed

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get posts from followed users (and user's own posts) sorted by date
    const posts = await Post.find({ 
      postedBy: { $in: followingIds } 
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .populate({
      path: 'likes.user',
      select: 'name avatar'
    })
    .sort({ datePosted: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Post.countDocuments({ 
      postedBy: { $in: followingIds } 
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: parseInt(page) * limit < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's personal activity (their own posts, likes, etc.)
// @route   GET /api/v1/feed/personal
// @access  Private
const getPersonalActivity = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get user's own posts
    const posts = await Post.find({ 
      postedBy: req.user._id 
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .populate({
      path: 'likes.user',
      select: 'name avatar'
    })
    .sort({ datePosted: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get user's liked posts
    const likedPosts = await Post.find({
      likes: { $elemMatch: { user: req.user._id } }
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .populate({
      path: 'likes.user',
      select: 'name avatar'
    })
    .sort({ datePosted: -1 });

    // Get total counts
    const totalPosts = await Post.countDocuments({ postedBy: req.user._id });
    const totalLikedPosts = await Post.countDocuments({
      likes: { $elemMatch: { user: req.user._id } }
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts: {
          created: posts,
          liked: likedPosts
        },
        counts: {
          totalCreated: totalPosts,
          totalLiked: totalLikedPosts
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts: totalPosts,
          hasNext: parseInt(page) * limit < totalPosts,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching personal activity:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/v1/feed/trending
// @access  Public
const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    // Calculate date for X days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    // Get trending posts based on recent likes and comments
    const trendingPosts = await Post.find({ 
      datePosted: { $gte: daysAgo }
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .sort({ likesCount: -1, 'comments.1': -1 }) // Sort by likes count and comments
    .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: trendingPosts
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's notification feed
// @route   GET /api/v1/feed/notifications
// @access  Private
const getNotificationFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    // Build query based on notification type
    let query = { recipient: req.user._id };
    if (type) {
      query.type = type;
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
    console.error('Error fetching notification feed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getActivityFeed,
  getPersonalActivity,
  getTrendingPosts,
  getNotificationFeed
};