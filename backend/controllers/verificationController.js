const User = require('../models/User');
const { sendVerificationEmail, sendVerificationReminderEmail } = require('../utils/email');
const crypto = require('crypto');

/**
 * Generate a random verification code
 * @returns {string} - 6-digit verification code
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Register user with email verification
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

    // Generate verification code and expiry time
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create new user with verification fields
    const user = await User.create({
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      return res.status(500).json({
        status: 'error',
        message: 'User created but verification email could not be sent. Please try again later.',
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'User created successfully. Please check your email for the verification code.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
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
 * Verify email with code
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and verification code',
      });
    }

    // Find user with the provided email and verification code
    const user = await User.findOne({
      email,
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }, // Check if code hasn't expired
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification code',
      });
    }

    // Update user to verified status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate JWT token after verification
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
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
 * Resend verification code
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

    if (user.isVerified) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already verified',
      });
    }

    // Generate new verification code and expiry time
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user with new verification code
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationReminderEmail(email, verificationCode);
    if (!emailSent) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Verification code resent successfully. Please check your email.',
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