const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    logger.debug('Token received for verification', { tokenPrefix: token.substring(0, 20) + '...' });

    try {
      // First, try to verify as a JWT token (for traditional login)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('Traditional JWT token decoded successfully', { userId: decoded.id });

        // Get user from token and attach to request
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          logger.warn('User not found for traditional JWT token ID', { userId: decoded.id });
          return res.status(401).json({
            status: 'fail',
            message: 'Not authorized, user not found',
          });
        }

        logger.info('User authenticated successfully with traditional JWT', { 
          userId: req.user._id, 
          name: req.user.name 
        });
        return next();
      } catch (jwtError) {
        // If JWT verification fails, try Firebase token verification
        logger.debug('Traditional JWT verification failed, attempting Firebase token verification', { 
          jwtError: jwtError.message 
        });

        // Import Firebase Admin SDK inside the function to avoid conflicts
        const { initializeApp, cert, getApps } = require('firebase-admin/app');
        const { getAuth } = require('firebase-admin/auth');

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
            
            let app;
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
            logger.info('User authenticated successfully via Firebase token', { 
              userId: user._id, 
              name: user.name,
              email: user.email 
            });
            
            return next();
            
          } catch (firebaseError) {
            logger.error('Firebase token verification failed:', firebaseError.message);
            
            // Check if it's a specific JWT error from Firebase
            if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
              return res.status(401).json({
                status: 'fail',
                message: 'Token expired or invalid',
              });
            } else if (firebaseError.code === 'auth/id-token-revoked') {
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
      }
    } catch (error) {
      logger.error('Authentication middleware failed', { 
        error: error.message, 
        stack: error.stack,
        name: error.name 
      });
      
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during authentication',
      });
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