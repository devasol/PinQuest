const User = require("../models/User");
const Post = require("../models/posts");
const { createFollowNotification } = require("../utils/notificationUtils");
const fs = require("fs");
const path = require("path");

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      status: "error",
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
        status: "fail",
        message: "Post ID is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Check if post is already favorited
    const alreadyFavorited = user.favorites.some(
      (fav) => fav.post.toString() === postId
    );

    if (alreadyFavorited) {
      return res.status(400).json({
        status: "fail",
        message: "Post already favorited",
      });
    }

    // Add to favorites
    user.favorites.unshift({ post: postId });
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        favorites: user.favorites,
      },
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        status: "fail",
        message: "User not found",
      });
    }

    // Check if post is favorited
    const favoriteIndex = user.favorites.findIndex(
      (fav) => fav.post.toString() === postId
    );

    if (favoriteIndex === -1) {
      return res.status(400).json({
        status: "fail",
        message: "Post is not favorited",
      });
    }

    // Remove from favorites
    user.favorites.splice(favoriteIndex, 1);
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        favorites: user.favorites,
      },
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's favorites
// @route   GET /api/v1/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites.post",
      populate: {
        path: "postedBy",
        select: "name email avatar",
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        favorites: user.favorites,
      },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Check if post is favorited
// @route   GET /api/v1/users/favorites/:postId
// @access  Private
const isFavorite = async (req, res) => {
  try {
    const { postId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const isFavorited = user.favorites.some(
      (fav) => fav.post.toString() === postId
    );

    res.status(200).json({
      status: "success",
      data: {
        isFavorited,
      },
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Follow a user
// @route   POST /api/v1/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const { id: followId } = req.params;

    // Don't allow user to follow themselves
    if (followId === req.user._id.toString()) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await User.findById(followId);
    if (!userToFollow) {
      return res.status(404).json({
        status: "fail",
        message: "User to follow not found",
      });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "Current user not found",
      });
    }

    // Check if already following
    const alreadyFollowing = currentUser.following.some(
      (follow) => follow.user.toString() === followId
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        status: "fail",
        message: "Already following user",
      });
    }

    // Add to current user's following list
    currentUser.following.unshift({ user: followId });
    await currentUser.save();

    // Add to user to follow's followers list
    userToFollow.followers.unshift({ user: req.user._id });
    await userToFollow.save();

    // Create follow notification
    await createFollowNotification(userToFollow._id, req.user._id);

    res.status(200).json({
      status: "success",
      data: {
        following: currentUser.following,
      },
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/v1/users/:id/unfollow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const { id: unfollowId } = req.params;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "Current user not found",
      });
    }

    // Check if following
    const followIndex = currentUser.following.findIndex(
      (follow) => follow.user.toString() === unfollowId
    );

    if (followIndex === -1) {
      return res.status(400).json({
        status: "fail",
        message: "Not following user",
      });
    }

    // Remove from current user's following list
    currentUser.following.splice(followIndex, 1);
    await currentUser.save();

    // Remove from user to unfollow's followers list
    const userToUnfollow = await User.findById(unfollowId);
    if (userToUnfollow) {
      const followerIndex = userToUnfollow.followers.findIndex(
        (follower) => follower.user.toString() === req.user._id.toString()
      );
      if (followerIndex !== -1) {
        userToUnfollow.followers.splice(followerIndex, 1);
        await userToUnfollow.save();
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        following: currentUser.following,
      },
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/v1/users/:id/followers
// @access  Public
const getUserFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "followers.user",
      select: "name email avatar",
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        followers: user.followers,
      },
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's following
// @route   GET /api/v1/users/:id/following
// @access  Public
const getUserFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "following.user",
      select: "name email avatar",
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        following: user.following,
      },
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Check if current user is following another user
// @route   GET /api/v1/users/:id/is-following
// @access  Private
const checkFollowingStatus = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "Current user not found",
      });
    }

    const isFollowing = currentUser.following.some(
      (follow) => follow.user.toString() === targetUserId
    );

    res.status(200).json({
      status: "success",
      data: {
        isFollowing,
      },
    });
  } catch (error) {
    console.error("Error checking following status:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's preferences
// @route   GET /api/v1/users/preferences
// @access  Private
const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("preferences");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Update user's preferences
// @route   PUT /api/v1/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = [
      "name",
      "email",
      "bio",
      "location",
      "preferences",
    ]; // Allowed fields

    // Filter out invalid updates
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle avatar update if present
    if (req.file) {
      updates.avatar = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Delete user's avatar if it exists
    if (user.avatar && user.avatar.publicId) {
      try {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      } catch (delErr) {
        console.error("Error deleting user avatar:", delErr);
      }
    }

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/v1/users/:id/posts
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.params.id })
      .populate("postedBy", "name email avatar")
      .sort({ datePosted: -1 });

    res.status(200).json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      status: "error",
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
        status: "fail",
        message: "Location ID and name are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Check if location is already saved
    const isAlreadySaved = user.savedLocations.some((saved) => saved.id === id);

    if (isAlreadySaved) {
      return res.status(400).json({
        status: "fail",
        message: "Location already saved",
      });
    }

    // Create a proper location object with only the required fields
    const savedLocation = {
      id: id,
      name: name,
      latitude: locationData.latitude || locationData.position?.[0] || null,
      longitude: locationData.longitude || locationData.position?.[1] || null,
      address: locationData.address || locationData.description || "",
      placeId: locationData.placeId || locationData.id || id,
      type: locationData.type || "location",
      category: locationData.category || "general",
      description: locationData.description || locationData.name || name,
      postedBy: locationData.postedBy || "",
      datePosted: locationData.datePosted || new Date().toISOString(),
      savedAt: new Date(),
    };

    // Add to saved locations (add to the beginning of the array)
    user.savedLocations.unshift(savedLocation);

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        savedLocations: user.savedLocations,
      },
    });
  } catch (error) {
    console.error("Error adding saved location:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        status: "fail",
        message: "User not found",
      });
    }

    // Remove from saved locations
    user.savedLocations = user.savedLocations.filter(
      (location) => location.id !== locationId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        savedLocations: user.savedLocations,
      },
    });
  } catch (error) {
    console.error("Error removing saved location:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's saved locations
// @route   GET /api/v1/users/saved-locations
// @access  Private
const getSavedLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("savedLocations");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        savedLocations: user.savedLocations,
      },
    });
  } catch (error) {
    console.error("Error fetching saved locations:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Add location to user's recent locations
// @route   POST /api/v1/users/recent-locations
// @access  Private
const addRecentLocation = async (req, res) => {
  try {
    const locationData = req.body;

    // Required fields validation
    let id = locationData.id;
    let title = locationData.title || locationData.name;

    if (!id && locationData._id) {
      id = locationData._id;
    }

    if (!title && locationData.name) {
      title = locationData.name;
    } else if (!title && locationData.title) {
      title = locationData.title;
    }

    if (!id || !title) {
      return res.status(400).json({
        status: "fail",
        message: "Location ID and title are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Check if location is already in recent locations
    let existingIndex = user.recentLocations.findIndex((recent) => recent.id === id);

    if (existingIndex !== -1) {
      // If already exists, move to the top by removing it first
      user.recentLocations.splice(existingIndex, 1);
    }

    // Create the recent location object
    const recentLocation = {
      id: id,
      title: title,
      description: locationData.description || "",
      position: {
        latitude: locationData.latitude || locationData.position?.latitude || locationData.position?.[0] || null,
        longitude: locationData.longitude || locationData.position?.longitude || locationData.position?.[1] || null
      },
      type: locationData.type || "location",
      postedBy: locationData.postedBy || null,
      viewedAt: new Date(),
    };

    // Add to recent locations (at the beginning of the array)
    user.recentLocations.unshift(recentLocation);

    // Limit to 20 recent locations to prevent the array from growing too large
    user.recentLocations = user.recentLocations.slice(0, 20);

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        recentLocations: user.recentLocations,
      },
    });
  } catch (error) {
    console.error("Error adding recent location:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Remove location from user's recent locations
// @route   DELETE /api/v1/users/recent-locations/:locationId
// @access  Private
const removeRecentLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Remove from recent locations
    user.recentLocations = user.recentLocations.filter(
      (location) => location.id !== locationId
    );

    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: user._id,
        recentLocations: user.recentLocations,
      },
    });
  } catch (error) {
    console.error("Error removing recent location:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user's recent locations
// @route   GET /api/v1/users/recent-locations
// @access  Private
const getRecentLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("recentLocations");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        recentLocations: user.recentLocations,
      },
    });
  } catch (error) {
    console.error("Error fetching recent locations:", error);
    res.status(500).json({
      status: "error",
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
  getSavedLocations,
  addRecentLocation,
  removeRecentLocation,
  getRecentLocations,
};