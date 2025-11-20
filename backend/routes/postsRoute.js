const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsByLocation,
  likePost,
  unlikePost,
  addOrUpdateRating,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  searchPosts,
  getNearbyPosts,
  getPostsWithinArea,
  getPostDistance,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Routes
router
  .route("/")
  // Accept up to 10 images uploaded with field name 'images'
  .post(protect, upload.array("images", 10), createPost)
  .get(getAllPosts); // Get all posts should be public

// Search route
router.route("/search").get(searchPosts);

// Route to get posts by location
router.get("/by-location", getPostsByLocation);

// Geolocation-based routes
router.get("/nearby", getNearbyPosts);
router.get("/within", getPostsWithinArea);
router.get("/:id/distance", getPostDistance);

router
  .route("/:id")
  .get(getPostById)
  // For updates accept multiple images as well (field name 'images')
  .patch(protect, upload.array("images", 10), updatePost)
  .delete(protect, deletePost);

// Ratings route - only for authenticated users
router.route("/:id/ratings").post(protect, addOrUpdateRating);

// Like/unlike routes
router.route("/:id/like").put(protect, likePost);
router.route("/:id/unlike").put(protect, unlikePost);

// Comment routes
router.route("/:id/comments").post(protect, addComment).get(getComments);
router
  .route("/:postId/comments/:commentId")
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
