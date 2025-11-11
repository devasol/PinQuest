const express = require("express");
const { 
  getUserById, 
  updateUser, 
  getUserPosts, 
  deleteUser, 
  getAllUsers,
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  checkFollowingStatus
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Public routes
router.route("/").get(getAllUsers);
router.route("/:id").get(getUserById);
router.route("/:id/posts").get(getUserPosts);

// Private routes (require authentication)
router.route("/:id").put(protect, updateUser);
router.route("/:id").delete(protect, deleteUser);

// Favorites routes
router.route("/favorites").post(protect, addFavorite).get(protect, getFavorites);
router.route("/favorites/:postId").delete(protect, removeFavorite).get(protect, isFavorite);

// Following/follower routes
router.route("/:id/follow").post(protect, followUser);
router.route("/:id/unfollow").delete(protect, unfollowUser);
router.route("/:id/followers").get(getUserFollowers);
router.route("/:id/following").get(getUserFollowing);
router.route("/:id/is-following").get(protect, checkFollowingStatus);

module.exports = router;
