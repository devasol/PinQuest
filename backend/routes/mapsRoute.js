const express = require("express");
const router = express.Router();
const Post = require("../models/posts");
const User = require("../models/User");

// GET /api/v1/maps/locations - Fetch locations for map display
router.get("/locations", async (req, res) => {
  try {
    // Query to find posts with location data
    const { category, search, limit = 50, page = 1, userLat, userLng } = req.query;
    
    // Build query
    let query = { 
      location: { $exists: true, $ne: null }, // Only posts with valid location data
      averageRating: { $gte: 3.5 } // Only posts with rating 3.5 and above
    };
    
    // Add category filter if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case insensitive
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with population and pagination
    const posts = await Post.find(query)
      .populate('postedBy', 'username profilePicture') // Only get necessary user data
      .sort({ averageRating: -1, datePosted: -1 }) // Sort by rating first, then by date
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Filter to only include highly rated posts (4.0 and above) if no specific category or search is requested
    // This can be overridden by query parameters if needed

    // Transform posts data to match the format expected by MapsPage component
    const locations = posts.map(post => {
      // Calculate distance if user location is provided
      let distance = '1.5 km'; // default
      if (userLat && userLng && post.location?.latitude && post.location?.longitude) {
        distance = calculateDistance(parseFloat(userLat), parseFloat(userLng), 
                                   post.location.latitude, post.location.longitude);
        distance = distance.toFixed(1) + ' km';
      }

      return {
        id: post._id.toString(),
        name: post.title,
        category: post.category || 'general',
        rating: post.averageRating || 0,
        description: post.description,
        coordinates: {
          lat: post.location.latitude,
          lng: post.location.longitude
        },
        image: post.image?.url || post.images?.[0]?.url || null,
        distance: distance,
        price: '$$',
        tags: [post.category || 'general'], // You could add more tags if needed
        postedBy: post.postedBy?.username || 'Unknown',
        datePosted: post.datePosted
      };
    });

    res.status(200).json({
      success: true,
      data: {
        locations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: await Post.countDocuments(query)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two points (lat/lng) in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
}

// Helper function to calculate distance (would need user's location)
const calculateDistanceToUser = (userLat, userLng, postLat, postLng) => {
  // This is a simplified version - in real implementation you'd calculate actual distance
  // For now, return a placeholder
  if (userLat && userLng && postLat && postLng) {
    const distance = calculateDistance(userLat, userLng, postLat, postLng);
    return distance.toFixed(1) + ' km';
  }
  return '1.5 km'; // Default placeholder
};

// GET /api/v1/maps/locations/:id - Get specific location details
router.get("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id)
      .populate('postedBy', 'username profilePicture')
      .exec();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Transform to match MapsPage format
    const location = {
      id: post._id,
      name: post.title,
      category: post.category,
      rating: post.averageRating || 0,
      description: post.description,
      coordinates: {
        lat: post.location.latitude,
        lng: post.location.longitude
      },
      image: post.image?.url || post.images?.[0]?.url || null,
      postedBy: post.postedBy?.username || 'Unknown',
      datePosted: post.datePosted,
      likesCount: post.likesCount || 0,
      commentsCount: post.comments?.length || 0
    };
    
    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location details',
      error: error.message
    });
  }
});

module.exports = router;