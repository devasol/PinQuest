const express = require('express');
const { 
  getCategories, 
  getPostsByCategory, 
  updatePostCategory,
  getPopularCategories
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes for categories
router.route('/').get(getCategories);
router.route('/popular').get(getPopularCategories);
router.route('/:category').get(getPostsByCategory);
router.route('/post/:id/category').put(protect, updatePostCategory);

module.exports = router;