const Post = require('../models/posts');
const User = require('../models/User');
const Message = require('../models/Message');
const Report = require('../models/Report');

// @desc    Get platform statistics
// @route   GET /api/v1/analytics/platform
// @access  Private (admin only)
const getPlatformStats = async (req, res) => {
  try {
    // The admin middleware ensures the user is authenticated and has admin privileges
    const [
      totalUsers,
      totalPosts,
      totalMessages,
      totalReports
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      Report.countDocuments()
    ]);

    const stats = {
      totalUsers,
      totalPosts,
      totalMessages,
      totalReports,
      date: new Date()
    };

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/v1/analytics/user
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      userPosts,
      userComments,
      userLikes,
      likedPosts
    ] = await Promise.all([
      Post.countDocuments({ postedBy: userId }),
      Post.countDocuments({ 'comments.user': userId }),
      Post.countDocuments({ 'likes.user': userId }),
      Post.find({ 'likes.user': userId }).select('title likesCount').limit(10)
    ]);

    const analytics = {
      postsCreated: userPosts,
      commentsMade: userComments,
      postsLiked: userLikes,
      recentlyLiked: likedPosts,
      date: new Date()
    };

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get post analytics
// @route   GET /api/v1/analytics/post/:id
// @access  Private
const getPostAnalytics = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found'
      });
    }

    // Check if user has permission to view analytics
    // Could be the post owner or an admin
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'Not authorized to view this post analytics'
      });
    }

    const analytics = {
      postId: post._id,
      title: post.title,
      likesCount: post.likesCount,
      commentsCount: post.comments.length,
      totalEngagement: post.likesCount + post.comments.length,
      datePosted: post.datePosted,
      views: post.views || 0, // If you implement views tracking
      date: new Date()
    };

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get top posts
// @route   GET /api/v1/analytics/top-posts
// @access  Private
const getTopPosts = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    // Calculate date for X days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get top posts based on engagement (likes + comments)
    const topPosts = await Post.find({ 
      datePosted: { $gte: daysAgo }
    })
    .populate('postedBy', 'name avatar')
    .sort({ 
      likesCount: -1, 
      'comments.1': -1 
    }) // Sort by likes count and comments
    .limit(parseInt(limit));

    const formattedPosts = topPosts.map(post => ({
      _id: post._id,
      title: post.title,
      author: post.postedBy.name,
      likesCount: post.likesCount,
      commentsCount: post.comments.length,
      engagement: post.likesCount + post.comments.length,
      datePosted: post.datePosted
    }));

    res.status(200).json({
      status: 'success',
      data: formattedPosts
    });
  } catch (error) {
    console.error('Error fetching top posts:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user engagement stats
// @route   GET /api/v1/analytics/user-engagement
// @access  Private
const getUserEngagement = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Calculate date for X days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get posts created by user in the last X days
    const posts = await Post.find({ 
      postedBy: req.user._id,
      datePosted: { $gte: daysAgo }
    });

    // Calculate engagement metrics
    const engagementData = posts.map(post => ({
      date: post.datePosted.toISOString().split('T')[0],
      postId: post._id,
      title: post.title,
      likes: post.likesCount,
      comments: post.comments.length,
      totalEngagement: post.likesCount + post.comments.length
    }));

    // Aggregate by date
    const dailyStats = engagementData.reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          posts: 0,
          likes: 0,
          comments: 0,
          totalEngagement: 0
        };
      }
      acc[date].posts += 1;
      acc[date].likes += curr.likes;
      acc[date].comments += curr.comments;
      acc[date].totalEngagement += curr.totalEngagement;
      return acc;
    }, {});

    const result = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get activity timeline
// @route   GET /api/v1/analytics/activity-timeline
// @access  Private
const getActivityTimeline = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Calculate date for X days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get user's activity in the last X days
    const [
      userPosts,
      userComments,
      userLikes
    ] = await Promise.all([
      Post.find({ 
        postedBy: req.user._id,
        datePosted: { $gte: daysAgo }
      }).select('title datePosted'),
      
      Post.find({ 
        'comments.user': req.user._id,
        datePosted: { $gte: daysAgo }
      }).select('title comments'),
      
      Post.find({ 
        'likes.user': req.user._id,
        datePosted: { $gte: daysAgo }
      }).select('title datePosted')
    ]);

    // Format activities
    const activities = [];

    // Add posts
    userPosts.forEach(post => {
      activities.push({
        type: 'post',
        title: post.title,
        date: post.datePosted,
        action: 'created post'
      });
    });

    // Add comments
    userComments.forEach(post => {
      post.comments.forEach(comment => {
        if (comment.user.toString() === req.user._id.toString() && comment.date >= daysAgo) {
          activities.push({
            type: 'comment',
            title: post.title,
            date: comment.date,
            action: 'commented on post'
          });
        }
      });
    });

    // Add likes
    userLikes.forEach(post => {
      activities.push({
        type: 'like',
        title: post.title,
        date: post.datePosted, // Using post date as like date since we don't store specific like date
        action: 'liked post'
      });
    });

    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getPlatformStats,
  getUserAnalytics,
  getPostAnalytics,
  getTopPosts,
  getUserEngagement,
  getActivityTimeline
};