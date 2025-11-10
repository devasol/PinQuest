const express = require('express');
const passport = require('passport');
const { signup, login, googleLogin, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../utils/jwt');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false }), 
  googleLogin
);

// Protected route to get user profile
router.get('/profile', authenticateToken, getProfile);

module.exports = router;