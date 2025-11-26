const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Register user with email verification (now disabled)
 * @route   POST /api/v1/auth/register-with-verification
 * @access  Public
 */
const registerUserWithVerification = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email',
      });
    }

    // Create new user (verification is now disabled)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: true, // User is immediately verified
    });

    // Generate JWT token after successful registration
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
      },
    });
  } catch (error) {
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

/**
 * Verify email (now disabled)
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // User is already verified by default now
    user.isVerified = true;
    await user.save();

    // Generate JWT token 
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    res.status(200).json({
      status: 'success',
      message: 'Email is verified',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Resend verification code (now disabled)
 * @route   POST /api/v1/auth/resend-verification
 * @access  Public
 */
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email address',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // User is already verified by default now
    if (user.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Email is already verified',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email is now verified',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports = {
  registerUserWithVerification,
  verifyEmail,
  resendVerificationCode,
};