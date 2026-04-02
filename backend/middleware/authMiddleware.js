const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendErrorResponse } = require('../utils/errorHandler');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    logger.debug('Token received for verification', { tokenPrefix: token.substring(0, 20) + '...' });

    try {
      // Validate token length (should be reasonable length for JWTs)
      if (token.length < 100) {
        logger.warn('Token length too short, likely invalid', { tokenLength: token.length });
        return sendErrorResponse(res, 401, 'Invalid token format');
      }

      // First, try to verify as a JWT token (for traditional login)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('Traditional JWT token decoded successfully', { userId: decoded.id });

        // Get user from token and attach to request
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          logger.warn('User not found for traditional JWT token ID', { userId: decoded.id });
          return sendErrorResponse(res, 401, 'Not authorized, user not found');
        }

        // Check if user is banned
        if (req.user.isBanned) {
          logger.warn('Banned user attempted to access protected route', { userId: req.user._id });
          return sendErrorResponse(res, 401, 'Account is banned');
        }

        logger.info('User authenticated successfully with traditional JWT', { 
          userId: req.user._id, 
          name: req.user.name 
        });
        return next();
      } catch (jwtError) {
      // Import the new Firebase utility
      const { verifyFirebaseToken } = require('../utils/firebaseUtils');

      try {
        // Securely verify the Firebase ID token using Google's public keys
        const decodedToken = await verifyFirebaseToken(token);
        logger.info('Firebase token verified successfully with public keys', { 
          userId: decodedToken.uid || decodedToken.sub, 
          email: decodedToken.email 
        });

        // Get user from database - check googleId or email mapping
        const user = await User.findOne({ 
          $or: [
            { googleId: decodedToken.uid || decodedToken.sub },
            { email: decodedToken.email }
          ]
        });

        if (!user) {
          logger.warn('User not found in database for verified Firebase token', { 
            uid: decodedToken.uid || decodedToken.sub,
            email: decodedToken.email 
          });
          return sendErrorResponse(res, 401, 'User not found in database');
        }

        // Check if user is banned
        if (user.isBanned) {
          logger.warn('Banned user attempted to access protected route with Firebase token', { userId: user._id });
          return sendErrorResponse(res, 401, 'Account is banned');
        }

        // Attach user to request
        req.user = user;
        logger.debug('Authenticated user attached to request via Firebase', { userId: user._id });
        return next();

      } catch (authError) {
        logger.error('Firebase authentication failed:', authError.message);
        
        // Handle specific JWT/Firebase errors if needed
        if (authError.name === 'TokenExpiredError') {
          return sendErrorResponse(res, 401, 'Token expired');
        }
        
        return sendErrorResponse(res, 401, 'Not authorized, token failed');
      }

      }
    } catch (error) {
      logger.error('Authentication middleware failed', { 
        error: error.message, 
        stack: error.stack,
        name: error.name 
      });
      
      return sendErrorResponse(res, 500, 'Internal server error during authentication');
    }
  }

  if (!token) {
    logger.warn('No token provided in authorization header', { userAgent: req.get('User-Agent'), ip: req.ip });
    return sendErrorResponse(res, 401, 'Not authorized, no token');
  }
};

const admin = async (req, res, next) => {
  // First ensure user is authenticated
  if (!req.user) {
    return sendErrorResponse(res, 401, 'Not authorized, no user attached to request');
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
  }

  next();
};

module.exports = { protect, admin };