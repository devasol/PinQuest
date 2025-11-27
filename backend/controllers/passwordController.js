const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/email');

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success response even if user doesn't exist to prevent email enumeration
      return res.status(200).json({
        status: 'success',
        message: 'Password reset email sent if user exists'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiration (10 minutes)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Construct the reset URL - this should point to the frontend page
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send email with reset token
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailSent) {
      // For development, if email fails, clear the reset token and return error
      // In production, you might want to handle this differently
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      // Check if this is a configuration issue
      if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log("SMTP not configured. In a real application, an email would be sent with the reset link:", resetUrl);
        return res.status(200).json({
          status: 'success',
          message: 'Password reset instructions would be sent via email in a production environment. For development, here is the reset URL: ' + resetUrl
        });
      } else {
        console.log("Email configuration exists but sending failed. Check SMTP settings.");
        return res.status(500).json({
          status: 'error',
          message: 'Error sending password reset email. Please check server logs for details.'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    
    // Clear any existing reset tokens for the user if there's an error and user exists
    try {
      const { email } = req.body;
      if (email) {
        const user = await User.findOne({ email });
        if (user && user.resetPasswordToken) {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          await user.save({ validateBeforeSave: false });
        }
      }
    } catch (saveError) {
      console.error('Error clearing reset token:', saveError);
    }

    res.status(500).json({
      status: 'error',
      message: 'Error sending password reset email'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;

    if (!password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a new password'
      });
    }

    // Hash the incoming token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Generate new JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user password
// @route   PUT /api/v1/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both current and new passwords'
      });
    }

    // Get user from token (populated by protect middleware)
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Admin update any user's password
// @route   PUT /api/v1/admin/users/:userId/password
// @access  Private (admin only)
const adminUpdateUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { userId } = req.params;

    if (!newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a new password'
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Find the user to update
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User password updated successfully'
    });
  } catch (error) {
    console.error('Error updating user password by admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Validate password reset token
// @route   GET /api/v1/auth/reset-password/:resetToken
// @access  Public
const validateResetToken = async (req, res) => {
  try {
    const { resetToken } = req.params;

    if (!resetToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Reset token is required'
      });
    }

    // Hash the incoming token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password reset token is invalid or has expired'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Valid token'
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error validating password reset token'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  updatePassword,
  adminUpdateUserPassword,
  validateResetToken
};