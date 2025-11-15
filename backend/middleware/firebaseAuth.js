// This middleware is not currently used in the implemented solution.
// The authentication happens through the token exchange in authController.
// We'll leave this file in place but it's not actively used.

const logger = require('../utils/logger');

const firebaseAuth = async (req, res, next) => {
  logger.warn('Firebase auth middleware called - this is not currently implemented for direct use');
  return res.status(500).json({
    status: 'error',
    message: 'Firebase auth middleware not properly configured for this setup',
  });
};

module.exports = { firebaseAuth };