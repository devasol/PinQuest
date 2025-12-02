const express = require("express");
const { 
  getUserById, 
  updateUser, 
  getUserPosts, 
  deleteOwnAccount,
  getAllUsers,
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  checkFollowingStatus,
  getUserPreferences,
  updateUserPreferences,
  addSavedLocation,
  removeSavedLocation,
  getSavedLocations,
  addRecentLocation,
  removeRecentLocation,
  getRecentLocations
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { apiLimiter } = require("../middleware/rateLimiters");
const router = express.Router();

// Public routes
router.route("/").get(apiLimiter, getAllUsers);

// Specific routes that should come before the general /:id route to avoid conflicts
router.route("/:id/posts").get(apiLimiter, getUserPosts);
router.route("/saved-locations").post(protect, addSavedLocation).get(protect, getSavedLocations);
router.route("/saved-locations/:locationId").delete(protect, removeSavedLocation);
router.route("/recent-locations").post(protect, addRecentLocation).get(protect, getRecentLocations);
router.route("/recent-locations/:locationId").delete(protect, removeRecentLocation);
router.route("/favorites").post(protect, addFavorite).get(protect, getFavorites);
router.route("/favorites/:postId").delete(protect, removeFavorite).get(protect, isFavorite);
router.route("/preferences").get(protect, getUserPreferences).put(protect, updateUserPreferences);

// General user routes - these need to be grouped together
router.route("/:id")
  .get(apiLimiter, getUserById)
  .put(protect, upload.single('avatar'), updateUser)
  .delete(protect, deleteOwnAccount);

router.route("/:id/follow").post(protect, followUser);
router.route("/:id/unfollow").delete(protect, unfollowUser);
router.route("/:id/followers").get(getUserFollowers);
router.route("/:id/following").get(getUserFollowing);
router.route("/:id/is-following").get(protect, checkFollowingStatus);

module.exports = router;
