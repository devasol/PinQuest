const logger = require('../utils/logger');
const User = require('../models/User');

const firebaseAuth = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      logger.debug('Firebase token received for verification', { tokenPrefix: token.substring(0, 20) + '...' });

      // Import the new Firebase utility
      const { verifyFirebaseToken } = require('../utils/firebaseUtils');

      try {
        // Securely verify the Firebase ID token using Google's public keys
        const decodedToken = await verifyFirebaseToken(token);
        logger.info('Firebase token verified successfully with public keys', { 
          userId: decodedToken.uid || decodedToken.sub, 
          email: decodedToken.email 
        });

        // Find user in our database based on Firebase UID or email
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
          return res.status(401).json({
            status: 'fail',
            message: 'User not found in database',
          });
        }

        // Attach user to request object
        req.user = user;
        logger.info('User authenticated successfully via Firebase utility', { 
          userId: user._id, 
          name: user.name,
          email: user.email 
        });
        
        return next();
        
      } catch (authError) {
        logger.error('Firebase token verification failed:', authError.message);
        
        // Return appropriate error message
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized: ' + authError.message,
        });
      }

    } catch (error) {
      logger.error('Firebase authentication middleware failed', { 
        error: error.message, 
        stack: error.stack,
        name: error.name 
      });
      
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during authentication',
      });
    }
  } else {
    logger.warn('No token provided in authorization header for Firebase auth', { 
      userAgent: req.get('User-Agent'), 
      ip: req.ip 
    });
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token',
    });
  }
};

module.exports = { firebaseAuth };