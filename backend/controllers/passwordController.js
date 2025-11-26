const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that email address'
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

    // TODO: Send email with reset token
    // In a real application, you would send an email with the following URL:
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    // await sendEmail({ ...email options });

    // For now, we'll just return the token
    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent',
      data: {
        resetToken // This would normally be sent via email
      }
    });
  } catch (error) {
    // Clear any existing reset tokens if there's an error
    if (req.user) {
      req.user.resetPasswordToken = undefined;
      req.user.resetPasswordExpires = undefined;
      await req.user.save({ validateBeforeSave: false });
    }

    console.error('Error in forgot password:', error);
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

module.exports = {
  forgotPassword,
  resetPassword,
  updatePassword,
  adminUpdateUserPassword
};