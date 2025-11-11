const Post = require("../models/posts");
const { createLikeNotification, createCommentNotification } = require('../utils/notificationUtils');
const { uploadImageToCloudinary } = require('../utils/mediaUtils');
const { emitToUser, emitToPost, emitGlobal } = require('../utils/socketUtils');

const createPost = async (req, res) => {
  try {
    const { title, description, postedBy, location, category } = req.body;

    // Validate required location fields
    if (!location || typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
      return res.status(400).json({
        status: "fail",
        message: "Location with latitude and longitude is required"
      });
    }

    // Handle image upload if present
    let image = null;
    if (req.file) {
      try {
        const uploadResult = await uploadImageToCloudinary(req.file);
        image = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(400).json({
          status: "fail",
          message: "Error uploading image"
        });
      }
    } else if (req.body.image) {
      // For backward compatibility - if image is provided in request body
      image = {
        url: req.body.image,
        publicId: null // No public ID if it's not a Cloudinary upload
      };
    }

    // Use authenticated user ID for postedBy if available (from middleware)
    // This prevents users from impersonating others by changing the postedBy field in the frontend
    const postCreatorId = req.user ? req.user._id : null;

    const newPost = new Post({
      title,
      description,
      image,
      postedBy: postCreatorId, // Use the authenticated user ID, not what's provided in the request
      category: category || "general",
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)], // [longitude, latitude] for GeoJSON
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      }
    });

    const savedPost = await newPost.save();
    
    // Emit real-time event for new post
    const io = req.app.get('io');
    if (io) {
      emitGlobal(io, 'newPost', {
        post: savedPost,
        message: 'A new post has been created'
      });
    }
    
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
    const posts = await Post.find()
      .populate('postedBy', 'name email avatar') // Populate the user data for the poster
      .sort({ datePosted: -1 });
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
    })
    .populate('postedBy', 'name email avatar'); // Populate the user data for the poster

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
    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'name email avatar'); // Populate the user data for the poster
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
    const { title, description, postedBy, location, category } = req.body;

    // Find the existing post
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Check if the user is authorized to update this post
    if (existingPost.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        status: "fail",
        message: "Not authorized to update this post"
      });
    }

    // Handle image upload if present
    let image = existingPost.image; // Keep existing image by default
    if (req.file) {
      try {
        // If there's an existing image with a publicId, delete it from Cloudinary
        if (existingPost.image && existingPost.image.publicId) {
          const { deleteImageFromCloudinary } = require('../utils/mediaUtils');
          await deleteImageFromCloudinary(existingPost.image.publicId);
        }

        const uploadResult = await uploadImageToCloudinary(req.file);
        image = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        };
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(400).json({
          status: "fail",
          message: "Error uploading image"
        });
      }
    } else if (req.body.image === null || req.body.image === '') {
      // If image is explicitly set to null or empty string, clear it
      // If there's an existing image with a publicId, delete it from Cloudinary
      if (existingPost.image && existingPost.image.publicId) {
        const { deleteImageFromCloudinary } = require('../utils/mediaUtils');
        await deleteImageFromCloudinary(existingPost.image.publicId);
      }
      image = null;
    }

    // Prepare the update object
    // Don't allow changing the postedBy field - it should always remain as the original creator
    const updateData = {
      title,
      description,
      image,
      category: category || "general"
    };

    // Update location if provided
    if (location) {
      if (!location.latitude || !location.longitude) {
        return res.status(400).json({
          status: "fail",
          message: "Location with latitude and longitude is required"
        });
      }
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude)
      };
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: "success",
      data: updatedPost
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
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Check if the user is authorized to delete this post
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        status: "fail",
        message: "Not authorized to delete this post"
      });
    }

    // If the post has an image with a publicId, delete it from Cloudinary
    if (post.image && post.image.publicId) {
      const { deleteImageFromCloudinary } = require('../utils/mediaUtils');
      await deleteImageFromCloudinary(post.image.publicId);
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Emit real-time event for deleted post
    const io = req.app.get('io');
    if (io) {
      emitGlobal(io, 'postDeleted', {
        postId: req.params.id,
        message: 'A post was deleted'
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

// @desc    Like a post
// @route   PUT /api/v1/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('postedBy', '_id');
    
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(like => 
      like.user.toString() === req.user._id.toString()
    );
    
    if (alreadyLiked) {
      return res.status(400).json({
        status: "fail",
        message: "Post already liked"
      });
    }

    // Add user to likes array
    post.likes.push({ user: req.user._id });
    post.likesCount = post.likes.length;
    
    await post.save();
    
    // Create notification for the post owner
    if (post.postedBy && post.postedBy._id) {
      await createLikeNotification(post._id, req.user._id, post.postedBy._id);
    }
    
    // Emit real-time event for like
    const io = req.app.get('io');
    if (io) {
      emitToPost(io, post._id, 'postLiked', {
        postId: post._id,
        likerId: req.user._id,
        likesCount: post.likesCount,
        message: 'A post was liked'
      });
      
      // Notify the post owner
      if (post.postedBy && post.postedBy._id) {
        emitToUser(io, post.postedBy._id.toString(), 'postLikedByUser', {
          postId: post._id,
          likerId: req.user._id,
          likerName: req.user.name,
          message: `Your post "${post.title}" was liked`
        });
      }
    }
    
    res.status(200).json({
      status: "success",
      data: {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likesCount
      }
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

// @desc    Unlike a post
// @route   PUT /api/v1/posts/:id/unlike
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(like => 
      like.user.toString() === req.user._id.toString()
    );
    
    if (!alreadyLiked) {
      return res.status(400).json({
        status: "fail",
        message: "Post has not been liked yet"
      });
    }

    // Remove user from likes array
    post.likes = post.likes.filter(like => 
      like.user.toString() !== req.user._id.toString()
    );
    post.likesCount = post.likes.length;
    
    await post.save();
    
    // Emit real-time event for unlike
    const io = req.app.get('io');
    if (io) {
      emitToPost(io, post._id, 'postUnliked', {
        postId: post._id,
        unlikerId: req.user._id,
        likesCount: post.likesCount,
        message: 'A post was unliked'
      });
    }
    
    res.status(200).json({
      status: "success",
      data: {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likesCount
      }
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message
    });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/v1/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    
    // Validate input
    if (!text) {
      return res.status(400).json({
        status: "fail",
        message: "Comment text is required"
      });
    }

    const post = await Post.findById(postId).populate('postedBy', '_id');
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Create new comment
    const newComment = {
      user: req.user._id,
      text
    };

    post.comments.unshift(newComment);
    await post.save();

    // Populate the user info for the returned comment
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      });
    
    const addedComment = populatedPost.comments[0]; // First comment is the newly added one

    // Create notification for the post owner
    if (post.postedBy && post.postedBy._id && post.postedBy._id.toString() !== req.user._id.toString()) {
      await createCommentNotification(post._id, req.user._id, post.postedBy._id, text);
    }
    
    // Emit real-time event for new comment
    const io = req.app.get('io');
    if (io) {
      emitToPost(io, post._id, 'newComment', {
        postId: post._id,
        comment: addedComment,
        message: 'A new comment was added'
      });
    }
    
    res.status(201).json({
      status: "success",
      data: {
        comment: addedComment
      }
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Update a comment on a post
// @route   PUT /api/v1/posts/:postId/comments/:commentId
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    // Validate input
    if (!text) {
      return res.status(400).json({
        status: "fail",
        message: "Comment text is required"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Find the comment
    const comment = post.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found"
      });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        status: "fail",
        message: "User not authorized to update this comment"
      });
    }

    // Update the comment
    comment.text = text;
    comment.date = Date.now();
    await post.save();

    // Populate the user info for the returned comment
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      });
    
    const updatedComment = populatedPost.comments.find(c => c._id.toString() === commentId);

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment
      }
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Delete a comment from a post
// @route   DELETE /api/v1/posts/:postId/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found"
      });
    }

    const comment = post.comments[commentIndex];

    // Check if user owns the comment or is the post owner
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.postedBy && post.postedBy.toString() === req.user._id.toString();
    
    if (!isCommentOwner && !isPostOwner) {
      return res.status(401).json({
        status: "fail",
        message: "User not authorized to delete this comment"
      });
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      status: "success",
      data: null
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get all comments for a post
// @route   GET /api/v1/posts/:id/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Populate user info for all comments
    const populatedPost = await Post.findById(req.params.id)
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      });

    res.status(200).json({
      status: "success",
      data: populatedPost.comments
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Search posts
// @route   GET /api/v1/posts/search
// @access  Public
const searchPosts = async (req, res) => {
  try {
    const { q, category, limit = 10, page = 1 } = req.query;
    
    // Build search query
    let query = {};
    
    // Text search in title and description
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Filter by category if provided
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute search with pagination
    const posts = await Post.find(query)
      .populate('postedBy', 'name avatar')
      .populate({
        path: 'comments.user',
        select: 'name avatar'
      })
      .sort({ datePosted: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination info
    const total = await Post.countDocuments(query);
    
    res.status(200).json({
      status: "success",
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: parseInt(page) * limit < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get posts within a radius of a location
// @route   GET /api/v1/posts/nearby
// @access  Public
const getNearbyPosts = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: "fail",
        message: "Latitude and longitude are required"
      });
    }

    // Convert radius from kilometers to meters for MongoDB query
    const radiusInMeters = parseFloat(radius) * 1000;

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
    })
    .populate('postedBy', 'name avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    })
    .limit(parseInt(limit));

    res.status(200).json({
      status: "success",
      data: posts
    });
  } catch (error) {
    console.error("Error fetching nearby posts:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get posts within a rectangular area
// @route   GET /api/v1/posts/within
// @access  Public
const getPostsWithinArea = async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        status: "fail",
        message: "minLat, maxLat, minLng, and maxLng are required for area bounds"
      });
    }

    const posts = await Post.find({
      "location.latitude": {
        $gte: parseFloat(minLat),
        $lte: parseFloat(maxLat)
      },
      "location.longitude": {
        $gte: parseFloat(minLng),
        $lte: parseFloat(maxLng)
      }
    })
    .populate('postedBy', 'name email avatar')
    .populate({
      path: 'comments.user',
      select: 'name avatar'
    });

    res.status(200).json({
      status: "success",
      data: posts
    });
  } catch (error) {
    console.error("Error fetching posts within area:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// @desc    Get distance between user and post
// @route   GET /api/v1/posts/:id/distance
// @access  Public
const getPostDistance = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const postId = req.params.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: "fail",
        message: "Latitude and longitude are required"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found"
      });
    }

    // Calculate distance using the haversine formula
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const postLat = post.location.latitude;
    const postLng = post.location.longitude;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (postLat - userLat) * Math.PI / 180;
    const dLon = (postLng - userLng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(postLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km

    res.status(200).json({
      status: "success",
      data: {
        distance: distance,
        unit: "kilometers"
      }
    });
  } catch (error) {
    console.error("Error calculating distance:", error);
    res.status(500).json({
      status: "error",
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
  getPostsByLocation,
  likePost,
  unlikePost,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  searchPosts,
  getNearbyPosts,
  getPostsWithinArea,
  getPostDistance
};