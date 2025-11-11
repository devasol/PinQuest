const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token.substring(0, 20) + '...'); // Log first 20 chars

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully for user ID:', decoded.id);

      // Get user from token and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('User not found for ID:', decoded.id);
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, user not found',
        });
      }

      console.log('User authenticated successfully:', req.user._id, 'Name:', req.user.name);
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      
      // Check if it's a specific JWT error
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Token expired',
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid token',
        });
      } else {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, token failed',
        });
      }
    }
  }

  if (!token) {
    console.log('No token provided in authorization header');
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token',
    });
  }
};

module.exports = { protect };