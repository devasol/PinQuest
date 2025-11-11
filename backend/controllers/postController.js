const Post = require("../models/posts");

const createPost = async (req, res) => {
  try {
    const { title, description, image, postedBy, location, category } = req.body;

    // Validate required location fields
    if (!location || typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
      return res.status(400).json({
        status: "fail",
        message: "Location with latitude and longitude is required"
      });
    }

    const newPost = new Post({
      title,
      description,
      image,
      postedBy,
      category: category || "general",
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)], // [longitude, latitude] for GeoJSON
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      }
    });

    const savedPost = await newPost.save();
    res.status(201).json({
      status: "success",
      data: savedPost
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ datePosted: -1 });
    console.log(`Fetched ${posts.length} posts from database`);
    res.status(200).json({
      status: "success",
      data: posts
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

// Get posts within a certain radius of a location
const getPostsByLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query; // radius in kilometers

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: "fail",
        message: "Latitude and longitude are required"
      });
    }

    // Convert radius from kilometers to meters for MongoDB query
    const radiusInMeters = radius * 1000;

    const posts = await Post.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    res.status(200).json({
      status: "success",
      data: posts
    });
  } catch (error) {
    console.error("Error fetching posts by location:", error);
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
  deletePost,
  getPostsByLocation
};