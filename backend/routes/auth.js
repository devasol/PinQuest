const express = require('express');
const { registerUser, loginUser, logoutUser, getProfile, updateProfile } = require('../controllers/authController');
const { forgotPassword, resetPassword, updatePassword } = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(logoutUser);
router.route('/profile').get(protect, getProfile).put(protect, upload.single('avatar'), updateProfile);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:resetToken').put(resetPassword);
router.route('/update-password').put(protect, updatePassword);

module.exports = router;