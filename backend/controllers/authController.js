const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../utils/mediaUtils');

const generateToken = (id) => {
  logger.debug('Generating token for user ID:', { userId: id });
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d', // Use the environment variable for expiration
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email and password',
      });
    }

    logger.info('Registration attempt', { email });
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn('Registration failed - user already exists', { email });
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email',
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      logger.info('User successfully registered', { userId: user._id, name: user.name, email: user.email });
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } else {
      logger.error('Failed to create user', { name, email });
      res.status(400).json({
        status: 'fail',
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    logger.error('Error registering user', { error: error.message, stack: error.stack, code: error.code, name: error.name });
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: 'fail',
        message: `${field} already exists`,
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    logger.info('Login attempt', { email });
    
    // Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { userId: user._id, email });
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    logger.info('User successfully logged in', { userId: user._id, name: user.name, email: user.email });
    
    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    logger.error('Error logging in user', { error: error.message, stack: error.stack, code: error.code, name: error.name });
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // In a real application, you might want to add the token to a blacklist
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      logger.warn('Profile fetch failed - user not found', { userId: req.user._id });
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    logger.debug('Profile fetched successfully', { userId: user._id, name: user.name });
    
    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        favoritesCount: user.favoritesCount,
        followingCount: user.followingCount,
        followersCount: user.followersCount,
        preferences: user.preferences
      },
    });
  } catch (error) {
    logger.error('Error fetching user profile', { error: error.message, stack: error.stack, userId: req.user._id });
    
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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
          await deleteImageFromCloudinary(user.avatar.publicId);
        }

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
    
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
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

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
};