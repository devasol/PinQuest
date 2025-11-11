const express = require("express");
const { getUserById, updateUser, getUserPosts, deleteUser, getAllUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Public routes
router.route("/").get(getAllUsers);
router.route("/:id").get(getUserById);
router.route("/:id/posts").get(getUserPosts);

// Private routes (require authentication)
router.route("/:id").put(protect, updateUser);
router.route("/:id").delete(protect, deleteUser);

module.exports = router;
