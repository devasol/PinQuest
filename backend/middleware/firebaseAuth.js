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

      // Import Firebase Admin SDK inside the function to avoid conflicts
      const { initializeApp, cert, getApps } = require('firebase-admin/app');
      const { getAuth } = require('firebase-admin/auth');

      // Initialize Firebase Admin SDK if credentials are properly configured
      let app;
      
      // Check if we have the required Firebase credentials
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        try {
          // Replace escaped newlines in the private key and ensure proper format
          let privateKey = process.env.FIREBASE_PRIVATE_KEY;
          
          // Handle different possible formats of the private key
          if (typeof privateKey === 'string') {
            // Replace escaped newlines with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
            
            // Ensure the private key starts and ends correctly
            if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
              privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
            }
            if (!privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
              privateKey = privateKey + '\n-----END PRIVATE KEY-----\n';
            }
          }
          
          // Validate that the private key looks like a proper PEM format
          if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
            logger.error('Invalid Firebase private key format: key does not contain proper PEM boundaries');
            return res.status(500).json({
              status: 'error',
              message: 'Server configuration error - Invalid Firebase private key format',
            });
          }
          
          // Check if app is already initialized
          const firebaseApps = getApps();
          const existingApp = firebaseApps.find(app => app && app.name === 'firebase-auth');
          
          if (existingApp) {
            app = existingApp;
          } else {
            app = initializeApp({
              credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
              })
            }, 'firebase-auth'); // Use a specific name for the app instance
          }
          
          // Verify the Firebase ID token properly using Firebase Admin SDK
          const auth = getAuth(app);
          const decodedToken = await auth.verifyIdToken(token);
          logger.debug('Firebase token verified successfully', { 
            userId: decodedToken.uid, 
            email: decodedToken.email,
            isEmailVerified: decodedToken.email_verified
          });

          // Find user in our database based on Firebase UID or email
          const user = await User.findOne({ 
            $or: [
              { googleId: decodedToken.uid }, // For Google auth users
              { email: decodedToken.email }   // For email/password users
            ]
          });

          if (!user) {
            logger.warn('User not found in database for Firebase token', { 
              firebaseUid: decodedToken.uid,
              email: decodedToken.email 
            });
            return res.status(401).json({
              status: 'fail',
              message: 'User not found in database',
            });
          }

          // Attach user to request object
          req.user = user;
          logger.info('User authenticated successfully via Firebase', { 
            userId: user._id, 
            name: user.name,
            email: user.email 
          });
          
          next();
          
        } catch (verificationError) {
          logger.error('Firebase token verification failed:', verificationError.message);
          
          // Check if it's a specific JWT error from Firebase
          if (verificationError.code === 'auth/id-token-expired' || verificationError.code === 'auth/argument-error') {
            return res.status(401).json({
              status: 'fail',
              message: 'Token expired or invalid',
            });
          } else if (verificationError.code === 'auth/id-token-revoked') {
            return res.status(401).json({
              status: 'fail',
              message: 'Token revoked',
            });
          } else {
            return res.status(401).json({
              status: 'fail',
              message: 'Not authorized, token failed',
            });
          }
        }
      } else {
        logger.error('Firebase credentials not properly configured on server');
        return res.status(500).json({
          status: 'error',
          message: 'Server configuration error - Firebase not properly configured',
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