const User = require('../models/User');
const Post = require('../models/posts');
const { createFollowNotification } = require('../utils/notificationUtils');

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

// @desc    Follow a user
// @route   POST /api/v1/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.user._id;
    
    // Don't allow user to follow themselves
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot follow yourself'
      });
    }
    
    // Get both users
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if already following
    const isAlreadyFollowing = currentUser.following.some(following => 
      following.user.toString() === targetUserId
    );
    
    if (isAlreadyFollowing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Already following this user'
      });
    }
    
    // Add to current user's following
    currentUser.following.push({ user: targetUserId });
    
    // Add to target user's followers
    targetUser.followers.push({ user: currentUserId });
    
    // Save both users
    await currentUser.save();
    await targetUser.save();
    
    // Create notification for the followed user
    await createFollowNotification(currentUserId, targetUserId);
    
    res.status(200).json({
      status: 'success',
      data: {
        following: currentUser.following,
        followers: targetUser.followers
      }
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/v1/users/:id/unfollow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.user._id;
    
    // Get both users
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if following
    const isFollowing = currentUser.following.some(following => 
      following.user.toString() === targetUserId
    );
    
    if (!isFollowing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Not following this user'
      });
    }
    
    // Remove from current user's following
    currentUser.following = currentUser.following.filter(following => 
      following.user.toString() !== targetUserId
    );
    
    // Remove from target user's followers
    targetUser.followers = targetUser.followers.filter(follower => 
      follower.user.toString() !== currentUserId
    );
    
    // Save both users
    await currentUser.save();
    await targetUser.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        following: currentUser.following,
        followers: targetUser.followers
      }
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/v1/users/:id/followers
// @access  Public
const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).populate({
      path: 'followers.user',
      select: 'name avatar'
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        followers: user.followers,
        count: user.followersCount
      }
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get users that user is following
// @route   GET /api/v1/users/:id/following
// @access  Public
const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).populate({
      path: 'following.user',
      select: 'name avatar'
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        following: user.following,
        count: user.followingCount
      }
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Check if current user follows target user
// @route   GET /api/v1/users/:id/is-following
// @access  Private
const checkFollowingStatus = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const currentUserId = req.user._id;
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    const isFollowing = currentUser.following.some(following => 
      following.user.toString() === targetUserId
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        isFollowing,
        targetUserId
      }
    });
  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user preferences
// @route   GET /api/v1/users/preferences
// @access  Private
const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: user.preferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/v1/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  try {
    const { theme, notifications, emailNotifications } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Update only the fields that are provided
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid theme. Must be light, dark, or system'
        });
      }
      user.preferences.theme = theme;
    }
    
    if (notifications !== undefined) {
      user.preferences.notifications = notifications;
    }
    
    if (emailNotifications !== undefined) {
      user.preferences.emailNotifications = emailNotifications;
    }
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: user.preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
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
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Handle avatar upload if present
    if (req.file) {
      try {
        // If there's an existing avatar with a publicId, delete it from Cloudinary
        if (user.avatar && user.avatar.publicId) {
          const { deleteImageFromCloudinary } = require('../utils/mediaUtils');
          await deleteImageFromCloudinary(user.avatar.publicId);
        }

        const { uploadImageToCloudinary } = require('../utils/mediaUtils');
        const uploadResult = await uploadImageToCloudinary(req.file);
        user.avatar = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error("Error uploading avatar to Cloudinary:", uploadError);
        return res.status(400).json({
          status: "fail",
          message: "Error uploading avatar"
        });
      }
    }

    // Update other user fields (excluding avatar from req.body)
    const allowedUpdates = ['name', 'email'];
    const updates = Object.keys(req.body).filter(key => key !== 'avatar'); // Exclude avatar from req.body since it's handled separately
    
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidUpdate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid updates',
      });
    }

    // Check if email is being updated and already exists for another user
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email already in use',
        });
      }
    }

    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();

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

// @desc    Add location to user's saved locations
// @route   POST /api/v1/users/saved-locations
// @access  Private
const addSavedLocation = async (req, res) => {
  try {
    const locationData = req.body;
    
    // Required fields validation with support for different data formats
    let id = locationData.id;
    let name = locationData.name || locationData.title;
    
    // If it's a post object, extract location info appropriately
    if (!id && locationData._id) {
      id = locationData._id;
    }
    
    if (!name && locationData.name) {
      name = locationData.name;
    } else if (!name && locationData.title) {
      name = locationData.title;
    }
    
    if (!id || !name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Location ID and name are required'
      });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if location is already saved
    const isAlreadySaved = user.savedLocations.some(saved => 
      saved.id === id
    );
    
    if (isAlreadySaved) {
      return res.status(400).json({
        status: 'fail',
        message: 'Location already saved'
      });
    }
    
    // Create a proper location object with only the required fields
    const savedLocation = {
      id: id,
      name: name,
      latitude: locationData.latitude || locationData.position?.[0] || null,
      longitude: locationData.longitude || locationData.position?.[1] || null,
      address: locationData.address || locationData.description || '',
      placeId: locationData.placeId || locationData.id || id,
      type: locationData.type || 'location',
      category: locationData.category || 'general',
      description: locationData.description || locationData.name || name,
      postedBy: locationData.postedBy || '',
      datePosted: locationData.datePosted || new Date().toISOString(),
      savedAt: new Date()
    };
    
    // Add to saved locations (add to the beginning of the array)
    user.savedLocations.unshift(savedLocation);
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        user: user._id,
        savedLocations: user.savedLocations
      }
    });
  } catch (error) {
    console.error('Error adding saved location:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Remove location from user's saved locations
// @route   DELETE /api/v1/users/saved-locations/:locationId
// @access  Private
const removeSavedLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Remove from saved locations
    user.savedLocations = user.savedLocations.filter(location => 
      location.id !== locationId
    );
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        user: user._id,
        savedLocations: user.savedLocations
      }
    });
  } catch (error) {
    console.error('Error removing saved location:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's saved locations
// @route   GET /api/v1/users/saved-locations
// @access  Private
const getSavedLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedLocations');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        savedLocations: user.savedLocations
      }
    });
  } catch (error) {
    console.error('Error fetching saved locations:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
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
  isFavorite,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  checkFollowingStatus,
  getUserPreferences,
  updateUserPreferences,
  addSavedLocation,
  removeSavedLocation,
  getSavedLocations
};