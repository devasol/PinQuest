const express = require('express');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(logoutUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

module.exports = router;