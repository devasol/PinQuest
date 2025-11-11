const express = require("express");
const router = express.Router();
const { 
  createPost, 
  getAllPosts, 
  getPostById, 
  updatePost, 
  deletePost,
  getPostsByLocation
} = require("../controllers/postController");

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

module.exports = router;