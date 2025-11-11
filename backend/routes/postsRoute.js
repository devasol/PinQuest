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
  addComment,
  updateComment,
  deleteComment,
  getComments,
  searchPosts
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.route("/")
  .post(createPost)
  .get(getAllPosts);

// Search route
router.route("/search").get(searchPosts);

// Route to get posts by location
router.get("/by-location", getPostsByLocation);

router.route("/:id")
  .get(getPostById)
  .patch(updatePost)
  .delete(deletePost);

// Like/unlike routes
router.route("/:id/like").put(protect, likePost);
router.route("/:id/unlike").put(protect, unlikePost);

// Comment routes
router.route("/:id/comments").post(protect, addComment).get(getComments);
router.route("/:postId/comments/:commentId").put(protect, updateComment).delete(protect, deleteComment);

module.exports = router;