const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');

// Signup endpoint
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Don't send password in response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ message: 'Validation Error', errors });
    }

    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // Check if user exists & select password field to compare
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Don't send password in response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Login with Google (will be called by Passport.js)
const googleLogin = async (req, res) => {
  try {
    // Passport.js will handle authentication
    // If we reach this point, user is authenticated
    const token = generateToken(req.user._id);

    // Don't send password in response
    const userResponse = { ...req.user._doc };
    if(userResponse.password) delete userResponse.password;

    // For Google OAuth, redirect back to frontend with token
    // You can either redirect to frontend with token in URL or set a cookie
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${token}`);
  } catch (error) {
    console.error('Google login error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user); // req.user is set by authenticateToken middleware
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't send password in response
    const userResponse = { ...user._doc };
    if(userResponse.password) delete userResponse.password;

    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  getProfile
};