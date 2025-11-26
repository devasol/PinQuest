const express = require('express');
const passport = require('passport');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile, firebaseAuthLogin } = require('../controllers/authController');
const { forgotPassword, resetPassword, updatePassword } = require('../controllers/passwordController');
const { registerUserWithVerification, verifyEmail, resendVerificationCode } = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/register').post(registerUser);
router.route('/register-with-verification').post(registerUserWithVerification);
router.route('/login').post(loginUser);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-verification').post(resendVerificationCode);
router.route('/logout').post(logoutUser);
router.route('/profile').get(protect, getProfile).put(protect, upload.single('avatar'), updateProfile);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:resetToken').put(resetPassword);
router.route('/update-password').put(protect, updatePassword);

// Firebase authentication route to exchange Firebase token for backend JWT token
router.route('/firebase').post(firebaseAuthLogin);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false }), 
  (req, res) => {
    // Generate JWT token for Google login
    const token = require('jsonwebtoken').sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    // Redirect to frontend with token (you can adjust the frontend URL)
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

module.exports = router;