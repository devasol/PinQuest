const Post = require("../models/posts");

const createPost = async (req, res) => {
  try {
    const { title, description, image, postedBy, location } = req.body;

    const newPost = new Post({
      title,
      description,
      image,
      postedBy,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    const savedPost = await newPost.save();
    res.status(201).json({
      status: "success",
      data: savedPost
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ datePosted: -1 });
    res.status(200).json({
      status: "success",
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: post
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: post
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }
    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
};