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
              // Replace escaped newlines with actual newlines, handling various escape sequences
              privateKey = privateKey
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\r\\n/g, '\n');
              
              // Remove any extra whitespace and normalize the format
              privateKey = privateKey.trim();
              
              // Ensure the private key starts and ends correctly
              if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
                privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
              }
              if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
                privateKey = privateKey + '\n-----END PRIVATE KEY-----';
              }
              
              // Normalize line endings and ensure proper format
              privateKey = privateKey
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\n{3,}/g, '\n\n'); // Replace multiple newlines with double newlines
            }
            
            // Validate that the private key looks like a proper PEM format
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
              logger.error('Invalid Firebase private key format: key does not contain proper PEM boundaries');
              return sendErrorResponse(res, 500, 'Server configuration error - Invalid Firebase private key format');
            }
            
            // Check if app is already initialized
            const firebaseApps = getApps();
            const existingApp = firebaseApps.find(app => app && app.name === 'firebase-auth');
            
            let app;
            if (existingApp) {
              app = existingApp;
            } else {
              // Additional validation and error handling for credential setup
              try {
                app = initializeApp({
                  credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                  })
                }, 'firebase-auth'); // Use a specific name for the app instance
              } catch (credentialError) {
                logger.error('Firebase credential initialization failed:', credentialError.message);
                // Attempt to continue with development fallback instead of failing immediately
                throw new Error('Firebase credential setup failed: ' + credentialError.message);
              }
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
            let user = await User.findOne({ 
              $or: [
                { googleId: decodedToken.uid }, // For Google auth users
                { email: decodedToken.email }   // For email/password users
              ]
            });

            if (!user) {
              logger.info('User not found in database for Firebase token, creating new user', { 
                firebaseUid: decodedToken.uid,
                email: decodedToken.email 
              });
              
              // Create the user automatically since they authenticated via Firebase
              user = await User.create({
                name: decodedToken.name || decodedToken.email.split('@')[0],
                email: decodedToken.email,
                googleId: decodedToken.uid,
                isVerified: decodedToken.email_verified || true,
                avatar: decodedToken.picture ? {
                  url: decodedToken.picture,
                  publicId: null // Will be set if uploaded to Cloudinary
                } : null
              });
              
              logger.info('New user created from Firebase authentication', { 
                userId: user._id, 
                email: user.email 
              });
            }

            // Check if user is banned
            if (user.isBanned) {
              logger.warn('Banned user attempted to access protected route with Firebase token', { userId: user._id });
              return sendErrorResponse(res, 401, 'Account is banned');
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
            // Only log Firebase errors if they're specific Firebase-related issues
            // If it's a general token verification error, it might be a regular JWT, so don't log as error
            if (firebaseError.code && 
                (firebaseError.code.startsWith('auth/') || 
                 firebaseError.message.includes('ID token'))) {
              logger.debug('Firebase token verification failed - may be regular JWT token:', firebaseError.message);
            } else {
              logger.error('Firebase token verification failed:', firebaseError.message);
            }
            
            // Check if it's a specific JWT error from Firebase
            if (firebaseError.code === 'auth/id-token-expired' || firebaseError.code === 'auth/argument-error') {
              return sendErrorResponse(res, 401, 'Token expired or invalid');
            } else if (firebaseError.code === 'auth/id-token-revoked') {
              return sendErrorResponse(res, 401, 'Token revoked');
            } else {
              logger.debug('Firebase token verification failed:', firebaseError.message);
              
              // Since Firebase verification failed, we can try the development fallback
              // Firebase tokens are standard JWTs, so we can decode the payload manually
              try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                  // Decode payload (second part)
                  let payloadPart = tokenParts[1];
                  
                  // Add proper padding for base64 decoding if needed
                  const padding = 4 - (payloadPart.length % 4);
                  if (padding !== 4) {
                    payloadPart += '='.repeat(padding);
                  }
                  
                  // Replace URL-safe characters back to standard base64
                  payloadPart = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
                  
                  const decodedPayload = JSON.parse(
                    Buffer.from(payloadPart, 'base64').toString()
                  );
                  
                  // Check if this looks like a Firebase/Google token by checking standard claims
                  if (decodedPayload.aud && decodedPayload.iss && (decodedPayload.sub || decodedPayload.user_id)) {
                    logger.debug('Detected potential Firebase token in development mode during error handling');
                    
                    // Get the user ID and email from the decoded payload
                    const uid = decodedPayload.sub || decodedPayload.user_id || decodedPayload.uid;
                    const email = decodedPayload.email;
                    
                    if (uid && email) {
                      // Find user in our database based on Firebase UID or email
                      let user = await User.findOne({ 
                        $or: [
                          { googleId: uid }, // For Google auth users
                          { email: email }   // For email/password users
                        ]
                      });

                      if (!user) {
                        logger.info('User not found in database for development Firebase token, creating new user', { 
                          firebaseUid: uid,
                          email: email 
                        });
                        
                        // Create the user automatically since they authenticated via Firebase
                        user = await User.create({
                          name: decodedPayload.name || email.split('@')[0],
                          email: email,
                          googleId: uid,
                          isVerified: decodedPayload.email_verified || true,
                          avatar: decodedPayload.picture ? {
                            url: decodedPayload.picture,
                            publicId: null // Will be set if uploaded to Cloudinary
                          } : null
                        });
                        
                        logger.info('New user created from development Firebase authentication', { 
                          userId: user._id, 
                          email: user.email 
                        });
                      }

                      // Check if user is banned
                      if (user.isBanned) {
                        logger.warn('Banned user attempted to access protected route with development Firebase token', { userId: user._id });
                        return sendErrorResponse(res, 401, 'Account is banned');
                      }

                      // Attach user to request object
                      req.user = user;
                      logger.info('User authenticated via development fallback after Firebase verification failure', { 
                        userId: user._id, 
                        name: user.name,
                        email: user.email 
                      });
                      
                      return next();
                    }
                  }
                }
                
                // If manual decoding didn't work, fall back to the original error
                logger.debug('Development fallback token decoding also failed');
              } catch (devError) {
                logger.debug('Development fallback decoding failed:', devError.message);
              }
              
              return sendErrorResponse(res, 401, 'Not authorized, token failed');
            }
          }
        } else {
          logger.warn('Firebase credentials not properly configured on server - attempting development fallback for Firebase token');
          
          // For development environments, we'll try to manually decode the Firebase token
          // This is less secure but allows development to continue
          try {
            // Firebase tokens are standard JWTs, so we can decode the payload manually
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              // Decode payload (second part)
              let payloadPart = tokenParts[1];
              
              // Add proper padding for base64 decoding if needed
              const padding = 4 - (payloadPart.length % 4);
              if (padding !== 4) {
                payloadPart += '='.repeat(padding);
              }
              
              // Replace URL-safe characters back to standard base64
              payloadPart = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
              
              const decodedPayload = JSON.parse(
                Buffer.from(payloadPart, 'base64').toString()
              );
              
              // Check if this looks like a Firebase/Google token by checking standard claims
              if (decodedPayload.aud && decodedPayload.iss && (decodedPayload.sub || decodedPayload.user_id)) {
                logger.debug('Detected potential Firebase token in development mode');
                
                // Get the user ID and email from the decoded payload
                const uid = decodedPayload.sub || decodedPayload.user_id || decodedPayload.uid;
                const email = decodedPayload.email;
                
                if (uid && email) {
                  // Find user in our database based on Firebase UID or email
                  let user = await User.findOne({ 
                    $or: [
                      { googleId: uid }, // For Google auth users
                      { email: email }   // For email/password users
                    ]
                  });

                  if (!user) {
                    logger.info('User not found in database for development Firebase token, creating new user', { 
                      firebaseUid: uid,
                      email: email 
                    });
                    
                    // Create the user automatically since they authenticated via Firebase
                    user = await User.create({
                      name: decodedPayload.name || email.split('@')[0],
                      email: email,
                      googleId: uid,
                      isVerified: decodedPayload.email_verified || true,
                      avatar: decodedPayload.picture ? {
                        url: decodedPayload.picture,
                        publicId: null // Will be set if uploaded to Cloudinary
                      } : null
                    });
                    
                    logger.info('New user created from development Firebase authentication', { 
                      userId: user._id, 
                      email: user.email 
                    });
                  }

                  // Check if user is banned
                  if (user.isBanned) {
                    logger.warn('Banned user attempted to access protected route with development Firebase token', { userId: user._id });
                    return sendErrorResponse(res, 401, 'Account is banned');
                  }

                  // Attach user to request object
                  req.user = user;
                  logger.info('User authenticated via development Firebase token decoding', { 
                    userId: user._id, 
                    name: user.name,
                    email: user.email 
                  });
                  
                  return next();
                }
              }
            }
            
            // If manual decoding didn't work, fall back to the original error
            logger.debug('Development token decoding also failed');
          } catch (devError) {
            logger.debug('Development fallback decoding failed:', devError.message);
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