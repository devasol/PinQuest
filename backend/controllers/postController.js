const Post = require("../models/posts");
const Activity = require("../models/Activity");
const validator = require('validator');
const cache = require('../utils/cache'); // Using enhanced cache (Redis with memory fallback)
const {
  createLikeNotification,
  createCommentNotification,
} = require("../utils/notificationUtils");
const { emitToUser, emitToPost, emitGlobal } = require("../utils/socketUtils");
const { processUploadedImages, deleteLocalImages } = require("../utils/imageUtils");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/errorHandler");
const path = require("path");

const createPost = async (req, res) => {
  try {
    const { title, description, postedBy, location, category } = req.body;

    // Validation
    if (!title || !description) {
      return sendErrorResponse(res, 400, "Title and description are required");
    }

    // Sanitize inputs
    const sanitizedTitle = validator.escape(validator.trim(title));
    const sanitizedDescription = validator.escape(validator.trim(description));
    const sanitizedCategory = category ? validator.escape(validator.trim(category)) : "general";

    // Validate inputs
    if (!validator.isLength(sanitizedTitle, { min: 1, max: 200 })) {
      return sendErrorResponse(res, 400, "Title must be between 1 and 200 characters");
    }

    if (!validator.isLength(sanitizedDescription, { min: 1, max: 10000 })) {
      return sendErrorResponse(res, 400, "Description must be between 1 and 10000 characters");
    }

    // Parse location if it's a JSON string (FormData sends strings)
    let parsedLocation = location;
    if (typeof parsedLocation === "string") {
      try {
        parsedLocation = JSON.parse(parsedLocation);
      } catch (e) {
        // leave as string; validation will capture missing fields
      }
    }

    let lat, lng; // Declare variables outside the conditional block
    // Check if location is provided and validate if it exists
    if (parsedLocation) {
      if (
        typeof parsedLocation.latitude === "undefined" ||
        typeof parsedLocation.longitude === "undefined"
      ) {
        return sendErrorResponse(res, 400, "Location with latitude and longitude is required");
      }

      // Validate coordinates are real numbers within valid ranges
      lat = parseFloat(parsedLocation.latitude);
      lng = parseFloat(parsedLocation.longitude);
      if (
        isNaN(lat) || 
        isNaN(lng) || 
        lat < -90 || lat > 90 || 
        lng < -180 || lng > 180
      ) {
        return sendErrorResponse(res, 400, "Invalid latitude or longitude values");
      }
    }

    // Verify that the user is authenticated
    if (!req.user) {
      return sendErrorResponse(res, 401, "Authentication required to create a post");
    }

    console.log(
      "Creating post for user:",
      req.user._id,
      "Name:",
      req.user.name
    );

    // Process uploaded images using utility
    let { image, imagesArr } = processUploadedImages(req, req.protocol, req.get("host"));
    
    // Add image links if provided in the request body
    if (req.body.imageLinks) {
      try {
        // Parse imageLinks if it's a string (happens with FormData)
        let imageLinks = req.body.imageLinks;
        if (typeof imageLinks === 'string') {
          try {
            imageLinks = JSON.parse(imageLinks);
          } catch (e) {
            // If it's not JSON, try to parse as comma-separated string or just wrap in an array
            if (imageLinks.startsWith('http')) {
              imageLinks = [imageLinks];
            } else {
              imageLinks = imageLinks.split(',').map(link => link.trim()).filter(link => link);
            }
          }
        }
        
        // Convert image links to proper format and add to imagesArr
        if (Array.isArray(imageLinks) && imageLinks.length > 0) {
          const imageLinkObjects = imageLinks
            .filter(link => typeof link === 'string' && link.startsWith('http'))
            .map(link => ({ 
              url: link, 
              publicId: null,
              source: 'url' // Mark as URL source
            }));
          
          // Add image links to the images array
          imagesArr = [...imagesArr, ...imageLinkObjects];
          
          // If image is null and we have image links, set the first one as the main image
          if (!image && imageLinkObjects.length > 0) {
            image = imageLinkObjects[0];
          }
        }
      } catch (error) {
        console.error("Error processing image links:", error);
        // Continue without image links if there's an error
      }
    }

    // Use authenticated user ID for postedBy (from middleware)
    // This ensures security by preventing users from impersonating others
    const postFields = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      image,
      images: imagesArr,
      postedBy: req.user._id, // Use the authenticated user ID
      category: sanitizedCategory,
    };

    // Add location if provided
    if (parsedLocation) {
      postFields.location = {
        type: "Point",
        coordinates: [
          lng, // longitude first in GeoJSON format
          lat, // latitude second in GeoJSON format
        ],
      };
    }

    const newPost = new Post(postFields);

    const savedPost = await newPost.save();

    // Log activity
    try {
      const activity = new Activity({
        userId: req.user._id,
        action: 'created post',
        targetType: 'post',
        targetId: savedPost._id,
        targetTitle: savedPost.title,
        metadata: {
          title: savedPost.title,
          description: savedPost.description,
          category: savedPost.category
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error saving activity:', activityError);
      // Don't fail the main request if activity logging fails
    }

    // Clear related caches - invalidate all posts pages since new post changes the list
    const postCacheKeys = await cache.keys('posts_page_*');
    for (const key of postCacheKeys) {
      await cache.del(key);
    }

    // Populate the postedBy field before sending response to include user info
    const populatedPost = await Post.findById(savedPost._id).populate(
      "postedBy",
      "name email avatar"
    );

    console.log(
      "Post created successfully:",
      savedPost._id,
      "by user:",
      req.user._id
    );

    // Emit real-time event for new post
    const io = req.app.get("io");
    if (io) {
      emitGlobal(io, "newPost", {
        post: populatedPost,
        message: "A new post has been created",
      });
    }

    sendSuccessResponse(res, 201, populatedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    console.error("Error details:", error.message, error.code, error.name);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(res, 400, "Validation error", errors);
    }

    sendErrorResponse(res, 500, error.message);
  }
};

const getAllPosts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items per page
    const skip = (page - 1) * limit;

    // Filtering options
    const filter = { status: 'published' }; // Only show published posts by default
    
    // Add category filter if provided
    if (req.query.category) {
      filter.category = validator.escape(validator.trim(req.query.category));
    }
    
    // Add search filter if provided
    if (req.query.search) {
      const search = validator.escape(validator.trim(req.query.search));
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Create cache key based on query parameters
    const cacheKey = `posts_page_${page}_limit_${limit}_category_${filter.category || 'all'}_search_${req.query.search || 'none'}`;

    // Try to get from cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      console.log(`Serving posts from cache: ${cacheKey}`);
      return res.status(200).json(cachedResult);
    }

    // Create query with filters
    const query = Post.find(filter)
      .populate("postedBy", "name email avatar") // Populate the user data for the poster
      .sort({ datePosted: -1 })
      .skip(skip)
      .limit(limit);

    const posts = await query;

    // Count total posts for pagination metadata
    const total = await Post.countDocuments(filter);

    const response = {
      status: "success",
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    console.log(`Fetched ${posts.length} posts from database, total matching: ${total}`);
    
    // Cache the result for 5 minutes (300 seconds) for non-search queries
    if (!req.query.search) {
      await cache.set(cacheKey, response, 300); // Cache for 5 minutes
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    console.error("Error details:", error.message, error.code, error.name);

    res.status(500).json({
      status: "error",
      message: error.message,
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
        message: "Latitude and longitude are required",
      });
    }

    // Convert radius from kilometers to meters for MongoDB query
    const radiusInMeters = radius * 1000;

    const posts = await Post.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).populate("postedBy", "name email avatar"); // Populate the user data for the poster

    res.status(200).json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts by location:", error);
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

const getPostById = async (req, res) => {
  try {
    // Populate user data for the poster and for all comments
    const post = await Post.findById(req.params.id)
      .populate("postedBy", "name email avatar")
      .populate({
              path: "comments.user",
              select: "name _id", // Standardize to name and _id
            })
              .populate({
                path: "comments.replies.user",
                select: "name _id", // Standardize to name and _id
              }); // Populate the user data for the poster and comments
    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }
    sendSuccessResponse(res, 200, post);
  } catch (error) {
    sendErrorResponse(res, 400, error.message);
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, description, postedBy, location, category } = req.body;

    // Find the existing post
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Check if the user is authorized to update this post
    if (existingPost.postedBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 401, "Not authorized to update this post");
    }

    console.log("Updating post:", req.params.id, "by user:", req.user._id);

    // Delete existing images if new images are being uploaded
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Delete any existing local files referenced by the post prior to replacing
      await deleteLocalImages(existingPost.images, path.join(__dirname, "..", "uploads"));
    } else if (req.body.image === null || req.body.image === "") {
      // If image is explicitly set to null or empty string, clear it
      await deleteLocalImages(existingPost.images, path.join(__dirname, "..", "uploads"));
    }

    // Process uploaded images using utility
    let { image, imagesArr } = processUploadedImages(req, req.protocol, req.get("host"));
    
    // Add image links if provided in the request body
    if (req.body.imageLinks) {
      try {
        // Parse imageLinks if it's a string (happens with FormData)
        let imageLinks = req.body.imageLinks;
        if (typeof imageLinks === 'string') {
          try {
            imageLinks = JSON.parse(imageLinks);
          } catch (e) {
            // If it's not JSON, try to parse as comma-separated string or just wrap in an array
            if (imageLinks.startsWith('http')) {
              imageLinks = [imageLinks];
            } else {
              imageLinks = imageLinks.split(',').map(link => link.trim()).filter(link => link);
            }
          }
        }
        
        // Convert image links to proper format and add to imagesArr
        if (Array.isArray(imageLinks) && imageLinks.length > 0) {
          const imageLinkObjects = imageLinks
            .filter(link => typeof link === 'string' && link.startsWith('http'))
            .map(link => ({ 
              url: link, 
              publicId: null,
              source: 'url' // Mark as URL source
            }));
          
          // Add image links to the images array
          imagesArr = [...imagesArr, ...imageLinkObjects];
          
          // If image is null and we have image links, set the first one as the main image
          if (!image && imageLinkObjects.length > 0) {
            image = imageLinkObjects[0];
          }
        }
      } catch (error) {
        console.error("Error processing image links in update:", error);
        // Continue without image links if there's an error
      }
    }

    // Prepare the update object
    // Don't allow changing the postedBy field - it should always remain as the original creator
    const updateData = {
      title,
      description,
      image,
      images: imagesArr,
      category: category || "general",
    };

    // Update location if provided
    if (location) {
      if (
        typeof location.latitude === "undefined" ||
        typeof location.longitude === "undefined"
      ) {
        return sendErrorResponse(res, 400, "Location with latitude and longitude is required");
      }
      updateData.location = {
        type: "Point",
        coordinates: [
          parseFloat(location.longitude),
          parseFloat(location.latitude),
        ],
      };
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("postedBy", "name email avatar"); // Populate user data for response

    // Clear related caches
    // Invalidation: Remove any posts cache that might contain this updated post
    const postCacheKeys = await cache.keys('posts_page_*');
    for (const key of postCacheKeys) {
      await cache.del(key);
    }

    console.log("Post updated successfully:", updatedPost._id);

    sendSuccessResponse(res, 200, updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    console.error("Error details:", error.message, error.code, error.name);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(res, 400, "Validation error", errors);
    }

    sendErrorResponse(res, 500, error.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Check if the user is authorized to delete this post
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse(res, 401, "Not authorized to delete this post");
    }

    console.log("Deleting post:", req.params.id, "by user:", req.user._id);

    // Delete local images if they exist
    await deleteLocalImages(post.images, path.join(__dirname, "..", "uploads"));
    if (post.image && post.image.localPath) {
      // Fallback for posts using legacy single image field stored locally
      await deleteLocalImages([post.image], path.join(__dirname, "..", "uploads"));
    }

    await Post.findByIdAndDelete(req.params.id);

    // Clear related caches
    // Invalidation: Remove any posts cache that might contain this deleted post
    const postCacheKeys = await cache.keys('posts_page_*');
    for (const key of postCacheKeys) {
      await cache.del(key);
    }

    console.log("Post deleted successfully:", req.params.id);

    // Emit real-time event for deleted post
    const io = req.app.get("io");
    if (io) {
      emitGlobal(io, "postDeleted", {
        postId: req.params.id,
        message: "A post was deleted",
      });
    }

    sendSuccessResponse(res, 204, null);
  } catch (error) {
    console.error("Error deleting post:", error);
    console.error("Error details:", error.message, error.code, error.name);

    sendErrorResponse(res, 500, error.message);
  }
};

