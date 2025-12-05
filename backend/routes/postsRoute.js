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
  getPostRatings,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  searchPosts,
  advancedSearch,
  globalSearch,
  getNearbyPosts,
  getPostsWithinArea,
  getPostDistance,
  likeComment,
  replyToComment,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createPostLimiter, apiLimiter } = require("../middleware/rateLimiters");

// Routes
router
  .route("/")
  // Accept up to 10 images uploaded with field name 'images'
  .post(
    protect,
    createPostLimiter,
    (req, res, next) => {
      upload.array("images", 10)(req, res, function (err) {
        if (err instanceof require("multer").MulterError) {
          // Multer-specific errors (file size, file count, etc)
          return res
            .status(400)
            .json({ status: "error", message: `Upload error: ${err.message}` });
        } else if (err) {
          // Other errors
          return res
            .status(400)
            .json({ status: "error", message: `Upload error: ${err.message}` });
        }
        next();
      });
    },
    createPost
  )
  .get(apiLimiter, getAllPosts); // Apply API rate limiter to public endpoint

// Search routes
router.route("/search").get(apiLimiter, searchPosts);
router.route("/advanced-search").get(apiLimiter, advancedSearch);
router.route("/global-search").get(apiLimiter, globalSearch);

// Route to get posts by location
router.get("/by-location", apiLimiter, getPostsByLocation);

// Geolocation-based routes
router.get("/nearby", apiLimiter, getNearbyPosts);
router.get("/within", apiLimiter, getPostsWithinArea);
router.get("/:id/distance", apiLimiter, getPostDistance);

router
  .route("/:id")
  .get(apiLimiter, getPostById)
  // For updates accept multiple images as well (field name 'images')
  .patch(protect, upload.array("images", 10), updatePost)
  .delete(protect, deletePost);

// Ratings route - POST for adding/updating rating, GET for fetching ratings
router
  .route("/:id/ratings")
  .post(protect, addOrUpdateRating)
  .get(protect, getPostRatings);

// Like/unlike routes
router.route("/:id/like").put(protect, likePost);
router.route("/:id/unlike").put(protect, unlikePost);

// Comment routes
router.route("/:id/comments").post(protect, addComment).get(getComments);
router
  .route("/:postId/comments/:commentId")
  .put(protect, updateComment)
  .delete(protect, deleteComment);

// Comment like and reply routes
router.route("/:postId/comments/:commentId/like").post(protect, likeComment);
router
  .route("/:postId/comments/:commentId/reply")
  .post(protect, replyToComment);

module.exports = router;
