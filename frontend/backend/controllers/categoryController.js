const Post = require('../models/posts');

// @desc    Get all post categories
// @route   GET /api/v1/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    // Get all unique categories from posts
    const categories = await Post.distinct('category');
    
    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get posts by category
// @route   GET /api/v1/categories/:category
// @access  Public
const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category parameter is required'
      });
    }
    
    const posts = await Post.find({ 
      category: { $regex: category, $options: 'i' } 
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .sort({ datePosted: -1 });
    
    res.status(200).json({
      status: 'success',
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update post category
// @route   PUT /api/v1/posts/:id/category
// @access  Private
const updatePostCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const { id } = req.params;
    
    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category is required'
      });
    }
    
    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found'
      });
    }
    
    // Update category
    post.category = category;
    await post.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        _id: post._id,
        category: post.category
      }
    });
  } catch (error) {
    console.error('Error updating post category:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get popular categories
// @route   GET /api/v1/categories/popular
// @access  Public
const getPopularCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get categories with post counts, sorted by popularity
    const categories = await Post.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getCategories,
  getPostsByCategory,
  updatePostCategory,
  getPopularCategories
};