// @desc    Like a post
// @route   PUT /api/v1/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "postedBy",
      "_id name"
    );

    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(
      (like) => like.user.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // If already liked, return success response instead of error
      return sendSuccessResponse(res, 200, {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likesCount,
        message: "Post already liked"
      });
    }

    // Add user to likes array
    post.likes.push({ user: req.user._id });
    post.likesCount = post.likes.length;

    await post.save();

    // Log activity
    try {
      const activity = new Activity({
        userId: req.user._id,
        action: 'liked post',
        targetType: 'post',
        targetId: post._id,
        targetTitle: post.title,
        metadata: {
          postTitle: post.title,
          postDescription: post.description
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error saving activity:', activityError);
      // Don't fail the main request if activity logging fails
    }

    // Create notification for the post owner
    if (post.postedBy && post.postedBy._id.toString()) {
      await createLikeNotification(post._id, req.user._id, post.postedBy._id);
    }

    // Emit real-time event for like
    const io = req.app.get("io");
    if (io) {
      emitToPost(io, post._id, "postLiked", {
        postId: post._id,
        likerId: req.user._id,
        likesCount: post.likesCount,
        message: "A post was liked",
      });

      // Notify the post owner
      if (post.postedBy && post.postedBy._id.toString()) {
        emitToUser(io, post.postedBy._id.toString(), "postLikedByUser", {
          postId: post._id,
          likerId: req.user._id,
          likerName: req.user.name, // req.user.name should be available from auth middleware
          message: `Your post "${post.title}" was liked`,
        });
      }
    }

    sendSuccessResponse(res, 200, {
      postId: post._id,
      likes: post.likes,
      likesCount: post.likesCount,
    });
  } catch (error) {
    sendErrorResponse(res, 400, error.message);
  }
};

// @desc    Unlike a post
// @route   PUT /api/v1/posts/:id/unlike
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(
      (like) => like.user.toString() === req.user._id.toString()
    );

    if (!alreadyLiked) {
      // If not liked, return success response instead of error
      return sendSuccessResponse(res, 200, {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likesCount,
        message: "Post was not liked"
      });
    }

    // Remove user from likes array
    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.user._id.toString()
    );
    post.likesCount = post.likes.length;

    await post.save();

    // Log activity
    try {
      const activity = new Activity({
        userId: req.user._id,
        action: 'unliked post',
        targetType: 'post',
        targetId: post._id,
        targetTitle: post.title,
        metadata: {
          postTitle: post.title,
          postDescription: post.description
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error saving activity:', activityError);
      // Don't fail the main request if activity logging fails
    }

    // Emit real-time event for unlike
    const io = req.app.get("io");
    if (io) {
      emitToPost(io, post._id, "postUnliked", {
        postId: post._id,
        unlikerId: req.user._id,
        likesCount: post.likesCount,
        message: "A post was unliked",
      });
    }

    sendSuccessResponse(res, 200, {
      postId: post._id,
      likes: post.likes,
      likesCount: post.likesCount,
    });
  } catch (error) {
    sendErrorResponse(res, 400, error.message);
  }
};

// @desc    Add or update a rating for a post
// @route   POST /api/v1/posts/:id/ratings
// @access  Private
const addOrUpdateRating = async (req, res) => {
  try {
    const postId = req.params.id;
    // Accept several possible field names from frontend
    const incoming = req.body || {};
    const rawRating = incoming.rating ?? incoming.value ?? incoming.rate;

    if (typeof rawRating === "undefined") {
      return res.status(400).json({
        status: "fail",
        message: "Rating value is required",
      });
    }

    const ratingValue = Number(rawRating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        status: "fail",
        message: "Rating must be a number between 1 and 5",
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ status: "fail", message: "Post not found" });
    }

    // Ensure user is authenticated (protect middleware should be used on route)
    if (!req.user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Authentication required to rate" });
    }

    const userId = req.user._id.toString();

    // Check if this user already rated the post
    let existingIndex = -1;
    if (Array.isArray(post.ratings)) {
      existingIndex = post.ratings.findIndex(
        (r) => r.user && r.user.toString() === userId
      );
    } else {
      post.ratings = [];
    }

    if (existingIndex !== -1) {
      // Update existing rating
      post.ratings[existingIndex].rating = ratingValue;
    } else {
      // Add new rating
      post.ratings.push({ user: req.user._id, rating: ratingValue });
    }

    // Recompute aggregates
    const total = post.ratings.length;
    const sum = post.ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total > 0 ? sum / total : 0;
    post.averageRating = avg;
    post.totalRatings = total;

    await post.save();

    // Emit event if needed
    const io = req.app.get("io");
    if (io) {
      emitToPost(io, post._id, "ratingUpdated", {
        postId: post._id,
        averageRating: post.averageRating,
        totalRatings: post.totalRatings,
      });
    }

    res.status(200).json({
      status: "success",
      averageRating: post.averageRating,
      totalRatings: post.totalRatings,
      data: post.ratings,
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/v1/posts/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    // Accept multiple possible field names from frontend
    const incoming = req.body || {};
    const text =
      incoming.text ?? incoming.content ?? incoming.comment ?? incoming.message;
    const postId = req.params.id;

    // Validate input
    if (!text) {
      return sendErrorResponse(res, 400, "Comment text is required");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Ensure comments array exists
    if (!post.comments) {
      post.comments = [];
    }

    // No restriction on number of comments per user per post - users can add multiple comments

    // Create new comment
    const newComment = {
      user: req.user._id,
      text,
    };

    post.comments.unshift(newComment);
    await post.save();

    // Log activity
    try {
      const activity = new Activity({
        userId: req.user._id,
        action: 'commented on post',
        targetType: 'comment',
        targetId: newComment._id, // Using newComment._id which will be set by MongoDB
        targetTitle: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // First 50 chars of comment
        metadata: {
          commentText: text,
          postId: post._id,
          postTitle: post.title
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      await activity.save();
    } catch (activityError) {
      console.error('Error saving activity:', activityError);
      // Don't fail the main request if activity logging fails
    }

    // Populate the user info for the returned comment
    const populatedPost = await Post.findById(postId).populate({
      path: "comments.user",
      select: "name _id", // Standardize to name and _id
    });

    const addedComment = populatedPost.comments[0]; // First comment is the newly added one

    // Create notification for the post owner
    if (
      post.postedBy &&
      post.postedBy._id &&
      post.postedBy._id.toString() !== req.user._id.toString()
    ) {
      await createCommentNotification(
        post._id,
        req.user._id,
        post.postedBy._id,
        text
      );
    }

    // Emit real-time event for new comment
    const io = req.app.get("io");
    if (io) {
      emitToPost(io, post._id, "newComment", {
        postId: post._id,
        comment: addedComment,
        message: "A new comment was added",
      });
    }

    sendSuccessResponse(res, 201, {
      comment: addedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    sendErrorResponse(res, 500, error.message);
  }
};

// @desc    Update a comment on a post
// @route   PUT /api/v1/posts/:postId/comments/:commentId
// @access  Private
const updateComment = async (req, res) => {
  try {
    const incoming = req.body || {};
    const text = incoming.text ?? incoming.content ?? incoming.comment;
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    // Validate input
    if (!text) {
      return res.status(400).json({
        status: "fail",
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    const comment = post.comments[commentIndex];

    // Check if user owns the comment
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        status: "fail",
        message: "User not authorized to update this comment",
      });
    }

    // Update the comment
    post.comments[commentIndex].text = text;
    post.comments[commentIndex].date = Date.now();
    await post.save();

    // Populate the user info for the returned comment
    const populatedPost = await post.populate({
      path: "comments.user",
      select: "name _id", // Explicitly select name and _id
    }).populate({
      path: "comments.replies.user",
      select: "name _id", // Explicitly select name and _id
    });

    const updatedComment = populatedPost.comments.find(
      (c) => c._id.toString() === commentId
    );

    res.status(200).json({
      status: "success",
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        message: "Post not found",
      });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    const comment = post.comments[commentIndex];

    // Check if user owns the comment or is the post owner
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner =
      post.postedBy && post.postedBy._id.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(401).json({
        status: "fail",
        message: "User not authorized to delete this comment",
      });
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        message: "Post not found",
      });
    }

          // Populate user info for all comments on the fetched post object
          const populatedPost = await post
            .populate({
              path: "comments.user",
              select: "name _id", // Explicitly select name and _id for comment users
            })
            .populate({
              path: "comments.replies.user",
              select: "name _id", // Explicitly select name and _id for reply users
            });
    res.status(200).json({
      status: "success",
      data: populatedPost.comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Like a comment on a post
// @route   POST /api/v1/posts/:postId/comments/:commentId/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Post.findById(postId);
    if (!post) {
      return sendErrorResponse(res, 404, "Post not found");
    }

    // Find the comment index - ensure comments exist before calling findIndex
    const commentIndex = post.comments && post.comments.findIndex 
      ? post.comments.findIndex(c => c._id.toString() === commentId)
      : -1;
      
    if (commentIndex === -1) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    const comment = post.comments[commentIndex];

    // Check if user already liked this comment - ensure likes array exists
    const userLikeIndex = comment.likes && comment.likes.findIndex
      ? comment.likes.findIndex(
          (like) => like.user.toString() === req.user._id.toString()
        )
      : -1;

    if (userLikeIndex !== -1) {
      // User has already liked, so remove the like (toggle off)
      comment.likes.splice(userLikeIndex, 1);
    } else {
      // User has not liked, so add the like (toggle on)
      comment.likes.push({ user: req.user._id });
    }
    
    // Update likes count
    comment.likesCount = comment.likes.length;

    await post.save();

    // Populate the updated comment with user info
    const updatedPost = await Post.findById(postId).populate({
      path: "comments.user",
      select: "name _id", // Standardize to name and _id
    }).populate({
      path: "comments.replies.user",
      select: "name _id", // Standardize to name and _id
    });

    const updatedComment = updatedPost.comments.id(commentId);

    sendSuccessResponse(res, 200, {
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    sendErrorResponse(res, 500, error.message);
  }
};

// @desc    Reply to a comment on a post
// @route   POST /api/v1/posts/:postId/comments/:commentId/reply
// @access  Private
const replyToComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const { content } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({
        status: "fail",
        message: "Reply content is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Add reply to the comment
    comment.replies.push({
      user: req.user._id,
      text: content,
    });
    comment.repliesCount = comment.replies.length;

    await post.save();

    // Populate the updated comment with user info
    const updatedPost = await Post.findById(postId).populate({
      path: "comments.user",
      select: "name _id", // Standardize to name and _id
    }).populate({
      path: "comments.replies.user",
      select: "name _id", // Standardize to name and _id
    });

    const updatedComment = updatedPost.comments.id(commentId);

    res.status(201).json({
      status: "success",
      data: {
        comment: updatedComment,
        reply: updatedComment.replies[updatedComment.replies.length - 1], // Return the latest reply
      },
    });
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Search posts with enhanced functionality
// @route   GET /api/v1/posts/search
// @access  Public
const searchPosts = async (req, res) => {
  try {
    const { q, category, limit = 10, page = 1, sortBy = 'relevance', radius = 50, latitude, longitude } = req.query;
    
    // Validate and convert parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const radiusNum = parseFloat(radius) || 50;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Build search query
    let query = { status: 'published' }; // Only published posts

    // Text search in title, description, category, and tags with fuzzy matching
    if (q) {
      // Use MongoDB text search for better performance and relevance
      query.$text = { $search: q };
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = { $regex: category, $options: "i" };
    }

    // Location-based search if coordinates provided
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radiusNum * 1000, // Convert km to meters
        },
      };
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation pipeline for enhanced search
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          // Calculate text score for relevance if using text search
          textScore: { $meta: "textScore" },
          // Calculate distance if location provided
          distance: lat && lng ? {
            $sqrt: {
              $add: [
                { $pow: [{ $subtract: ["$location.coordinates.1", lat] }, 2] },
                { $pow: [{ $subtract: ["$location.coordinates.0", lng] }, 2] }
              ]
            }
          } : null
        }
      }
    ];

    // Add sorting based on parameter
    let sort = {};
    switch (sortBy) {
      case 'relevance':
        if (q) {
          sort.textScore = { $meta: "textScore" };
        } else {
          sort.datePosted = -1; // Default to newest if no search query
        }
        break;
      case 'newest':
        sort.datePosted = -1;
        break;
      case 'oldest':
        sort.datePosted = 1;
        break;
      case 'rating':
        sort.averageRating = -1;
        sort.totalRatings = -1;
        break;
      case 'popular':
        sort.totalRatings = -1;
        sort.averageRating = -1;
        break;
      case 'distance':
        if (lat && lng) {
          sort.distance = 1; // Closest first
        } else {
          sort.datePosted = -1; // Fallback to newest
        }
        break;
      default:
        sort.datePosted = -1;
    }

    // Add sorting, skip, limit and populate
    pipeline = pipeline.concat([
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.user",
          foreignField: "_id",
          as: "commentUsers"
        }
      },
      {
        $addFields: {
          "postedBy": {
            $map: {
              input: "$postedBy",
              as: "user",
              in: {
                _id: "$$user._id",
                name: "$$user.name",
                avatar: "$$user.avatar"
              }
            }
          },
          "comments": {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                date: "$$comment.date",
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$commentUsers",
                        cond: { $eq: ["$$this._id", "$$comment.user"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    // Execute search with aggregation
    const posts = await Post.aggregate(pipeline);

    // Get total count for pagination info
    const total = await Post.countDocuments(query);

    // Add distance to response if location was provided
    const processedPosts = posts.map(post => {
      const processedPost = { ...post };
      if (post.distance !== undefined && post.distance !== null) {
        processedPost.distance = parseFloat(post.distance.toFixed(2)); // Round to 2 decimal places
      }
      return processedPost;
    });

    res.status(200).json({
      status: "success",
      data: {
        posts: processedPosts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalPosts: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        message: "Latitude and longitude are required",
      });
    }

    // Convert radius from kilometers to meters for MongoDB query
    const radiusInMeters = parseFloat(radius) * 1000;

    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: "distance",
          maxDistance: radiusInMeters,
          spherical: true,
          limit: parseInt(limit)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.user",
          foreignField: "_id",
          as: "comments.user"
        }
      },
      {
        $addFields: {
          postedBy: { $arrayElemAt: ["$postedBy", 0] }
        }
      }
    ]);

    res.status(200).json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching nearby posts:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Advanced search that includes all locations and provides comprehensive results
// @route   GET /api/v1/posts/advanced-search
// @access  Public
const advancedSearch = async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1, sortBy = 'relevance', radius = 50, latitude, longitude, tags } = req.query;
    
    // Validate and convert parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const radiusNum = parseFloat(radius) || 50;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Build search query
    let query = { status: 'published' }; // Only published posts

    // Text search in title, description, category, and tags
    if (q) {
      // Use MongoDB text search or regex-based search
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
      
      // If tags exist, include them in search
      query.$or.push({ tags: { $regex: q, $options: 'i' } });
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = { $regex: category, $options: "i" };
    }

    // Filter by tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    let result;
    let total;
    
    // Location-based search if coordinates provided
    if (lat && lng) {
      // When using geospatial queries with sorts, use aggregation pipeline
      const pipeline = [
        { $match: query },
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat]
            },
            distanceField: "distanceFromCenter",
            maxDistance: radiusNum * 1000, // Convert km to meters
            spherical: true
          }
        }
      ];
      
      // Add relevance scoring if query term exists
      if (q) {
        const queryLower = q.toLowerCase();
        pipeline.push({
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $cond: {
                    if: { $regexMatch: { input: "$title", regex: queryLower, options: "i" } },
                    then: 10,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$description", regex: queryLower, options: "i" } },
                    then: 5,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$category", regex: queryLower, options: "i" } },
                    then: 3,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ["$tags", false] },
                        { $isArray: "$tags" },
                        {
                          $anyElementTrue: {
                            $map: {
                              input: "$tags",
                              as: "tag",
                              in: { $regexMatch: { input: "$$tag", regex: queryLower, options: "i" } }
                            }
                          }
                        }
                      ]
                    },
                    then: 2,
                    else: 0
                  }
                }
              ]
            }
          }
        });
      } else {
        pipeline.push({
          $addFields: {
            relevanceScore: 0
          }
        });
      }
      
      // Add sorting based on parameter
      if (sortBy === 'distance') {
        // Already sorted by distance from $geoNear
      } else if (sortBy === 'relevance' && q) {
        pipeline.push({ $sort: { relevanceScore: -1, datePosted: -1 } });
      } else if (sortBy === 'newest') {
        pipeline.push({ $sort: { datePosted: -1 } });
      } else if (sortBy === 'oldest') {
        pipeline.push({ $sort: { datePosted: 1 } });
      } else if (sortBy === 'rating') {
        pipeline.push({ $sort: { averageRating: -1, totalRatings: -1 } });
      } else if (sortBy === 'popular') {
        pipeline.push({ $sort: { totalRatings: -1, averageRating: -1 } });
      } else { // Default
        pipeline.push({ $sort: { datePosted: -1 } });
      }
      
      // Add populate by referencing the user in a separate step or using lookup
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy"
        }
      });
      
      // Project to shape the data properly
      pipeline.push({
        $addFields: {
          postedBy: { $arrayElemAt: ["$postedBy", 0] }
        }
      });
      
      // Count total for pagination
      total = await Post.countDocuments(query);
      
      // Add pagination
      pipeline.push({ $skip: skip }, { $limit: limitNum });
      
      result = await Post.aggregate(pipeline);
    } else {
      // For non-geospatial searches, use aggregation pipeline for consistency
      const pipeline = [
        { $match: query }
      ];
      
      // Add relevance scoring if query term exists
      if (q) {
        const queryLower = q.toLowerCase();
        pipeline.push({
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $cond: {
                    if: { $regexMatch: { input: "$title", regex: queryLower, options: "i" } },
                    then: 10,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$description", regex: queryLower, options: "i" } },
                    then: 5,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: { $regexMatch: { input: "$category", regex: queryLower, options: "i" } },
                    then: 3,
                    else: 0
                  }
                },
                {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ["$tags", false] },
                        { $isArray: "$tags" },
                        {
                          $anyElementTrue: {
                            $map: {
                              input: "$tags",
                              as: "tag",
                              in: { $regexMatch: { input: "$$tag", regex: queryLower, options: "i" } }
                            }
                          }
                        }
                      ]
                    },
                    then: 2,
                    else: 0
                  }
                }
              ]
            }
          }
        });
      } else {
        pipeline.push({
          $addFields: {
            relevanceScore: 0
          }
        });
      }
      
      // Add sorting based on parameter
      if (sortBy === 'relevance' && q) {
        pipeline.push({ $sort: { relevanceScore: -1, datePosted: -1 } });
      } else if (sortBy === 'newest') {
        pipeline.push({ $sort: { datePosted: -1 } });
      } else if (sortBy === 'oldest') {
        pipeline.push({ $sort: { datePosted: 1 } });
      } else if (sortBy === 'rating') {
        pipeline.push({ $sort: { averageRating: -1, totalRatings: -1 } });
      } else if (sortBy === 'popular') {
        pipeline.push({ $sort: { totalRatings: -1, averageRating: -1 } });
      } else { // Default
        pipeline.push({ $sort: { datePosted: -1 } });
      }
      
      // Add populate
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy"
        }
      });
      
      // Project to shape the data properly
      pipeline.push({
        $addFields: {
          postedBy: { $arrayElemAt: ["$postedBy", 0] }
        }
      });
      
      // Count total for pagination
      total = await Post.countDocuments(query);
      
      // Add pagination
      pipeline.push({ $skip: skip }, { $limit: limitNum });
      
      result = await Post.aggregate(pipeline);
    }

    // Calculate distance for each post if location provided
    const processedPosts = result.map(post => {
      // Calculate distance if location provided and not already calculated
      if (lat && lng && post.location && post.location.coordinates) {
        // If using geoNear, distance is calculated by MongoDB as distanceFromCenter
        if (post.distanceFromCenter !== undefined) {
          post.distance = parseFloat((post.distanceFromCenter / 1000).toFixed(2)); // Convert meters to km
        } else {
          // Calculate distance manually if not using geoNear
          const [postLng, postLat] = post.location.coordinates;
          const R = 6371; // Earth's radius in km
          const dLat = (postLat - lat) * Math.PI / 180;
          const dLon = (postLng - lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(postLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in km
          post.distance = parseFloat(distance.toFixed(2));
        }
      }
      
      return post;
    });

    res.status(200).json({
      status: "success",
      data: {
        posts: processedPosts,
        suggestions: {
          query: q || '',
          count: processedPosts.length
        },
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalPosts: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in advanced search:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        message:
          "minLat, maxLat, minLng, and maxLng are required for area bounds",
      });
    }

    const posts = await Post.find({
      "location.latitude": {
        $gte: parseFloat(minLat),
        $lte: parseFloat(maxLat),
      },
      "location.longitude": {
        $gte: parseFloat(minLng),
        $lte: parseFloat(maxLng),
      },
    })
      .populate("postedBy", "name email avatar")
      .populate({
        path: "comments.user",
        select: "name _id", // Standardize to name and _id
      });

    res.status(200).json({
      status: "success",
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts within area:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get ratings for a post
// @route   GET /api/v1/posts/:id/ratings
// @access  Private
const getPostRatings = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        averageRating: post.averageRating || 0,
        totalRatings: post.totalRatings || 0,
        ratings: post.ratings || [],
      },
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
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
        message: "Latitude and longitude are required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "Post not found",
      });
    }

    // Calculate distance using the haversine formula
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const postLat = post.location.latitude;
    const postLng = post.location.longitude;

    const R = 6371; // Earth's radius in kilometers
    const dLat = ((postLat - userLat) * Math.PI) / 180;
    const dLon = ((postLng - userLng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((postLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    res.status(200).json({
      status: "success",
      data: {
        distance: distance,
        unit: "kilometers",
      },
    });
  } catch (error) {
    console.error("Error calculating distance:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// @desc    Get all posts for admin dashboard (admin only)
// @route   GET /api/v1/admin/posts
// @access  Private (admin only)
const getAllPostsForAdmin = async (req, res) => {
  try {
    // Check if user is admin (this should be handled by admin middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Get all posts with additional information like author details
    const posts = await Post.find()
      .populate("postedBy", "name email role")
      .sort({ datePosted: -1 });

    res.status(200).json({
      status: 'success',
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching posts for admin:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// @desc    Delete any post (admin only)
// @route   DELETE /api/v1/admin/posts/:id
// @access  Private (admin only)
const deletePostByAdmin = async (req, res) => {
  try {
    // Check if user is admin (this should be handled by admin middleware)
    if (req.user.role !== 'admin') {
      return sendErrorResponse(res, 403, 'Access denied. Admin privileges required.');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendErrorResponse(res, 404, 'Post not found');
    }

    // Delete local images if they exist
    await deleteLocalImages(post.images, path.join(__dirname, "..", "uploads"));
    if (post.image && post.image.localPath) {
      // Fallback for posts using legacy single image field stored locally
      await deleteLocalImages([post.image], path.join(__dirname, "..", "uploads"));
    }

    await Post.findByIdAndDelete(req.params.id);

    // Emit real-time event for deleted post
    const io = req.app.get("io");
    if (io) {
      emitGlobal(io, "postDeleted", {
        postId: req.params.id,
        message: "A post was deleted by admin",
      });
    }

    sendSuccessResponse(res, 200, null, { message: 'Post deleted successfully' });
  } catch (error) {
    console.error("Error deleting post by admin:", error);
    sendErrorResponse(res, 500, error.message);
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
  addOrUpdateRating,
  getPostRatings,
  addComment,
  updateComment,
  deleteComment,
  getComments,
  searchPosts,
  advancedSearch,
  getNearbyPosts,
  getPostsWithinArea,
  getPostDistance,
  likeComment,
  replyToComment,
  getAllPostsForAdmin,
  deletePostByAdmin,
};
