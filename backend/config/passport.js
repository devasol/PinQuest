const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const validator = require('validator');

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Input validation
        if (!email || !password) {
          return done(null, false, { message: 'Email and password are required' });
        }

        if (!validator.isEmail(email)) {
          return done(null, false, { message: 'Invalid email format' });
        }

        if (password.length < 6) {
          return done(null, false, { message: 'Password must be at least 6 characters' });
        }

        // Sanitize input
        const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());

        // Find user by email
        const user = await User.findOne({ email: sanitizedEmail });
        
        if (!user) {
          return done(null, false, { message: 'No user found with that email' });
        }

        // Check if user is banned
        if (user.isBanned) {
          return done(null, false, { message: 'Account is banned' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy - only initialize if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Validate profile data
          if (!profile.id || !profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            return done(null, false, { message: 'Incomplete Google profile information' });
          }

          const email = profile.emails[0].value;
          if (!validator.isEmail(email)) {
            return done(null, false, { message: 'Invalid email from Google' });
          }

          // Sanitize input
          const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());

          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            // If user exists, return the user
            // Check if user is banned
            if (user.isBanned) {
              return done(null, false, { message: 'Account is banned' });
            }
            return done(null, user);
          } else {
            // Check if user with this email already exists (from email signup)
            user = await User.findOne({ email: sanitizedEmail });
            
            if (user) {
              // If user exists with email but not Google ID, add Google ID to existing account
              user.googleId = profile.id;
              user.avatar = profile.photos[0].value;
              await user.save();
              return done(null, user);
            } else {
              // Create new user
              const newUser = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: sanitizedEmail,
                avatar: profile.photos[0].value,
                isVerified: true
              });
              
              await newUser.save();
              return done(null, newUser);
            }
          }
        } catch (error) {
          return done(error, null);
        }
      }
    ));
  }

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};