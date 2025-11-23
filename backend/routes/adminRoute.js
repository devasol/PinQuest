const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// @desc    Initialize admin user (only works if no admin exists)
// @route   POST /api/v1/admin/init
// @access  Public (for initial setup only)
const initAdmin = async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admin user already exists. Cannot initialize again for security reasons.'
      });
    }

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create admin user with role set to admin
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin'  // This is the key - setting the role to admin
    });

    // Generate JWT token
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        token
      }
    });
  } catch (error) {
    console.error('Error initializing admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create admin user (admin only)
// @route   POST /api/v1/admin/create
// @access  Private (admin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create admin user
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/v1/admin/users
// @access  Private (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

router.route('/init').post(initAdmin);
router.route('/create').post(protect, admin, createAdmin);
router.route('/users').get(protect, admin, getAllUsers);

module.exports = router;