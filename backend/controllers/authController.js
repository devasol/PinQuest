const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
const crypto = require('crypto');
const generateTokenUtil = require("../utils/generateToken"); // Changed variable name to avoid conflicts

const generateToken = (id) => {
  logger.debug("Generating token for user ID:", { userId: id });
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d", // Use the environment variable for expiration
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, email and password",
      });
    }

    logger.info("Registration attempt", { email });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn("Registration failed - user already exists", { email });
      return res.status(400).json({
        status: "fail",
        message: "User already exists with this email",
      });
    }

    // Create new user without verification (verification is now disabled)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: true, // User is immediately verified
    });

    if (user) {
      logger.info("User successfully registered", {
        userId: user._id,
        name: user.name,
        email: user.email,
      });

      // Create notification for admins about the new user registration
      try {
        const Notification = require('../models/Notification');
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        
        for (const admin of adminUsers) {
          const notification = new Notification({
            recipient: admin._id,
            sender: user._id,
            type: 'new_user',
            message: `New user registered: ${user.name} (${user.email})`
          });
          
          await notification.save();
        }
      } catch (notificationError) {
        logger.error('Error creating admin notification for new user:', notificationError);
        // Don't fail the registration if notification fails
      }

      res.status(201).json({
        status: "success",
        message: 'User created successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } else {
      logger.error("Failed to create user", { name, email });
      res.status(400).json({
        status: "fail",
        message: "Invalid user data",
      });
    }
  } catch (error) {
    logger.error("Error registering user", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: "fail",
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    logger.info("Login attempt", { email });

    // Check if user exists & password is correct
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn("Login failed - user not found", { email });
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    // Email verification is no longer required

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn("Login failed - invalid password", {
        userId: user._id,
        email,
      });
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    logger.info("User successfully logged in", {
      userId: user._id,
      name: user.name,
      email: user.email,
    });

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role || 'user',
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    logger.error("Error logging in user", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // In a real application, you might want to add the token to a blacklist
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      logger.warn("Profile fetch failed - user not found", {
        userId: req.user._id,
      });
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    logger.debug("Profile fetched successfully", {
      userId: user._id,
      name: user.name,
    });

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatar: user.avatar,
        isVerified: user.isVerified,
        favoritesCount: user.favoritesCount,
        followingCount: user.followingCount,
        followersCount: user.followersCount,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error("Error fetching user profile", {
      error: error.message,
      stack: error.stack,
      userId: req.user._id,
    });

    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Handle avatar upload if present (local storage)
    if (req.file) {
      try {
        // Delete existing local avatar file if present
        if (user.avatar && user.avatar.localPath) {
          await fs.promises.unlink(user.avatar.localPath).catch(() => {});
        } else if (user.avatar && user.avatar.filename) {
          const p = path.join(__dirname, "..", "uploads", user.avatar.filename);
          await fs.promises.unlink(p).catch(() => {});
        }

        if (req.file.path) {
          const filename = path.basename(req.file.path);
          const url = `${req.protocol}://${req.get(
            "host"
          )}/uploads/${filename}`;
          user.avatar = { url, filename, localPath: req.file.path };
        }
      } catch (uploadError) {
        console.error("Error handling avatar upload:", uploadError);
        return res
          .status(400)
          .json({ status: "fail", message: "Error uploading avatar" });
      }
    }

    // Update other user fields (excluding avatar from req.body)
    const allowedUpdates = ["name", "email"];
    const updates = Object.keys(req.body).filter((key) => key !== "avatar"); // Exclude avatar from req.body since it's handled separately

    const isValidUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid updates",
      });
    }

    // Check if email is being updated and already exists for another user
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          status: "fail",
          message: "Email already in use",
        });
      }
    }

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Note: Firebase Admin SDK is imported inside the firebaseAuthLogin function to avoid loading it unless needed

