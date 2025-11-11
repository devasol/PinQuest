const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      logger.debug('Token received for verification', { tokenPrefix: token.substring(0, 20) + '...' });

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.debug('Token decoded successfully', { userId: decoded.id });

      // Get user from token and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        logger.warn('User not found for token ID', { userId: decoded.id });
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, user not found',
        });
      }

      logger.info('User authenticated successfully', { userId: req.user._id, name: req.user.name });
      next();
    } catch (error) {
      logger.error('Token verification failed', { error: error.message, name: error.name, stack: error.stack });
      
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
    logger.warn('No token provided in authorization header', { userAgent: req.get('User-Agent'), ip: req.ip });
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token',
    });
  }
};

module.exports = { protect };