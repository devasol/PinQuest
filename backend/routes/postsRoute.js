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
  unlikePost
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.route("/")
  .post(createPost)
  .get(getAllPosts);

// Route to get posts by location
router.get("/by-location", getPostsByLocation);

router.route("/:id")
  .get(getPostById)
  .patch(updatePost)
  .delete(deletePost);

// Like/unlike routes
router.route("/:id/like").put(protect, likePost);
router.route("/:id/unlike").put(protect, unlikePost);

module.exports = router;