// @desc    Firebase authentication - exchange Firebase token for backend JWT
// @route   POST /api/v1/auth/firebase
// @access  Public
const firebaseAuthLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        status: "fail",
        message: "Firebase token is required",
      });
    }

    logger.info("Firebase token exchange attempt");

    // Import Firebase Admin SDK inside the function to avoid conflicts
    const { initializeApp, cert } = require("firebase-admin/app");
    const { getAuth } = require("firebase-admin/auth");

    // Initialize Firebase Admin SDK if credentials are properly configured
    let app;
    let decodedToken;
    let isVerifiedToken = false;

    // Check if we have the required Firebase credentials
    if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      try {
        // Replace escaped newlines in the private key and ensure proper format
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Handle different possible formats of the private key
        if (typeof privateKey === "string") {
          // Replace escaped newlines with actual newlines
          privateKey = privateKey.replace(/\\n/g, "\n").replace(/\\r/g, "\r");

          // Ensure the private key starts and ends correctly
          if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----")) {
            privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey;
          }
          if (!privateKey.endsWith("-----END PRIVATE KEY-----\n")) {
            privateKey = privateKey + "\n-----END PRIVATE KEY-----\n";
          }
        }

        // Validate that the private key looks like a proper PEM format
        if (
          !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
          !privateKey.includes("-----END PRIVATE KEY-----")
        ) {
          logger.error(
            "Invalid Firebase private key format: key does not contain proper PEM boundaries"
          );
          return res.status(500).json({
            status: "error",
            message:
              "Server configuration error - Invalid Firebase private key format",
          });
        }

        // Check if app is already initialized
        const firebaseApps = require("firebase-admin/app").getApps();
        const existingApp = firebaseApps.find(
          (app) => app && app.name === "firebase-auth"
        );

        if (existingApp) {
          app = existingApp;
        } else {
          app = initializeApp(
            {
              credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
              }),
            },
            "firebase-auth"
          ); // Use a specific name for the app instance
        }

        // Verify the Firebase ID token properly using Firebase Admin SDK
        const auth = getAuth(app);
        decodedToken = await auth.verifyIdToken(firebaseToken);
        logger.debug("Firebase token verified successfully", {
          userId: decodedToken.uid,
          email: decodedToken.email,
          isEmailVerified: decodedToken.email_verified,
        });
        isVerifiedToken = true;
      } catch (verificationError) {
        logger.error(
          "Firebase token verification failed:",
          verificationError.message
        );
        return res.status(401).json({
          status: "fail",
          message: "Invalid or expired Firebase token",
        });
      }
    } else {
      // DEVELOPMENT FALLBACK: If Firebase credentials aren't configured, try to decode the token manually
      // This is NOT secure and should only be used for development purposes
      logger.warn(
        "Firebase credentials not configured, using development fallback. THIS IS NOT SECURE FOR PRODUCTION!"
      );

      try {
        // In a real Firebase token, the payload is the second part of the JWT
        // Split the token into parts and decode the payload
        const tokenParts = firebaseToken.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        // Decode the payload (second part)
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], "base64").toString()
        );

        // Basic validation for development purposes
        if (!payload.uid || !payload.email) {
          throw new Error(
            "Token does not contain required fields (uid, email)"
          );
        }

        // For development, we'll accept this as verified if it has the basic fields
        decodedToken = payload;
        logger.debug("Firebase token decoded in development mode", {
          userId: decodedToken.uid,
          email: decodedToken.email,
          isEmailVerified: decodedToken.email_verified,
        });
        isVerifiedToken = false; // Mark as not verified since we didn't use proper Firebase verification
      } catch (decodeError) {
        logger.error(
          "Firebase token decoding failed in development mode:",
          decodeError.message
        );
        return res.status(401).json({
          status: "fail",
          message: "Invalid Firebase token format",
        });
      }
    }

    // Check if user exists in our database
    let user = await User.findOne({
      $or: [
        { googleId: decodedToken.uid }, // For Google auth users
        { email: decodedToken.email }, // For email/password users
      ],
    });

    if (!user) {
      // Create a new user if they don't exist
      // For Google users, we'll create a random password since OAuth users don't have passwords
      const userData = {
        googleId: decodedToken.uid,
        email: decodedToken.email,
        name:
          decodedToken.name ||
          decodedToken.email.split("@")[0] ||
          decodedToken.uid,
        avatar: decodedToken.picture
          ? { url: decodedToken.picture }
          : undefined,
        isVerified: decodedToken.email_verified || isVerifiedToken,
      };

      // Since this is a Google/Firebase user (has googleId), we set a random password to satisfy schema requirements
      // OAuth users won't actually use this password for authentication
      if (decodedToken.uid) {
        // Generate a random password for OAuth users (they won't use it)
        const randomPassword =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-8);
        userData.password = randomPassword;
      }

      user = await User.create(userData);

      logger.info("New user created from Firebase authentication", {
        userId: user._id,
        email: user.email,
      });
    }

    // Generate backend JWT token using the utility function
    const token = generateTokenUtil(user._id);

    logger.info("Firebase token exchanged for backend JWT successfully", {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      status: "success",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        token: token,
      },
    });
  } catch (error) {
    logger.error("Error in Firebase authentication", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });

    res.status(500).json({
      status: "error",
      message: "Internal server error during authentication",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  firebaseAuthLogin,
};
