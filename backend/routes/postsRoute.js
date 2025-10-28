const express = require("express");
const router = express.Router();
const { 
  createPost, 
  getAllPosts, 
  getPostById, 
  updatePost, 
  deletePost 
} = require("../controllers/postController");

// Routes
router.route("/")
  .post(createPost)
  .get(getAllPosts);

router.route("/:id")
  .get(getPostById)
  .patch(updatePost)
  .delete(deletePost);

module.exports = router;