const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');
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

    // Validate and sanitize email
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address'
      });
    }

    const user = await User.findOne({ email: sanitizedEmail });
    console.log(`Forgot password request for: ${sanitizedEmail}. User found: ${!!user}`);
    
    if (!user) {
      // Return success response even if user doesn't exist to prevent email enumeration
      return res.status(200).json({
        status: 'success',
        message: 'Password reset email sent if user exists'
      });
    }

    // Generate reset OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${user.email}: ${otp}`);

    // Hash OTP and save to database
    user.resetPasswordOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    // Set OTP expiration (10 minutes for better security)
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; 

    await user.save({ validateBeforeSave: false });

    // Send email with reset OTP
    const emailSent = await sendPasswordResetEmail(user.email, otp, true)
      .catch(emailError => {
        console.error("Error sending password reset OTP:", emailError.message || emailError);
        return false;
      });

    if (!emailSent) {
      // If email failed, clear the reset OTP to prevent code from being left hanging
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log("Password reset OTP cleared because email failed to send");

      // In development, we still return success to allow testing
      if (process.env.NODE_ENV === 'development') {
        console.log("In development mode, continuing despite email failure");
        res.status(200).json({
          status: 'success',
          message: 'Password reset email sent (simulated for development)'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Error sending password reset email'
        });
      }
    } else {
      console.log("Password reset OTP email sent successfully");
      res.status(200).json({
        status: 'success',
        message: 'Password reset email sent'
      });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);

    // Clear any existing reset tokens for the user if there's an error and user exists
    try {
      const { email } = req.body;
      if (email) {
        const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
        const user = await User.findOne({ email: sanitizedEmail });
        if (user && user.resetPasswordOTP) {
          user.resetPasswordOTP = undefined;
          user.resetPasswordOTPExpires = undefined;
          await user.save({ validateBeforeSave: false });
        }
      }
    } catch (saveError) {
      console.error('Error clearing reset OTP:', saveError);
    }

    res.status(500).json({
      status: 'error',
      message: 'Error sending password reset email'
    });
  }
};

// @desc    Verify password reset OTP
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and OTP'
      });
    }

    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      email: sanitizedEmail,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying OTP'
    });
  }
};

// @desc    Reset password (OTP version)
// @route   PUT /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email, OTP, and new password'
      });
    }

    // Validate password strength
    if (!validator.isLength(password, { min: 6, max: 128 })) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 6 characters long'
      });
    }

    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with matching OTP that hasn't expired
    const user = await User.findOne({
      email: sanitizedEmail,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'OTP is invalid or has expired'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
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

    // Validate new password strength
    if (!validator.isLength(newPassword, { min: 6, max: 128 })) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must be at least 6 characters long'
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

    // Prevent new password from being same as current password
    const isNewSameAsCurrent = await user.comparePassword(newPassword);
    if (isNewSameAsCurrent) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password cannot be the same as current password'
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

    // Validate new password strength
    if (!validator.isLength(newPassword, { min: 6, max: 128 })) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must be at least 6 characters long'
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

    // Prevent admin from setting same password as current if exists
    if (user.password) {
      const isSameAsCurrent = await user.comparePassword(newPassword);
      if (isSameAsCurrent) {
        return res.status(400).json({
          status: 'fail',
          message: 'New password cannot be the same as current password'
        });
      }
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
  verifyResetOTP,
  resetPassword,
  updatePassword,
  adminUpdateUserPassword,
  validateResetToken
};