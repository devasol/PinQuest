const User = require('../models/User');
const Post = require('../models/posts');

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Public
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
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Add post to user's favorites
// @route   POST /api/v1/users/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Post ID is required'
      });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if post is already in favorites
    const isAlreadyFavorited = user.favorites.some(fav => 
      fav.post.toString() === postId
    );
    
    if (isAlreadyFavorited) {
      return res.status(400).json({
        status: 'fail',
        message: 'Post already in favorites'
      });
    }
    
    // Add to favorites
    user.favorites.push({ post: postId });
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        user: user._id,
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Remove post from user's favorites
// @route   DELETE /api/v1/users/favorites/:postId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Remove from favorites
    user.favorites = user.favorites.filter(fav => 
      fav.post.toString() !== postId
    );
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        user: user._id,
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's favorite posts
// @route   GET /api/v1/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites.post',
      populate: {
        path: 'postedBy',
        select: 'name avatar'
      }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: user.favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Check if a post is favorited by user
// @route   GET /api/v1/users/favorites/:postId
// @access  Private
const isFavorite = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    const isFavorited = user.favorites.some(fav => 
      fav.post.toString() === postId
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        isFavorited,
        postId
      }
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    // Only update allowed fields
    const allowedUpdates = ['name', 'email', 'avatar'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid updates',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/v1/users/:id/posts
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Get posts by this user
    const posts = await Post.find({ postedBy: req.params.id }).sort({ datePosted: -1 });

    res.status(200).json({
      status: 'success',
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Optionally delete all posts by this user as well
    await Post.deleteMany({ postedBy: req.params.id });

    res.status(204).json({
      status: 'success',
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

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  getUserById,
  updateUser,
  getUserPosts,
  deleteUser,
  getAllUsers,
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite
};