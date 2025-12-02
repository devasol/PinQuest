import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Header from '../Landing/Header/Header';
import CustomMarker from './CustomMarker';
import PostWindow from '../PostWindow/PostWindow';
import CurrentLocationMarker from './CurrentLocationMarker';
import MapRouting from './MapRouting';
import CreatePostModal from './CreatePostModal';
import { Search, Filter, MapPin, Heart, Star, Grid3X3, ThumbsUp, X, SlidersHorizontal, Navigation, Bookmark, Plus, ChevronDown, ChevronUp, TrendingUp, Award, Globe, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Custom hook for map events
const MapClickHandler = ({ onMapClick, onMapPositionSelected }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
      
      // If user is authenticated, allow them to create a post at the clicked location
      if (onMapPositionSelected) {
        onMapPositionSelected(e.latlng);
      }
      
      // Hide all control windows when clicking on map
      const windows = ['filter-window', 'view-mode-window', 'map-type-window', 'saved-locations-window'];
      windows.forEach(windowId => {
        const windowElement = document.getElementById(windowId);
        if (windowElement && !windowElement.classList.contains('hidden')) {
          windowElement.classList.add('hidden');
        }
      });
    }
  });
  return null;
};

const DiscoverMain = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('street'); // street, satellite, terrain
  const [savedLocations, setSavedLocations] = useState([]); // For saved locations (separate from bookmarks)
  const [favoritePosts, setFavoritePosts] = useState(new Set()); // Track which posts are bookmarked/favorited
  const [likedPosts, setLikedPosts] = useState(new Set()); // Track which posts are liked
  const [showSavedLocationsOnMap, setShowSavedLocationsOnMap] = useState(false); // Toggle to show saved locations
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [rating, setRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showListings, setShowListings] = useState(false);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [userLocation, setUserLocation] = useState(null);
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'list' for mobile
  const [routingActive, setRoutingActive] = useState(false); // Track if routing is active
  const [routingDestination, setRoutingDestination] = useState(null); // Store destination for routing
  const [routingLoading, setRoutingLoading] = useState(false); // Track if routing is being calculated
  const [showCreatePostModal, setShowCreatePostModal] = useState(false); // Track if create post modal is open
  const [selectedMapPosition, setSelectedMapPosition] = useState(null); // Store selected position for post creation
  const [createPostLoading, setCreatePostLoading] = useState(false); // Track if post creation is in progress
  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePostLike = useCallback((postId, isLiked) => {
    // Update the posts state in DiscoverMain if needed
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        likes: isLiked 
          ? [...(prev.likes || []), { user: user?._id }] 
          : (prev.likes || []).filter(like => {
              const userId = typeof like.user === 'object' ? like.user._id : like.user;
              return userId !== user?._id;
            }),
        likesCount: isLiked ? (prev.likesCount || 0) + 1 : (prev.likesCount || 0) - 1
      }));
    }
    
    // Also update the main posts array to reflect the change
    setPosts(prevPosts => prevPosts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          likes: isLiked 
            ? [...(post.likes || []), { user: user?._id }] 
            : (post.likes || []).filter(like => {
                const userId = typeof like.user === 'object' ? like.user._id : like.user;
                return userId !== user?._id;
              }),
          likesCount: isLiked ? (prev.likesCount || 0) + 1 : (prev.likesCount || 0) - 1
        };
      }
      return post;
    }));
    
    // Update filtered posts as well
    setFilteredPosts(prevFiltered => prevFiltered.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          likes: isLiked 
            ? [...(post.likes || []), { user: user?._id }] 
            : (post.likes || []).filter(like => {
                const userId = typeof like.user === 'object' ? like.user._id : like.user;
                return userId !== user?._id;
              }),
          likesCount: isLiked ? (prev.likesCount || 0) + 1 : (prev.likesCount || 0) - 1
        };
      }
      return post;
    }));
  }, [selectedPost, user]);

  const handlePostSave = useCallback((postId, isSaved) => {
    // Update favorite posts when a post is bookmarked/unbookmarked
    setFavoritePosts(prev => {
      const newFavorites = new Set(prev);
      if (isSaved) {
        newFavorites.add(postId);
      } else {
        newFavorites.delete(postId);
      }
      return newFavorites;
    });
  }, []);

  const handlePostRate = useCallback((postId, newAverageRating, newTotalRatings) => {
    // Update the posts state in DiscoverMain when ratings change
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        averageRating: newAverageRating,
        totalRatings: newTotalRatings
      }));
    }
    
    // Also update the main posts array to reflect the rating change
    setPosts(prevPosts => prevPosts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          averageRating: newAverageRating,
          totalRatings: newTotalRatings
        };
      }
      return post;
    }));
    
    // Update filtered posts as well
    setFilteredPosts(prevFiltered => prevFiltered.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          averageRating: newAverageRating,
          totalRatings: newTotalRatings
        };
      }
      return post;
    }));
  }, [selectedPost]);

  // Fetch posts from the backend API
  const fetchPosts = useCallback(async (preserveSelectedPost = null, limit = null) => {
    try {
      // Fetch all posts
      const response = await fetch(`${API_BASE_URL}/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the API data to match the format expected by the frontend
        // Handle both location formats: coordinates array and latitude/longitude fields
        let transformedPosts = result.data
          .filter(post => {
            // Check if the post has valid location data in either format
            if (post.location) {
              // Check GeoJSON format: [longitude, latitude]
              if (post.location.coordinates && Array.isArray(post.location.coordinates) 
                  && post.location.coordinates.length === 2 
                  && typeof post.location.coordinates[0] === 'number' 
                  && typeof post.location.coordinates[1] === 'number') {
                return true;
              }
              // Check separate latitude/longitude format
              if (typeof post.location.latitude === 'number' && 
                  typeof post.location.longitude === 'number' &&
                  !isNaN(post.location.latitude) &&
                  !isNaN(post.location.longitude)) {
                return true;
              }
            }
            return false;
          })
          .map(post => {
            let position;
            // Handle GeoJSON format [longitude, latitude]
            if (post.location.coordinates && Array.isArray(post.location.coordinates) 
                && post.location.coordinates.length === 2) {
              // Convert to [latitude, longitude] for Leaflet
              position = [post.location.coordinates[1], post.location.coordinates[0]];
            } 
            // Handle separate latitude/longitude format
            else if (typeof post.location.latitude === 'number' && 
                     typeof post.location.longitude === 'number') {
              position = [post.location.latitude, post.location.longitude];
            }
            
            return {
              _id: post._id,
              id: post._id, // Keep both for compatibility
              title: post.title || "Untitled",
              description: post.description || "No description provided",
              image: post.image,
              images: post.images || [],
              averageRating: post.averageRating || 0,
              totalRatings: post.totalRatings || 0,
              postedBy: post.postedBy || post.postedBy?.name || "Unknown", // Preserve full postedBy object
              category: post.category || "general",
              datePosted: post.datePosted || new Date().toISOString(),
              position: position, // [lat, lng] format for Leaflet
              price: post.price || 0,
              tags: post.tags || [],
              comments: post.comments || [],
              likes: post.likes || [], // Add likes array
              likesCount: post.likesCount || 0, // Add likes count
              location: {
                // Ensure location has proper latitude and longitude for the directions feature
                latitude: post.location?.latitude || 
                         (post.location?.coordinates && post.location.coordinates[1]) || 
                         (position && position[0]), // fallback to position[0] if available
                longitude: post.location?.longitude || 
                          (post.location?.coordinates && post.location.coordinates[0]) || 
                          (position && position[1]), // fallback to position[1] if available
                // Preserve other location properties if they exist
                ...post.location
              },
            };
          });
        
        // Apply client-side limit if specified
        if (limit && limit > 0) {
          transformedPosts = transformedPosts.slice(0, limit);
        }
        
        // If we're preserving a selected post, we need to handle it specially
        if (preserveSelectedPost) {
          // Find if the selected post exists in the newly fetched data
          const updatedSelectedPost = transformedPosts.find(p => p._id === preserveSelectedPost._id);
          
          if (updatedSelectedPost) {
            // Update the selected post with only the fresh volatile data while preserving detailed data
            setSelectedPost(prev => prev ? {
              ...prev, // Preserve existing data first
              ...updatedSelectedPost, // Then apply fresh data, overwriting if keys exist
            } : null);
          }
        }
        
        setPosts(transformedPosts);
        setFilteredPosts(transformedPosts);
      } else {
        console.error("Error: Invalid API response format", result);
        setError("Failed to load posts from server");
        setPosts([]);
        setFilteredPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts: " + err.message);
      setPosts([]);
      setFilteredPosts([]);
    }
  }, []);

  // Fetch saved locations if user is authenticated
  const fetchSavedLocations = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No authentication token found");
          setSavedLocations([]);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data?.savedLocations)) {
          setSavedLocations(result.data.savedLocations);
        } else {
          console.warn("Saved locations API returned unexpected format:", result);
          setSavedLocations([]);
        }
      } catch (err) {
        console.error("Error fetching saved locations:", err);
        setSavedLocations([]);
      }
    } else {
      // If not authenticated, reset to empty
      setSavedLocations([]);
    }
  }, [isAuthenticated, API_BASE_URL]);

  // Fetch user's favorite posts if user is authenticated
  const fetchUserFavoritePosts = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data?.favorites)) {
            // Extract post IDs from favorites to create a Set of favorite post IDs
            const favoritePostIds = new Set(
              result.data.favorites.map(fav => 
                typeof fav.post === 'object' ? fav.post._id : (fav.post || fav.postId)
              ).filter(Boolean) // Remove any null/undefined values
            );
            setFavoritePosts(favoritePostIds);
          }
        }
      } catch (err) {
        console.error("Error fetching user favorite posts:", err);
      }
    }
  }, [isAuthenticated, user, API_BASE_URL]);

  // Fetch user's liked posts if user is authenticated
  const fetchUserLikedPosts = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        // For now, we rely on the post data returned from the server
        // which should include likes array with user information
        // The logic in the rendering already checks if user has liked each post
      } catch (err) {
        console.error("Error fetching user liked posts:", err);
      }
    }
  }, [isAuthenticated, user]);

  // Initial data fetch
  useEffect(() => {
    // Fetch saved locations and favorite posts in background (not blocking)
    if (isAuthenticated) {
      setTimeout(() => {
        fetchSavedLocations(); // Run in background to avoid blocking
        fetchUserFavoritePosts(); // Fetch favorite posts as well
      }, 0);
    }
    
    // Fetch posts without blocking the UI - start loading data in background
    fetchPosts(null, 50); // Fetch limited posts initially

    // Set up periodic refresh every 30 seconds
    fetchIntervalRef.current = setInterval(() => {
      // Preserve the selected post if it exists before refreshing
      const preservedSelectedPost = selectedPost;
      
      fetchPosts(preservedSelectedPost, 50);
      
      if (isAuthenticated) {
        fetchSavedLocations();
        fetchUserFavoritePosts(); // Also refresh favorite posts periodically
      }
    }, 30000);
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchPosts, fetchSavedLocations, fetchUserFavoritePosts, isAuthenticated]);

  // Apply filters when search query, category, or other filters change
  useEffect(() => {
    let result = [...posts];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.description.toLowerCase().includes(query) ||
        (typeof post.postedBy === 'string' ? post.postedBy.toLowerCase() : 
         (typeof post.postedBy === 'object' && post.postedBy.name ? post.postedBy.name.toLowerCase() : '')
        ).includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    // Apply rating filter
    if (rating > 0) {
      result = result.filter(post => post.averageRating >= rating);
    }
    
    // Apply price range filter
    if (priceRange !== 'all') {
      if (priceRange === 'free') {
        result = result.filter(post => post.price === 0);
      } else if (priceRange === 'low') {
        result = result.filter(post => post.price > 0 && post.price <= 10);
      } else if (priceRange === 'medium') {
        result = result.filter(post => post.price > 10 && post.price <= 50);
      } else if (priceRange === 'high') {
        result = result.filter(post => post.price > 50);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.datePosted) - new Date(a.datePosted);
        case 'oldest':
          return new Date(a.datePosted) - new Date(b.datePosted);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'popular':
          return b.totalRatings - a.totalRatings;
        default:
          return 0;
      }
    });
    
    setFilteredPosts(result);
  }, [searchQuery, selectedCategory, rating, priceRange, sortBy, posts]);

  // Get user location for initial centering
  useEffect(() => {
    let watchId;
    
    if (navigator.geolocation) {
      // Try to get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Center the map on the user's location when page loads with a nice zoom level
          if (mapRef.current) {
            mapRef.current.setView(userPos, 15); // More zoomed in initially
          } else {
            // If map isn't ready yet, update the state
            setMapCenter(userPos);
            setMapZoom(15);
          }
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Default to a reasonable view if geolocation fails
          // Using a default location (like a general city center) instead of [20, 0] (world view)
          const defaultLocation = [20.5937, 78.9629]; // India coordinates as a default
          if (mapRef.current) {
            mapRef.current.setView(defaultLocation, 3);
          } else {
            setMapCenter(defaultLocation);
            setMapZoom(3);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
      
      // Watch for position updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Optionally update map to follow user if they've enabled it
          // (not automatically following to avoid disrupting user experience)
        },
        (error) => {
          console.log("Geolocation watch error:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // 30 seconds
          timeout: 27000, // 27 seconds
        }
      );
    } else {
      // Geolocation is not supported
      console.log("Geolocation is not supported by this browser");
      // Use a default location
      const defaultLocation = [20.5937, 78.9629]; // India coordinates as a default
      if (mapRef.current) {
        mapRef.current.setView(defaultLocation, 3);
      } else {
        setMapCenter(defaultLocation);
        setMapZoom(3);
      }
    }
    
    // Cleanup function to stop watching position
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // Run once when component mounts

  // Fly to a post's location on the map
  const flyToPost = useCallback((position) => {
    if (mapRef.current && position && Array.isArray(position) && position.length >= 2) {
      mapRef.current.flyTo(position, 15);
    }
  }, []);

  // Toggle post bookmark/favorite status
  const togglePostBookmark = async (post) => {
    if (!isAuthenticated) {
      alert('Please login to bookmark posts');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to bookmark posts');
      return;
    }
    
    let isBookmarked;
    
    try {
      isBookmarked = favoritePosts.has(post.id);
      
      let response;
      if (isBookmarked) {
        // Unbookmark the post
        response = await fetch(`${API_BASE_URL}/users/favorites/${post.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Bookmark the post
        response = await fetch(`${API_BASE_URL}/users/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            postId: post.id
          })
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Update local state
          setFavoritePosts(prev => {
            const newFavorites = new Set(prev);
            if (isBookmarked) {
              newFavorites.delete(post.id);
            } else {
              newFavorites.add(post.id);
            }
            return newFavorites;
          });
          
          console.log(`Post ${isBookmarked ? 'un' : ''}bookmarked successfully`);
        }
      } else {
        alert(`Failed to ${isBookmarked ? 'un' : ''}bookmark post`);
      }
    } catch (err) {
      console.error(`Error ${isBookmarked ? 'un' : ''}bookmarking post:`, err);
      alert(`Error ${isBookmarked ? 'un' : 'book' }marking post`);
    }
  };

  // Save a location (separate functionality from bookmarking posts)
  const saveLocation = async (locationData) => {
    if (!isAuthenticated) {
      alert('Please login to save locations');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      // Check if the location is already saved
      const isAlreadySaved = savedLocations.some(loc => loc.id === locationData.id);
      
      if (isAlreadySaved) {
        // If already saved, remove it
        const response = await fetch(`${API_BASE_URL}/users/saved-locations/${locationData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Refresh saved locations
          fetchSavedLocations(); // Fetch from server to ensure consistency
          console.log('Location removed from saved locations');
        } else {
          alert('Failed to remove location');
        }
      } else {
        // If not saved, add it
        const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(locationData)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success') {
            // Refresh saved locations
            fetchSavedLocations(); // Fetch from server to ensure consistency
            console.log('Location added to saved locations');
          }
        } else {
          alert('Failed to save location');
        }
      }
    } catch (err) {
      console.error('Error saving location:', err);
      alert('Error saving location');
    }
  };

  // Remove a saved location
  const removeSavedLocation = async (locationId) => {
    if (!isAuthenticated) {
      alert('Please login to manage saved locations');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/saved-locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchSavedLocations(); // Refresh saved locations
      } else {
        alert('Failed to remove location');
      }
    } catch (err) {
      console.error('Error removing location:', err);
      alert('Error removing location');
    }
  };

  // Function to show saved locations on the map
  const showSavedLocations = () => {
    if (!isAuthenticated) {
      alert('Please login to view saved locations');
      return;
    }
    
    if (savedLocations.length === 0) {
      // Button should be disabled when there are no saved locations,
      // but if somehow this function is called, just return without doing anything
      return;
    }
    
    setShowSavedLocationsOnMap(prev => !prev);
  };

  // Function to fly to a saved location on the map
  const flyToSavedLocation = (position) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 15);
    }
  };

  // Get directions to a location - now shows directions in the map itself
  const getDirections = useCallback((position) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Validate the destination position before attempting to get user location
    if (!position || !Array.isArray(position) || position.length < 2) {
      alert('Invalid destination position provided');
      return;
    }

    // Set loading state
    setRoutingLoading(true);

    // Try to get user's current location for directions
    navigator.geolocation.getCurrentPosition(
      (userPosition) => {
        const userLat = userPosition.coords.latitude;
        const userLng = userPosition.coords.longitude;
        
        // Store the destination and activate routing visualization
        setRoutingDestination({ origin: [userLat, userLng], destination: position });
        setRoutingActive(true);
        
        // Fly to the destination to show it on the map
        if (mapRef.current) {
          mapRef.current.flyTo(position, 13);
        }
        
        // Set loading to false after a delay to allow route to load
        setTimeout(() => {
          setRoutingLoading(false);
        }, 1000); // Adjust timing as needed
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        // Fallback: ask user for a starting location or use current map center
        setRoutingLoading(false);
        
        // Check if we have a user location from earlier
        if (userLocation) {
          // Use the last known user location as origin
          setRoutingDestination({ origin: userLocation, destination: position });
          setRoutingActive(true);
          
          // Fly to the destination to show it on the map
          if (mapRef.current) {
            mapRef.current.flyTo(position, 13);
          }
        } else {
          // If we don't have a user location, try to use current map center
          if (mapRef.current) {
            const currentCenter = mapRef.current.getCenter();
            setRoutingDestination({ origin: [currentCenter.lat, currentCenter.lng], destination: position });
            setRoutingActive(true);
            
            // Fly to the destination to show it on the map
            mapRef.current.flyTo(position, 13);
          } else {
            // Final fallback: just center the map on the destination without routing
            if (mapRef.current) {
              mapRef.current.flyTo(position, 13);
            }
            alert('Could not get your location. Showing destination on map instead.');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [userLocation, flyToPost]);

  // Update user's current location manually
  const updateUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPos = [latitude, longitude];
        setUserLocation(userPos);
        
        // Center the map on the new location
        if (mapRef.current) {
          mapRef.current.flyTo(userPos, 15);
        } else {
          // If map isn't ready yet, update the state so it centers when map loads
          setMapCenter(userPos);
          setMapZoom(15);
        }
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        alert('Could not get your current location. Make sure location services are enabled and you have allowed location access.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Clear the routing state
  const clearRouting = useCallback(() => {
    setRoutingActive(false);
    setRoutingDestination(null);
    setRoutingLoading(false); // Also reset loading state
  }, []);

  // Function to toggle windows - closes previous window and opens new one
  const toggleWindow = (windowId) => {
    // Get all window IDs
    const allWindowIds = [
      'search-window', 
      'category-window', 
      'filter-window', 
      'view-mode-window', 
      'map-type-window', 
      'saved-locations-window'
    ];
    
    // Close all windows first
    allWindowIds.forEach(id => {
      const element = document.getElementById(id);
      if (element && !element.classList.contains('hidden')) {
        element.classList.add('hidden');
      }
    });
    
    // Then toggle the requested window
    const targetWindow = document.getElementById(windowId);
    if (targetWindow) {
      targetWindow.classList.remove('hidden');
    }
  };

  // Function to handle creating a new post
  const handleCreatePost = async (postPayload) => {
    if (!isAuthenticated) {
      alert('Please login to create posts');
      return;
    }

    setCreatePostLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare form data for multipart request
      const formData = new FormData();
      
      // Add basic post data
      formData.append('title', postPayload.title);
      formData.append('description', postPayload.description);
      formData.append('category', postPayload.category);
      formData.append('location[latitude]', postPayload.location.latitude.toString());
      formData.append('location[longitude]', postPayload.location.longitude.toString());

      // Add uploaded file images
      if (postPayload.images) {
        postPayload.images.forEach((image) => {
          if (image.file) {
            formData.append('images', image.file, image.name);
          }
        });
      }

      // Add image links if any
      if (postPayload.imageLinks && postPayload.imageLinks.length > 0) {
        postPayload.imageLinks.forEach((link) => {
          formData.append('imageLinks', link.url || link);
        });
      }

      // Send the request
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Add the new post to our local state with the same structure as API-transformed posts
        // Start with the response data and ensure position is in the right format [lat, lng] for Leaflet
        let position;
        if (result.data.location?.coordinates && Array.isArray(result.data.location.coordinates) 
            && result.data.location.coordinates.length === 2) {
          // Convert from [longitude, latitude] (GeoJSON) to [latitude, longitude] (Leaflet)
          position = [result.data.location.coordinates[1], result.data.location.coordinates[0]];
        } 
        else if (typeof result.data.location?.latitude === 'number' && 
                 typeof result.data.location?.longitude === 'number') {
          position = [result.data.location.latitude, result.data.location.longitude];
        }
        else {
          // Fallback to the original payload if API doesn't return location properly
          position = [postPayload.location.latitude, postPayload.location.longitude];
        }
        
        const newPost = {
          _id: result.data._id,
          id: result.data._id,
          title: result.data.title || postPayload.title,
          description: result.data.description || postPayload.description,
          image: result.data.image || null, // Use image from response if available
          images: result.data.images || [],
          averageRating: result.data.averageRating || 0,
          totalRatings: result.data.totalRatings || 0,
          postedBy: result.data.postedBy?.name || user?.name || user?.email || "Anonymous",
          category: result.data.category || postPayload.category,
          datePosted: result.data.datePosted || new Date().toISOString(),
          position: position,
          price: result.data.price || 0,
          tags: result.data.tags || [],
          comments: result.data.comments || [],
          likes: result.data.likes || [], // Use likes from response if available
          likesCount: result.data.likesCount || 0,
          location: {
            // Ensure location has proper latitude and longitude for the directions feature
            latitude: result.data.location?.latitude || 
                      (result.data.location?.coordinates && result.data.location.coordinates[1]) || 
                      postPayload.location.latitude,
            longitude: result.data.location?.longitude || 
                       (result.data.location?.coordinates && result.data.location.coordinates[0]) || 
                       postPayload.location.longitude,
            // Preserve other location properties if they exist
            ...result.data.location
          },
        };
        
        setPosts(prev => [newPost, ...prev]);
        
        // Apply current filters to determine if the new post should be in the filtered list
        let shouldIncludeInFiltered = true;
        
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          shouldIncludeInFiltered = 
            newPost.title.toLowerCase().includes(query) || 
            newPost.description.toLowerCase().includes(query) ||
            (typeof newPost.postedBy === 'string' ? newPost.postedBy.toLowerCase() : 
             (typeof newPost.postedBy === 'object' && newPost.postedBy.name ? newPost.postedBy.name.toLowerCase() : '')
            ).includes(query) ||
            newPost.category.toLowerCase().includes(query) ||
            newPost.tags.some(tag => tag.toLowerCase().includes(query));
        }
        
        // Apply category filter
        if (selectedCategory !== 'all' && shouldIncludeInFiltered) {
          shouldIncludeInFiltered = newPost.category.toLowerCase() === selectedCategory.toLowerCase();
        }
        
        // Apply rating filter
        if (rating > 0 && shouldIncludeInFiltered) {
          shouldIncludeInFiltered = newPost.averageRating >= rating;
        }
        
        // Apply price range filter
        if (priceRange !== 'all' && shouldIncludeInFiltered) {
          if (priceRange === 'free') {
            shouldIncludeInFiltered = newPost.price === 0;
          } else if (priceRange === 'low') {
            shouldIncludeInFiltered = newPost.price > 0 && newPost.price <= 10;
          } else if (priceRange === 'medium') {
            shouldIncludeInFiltered = newPost.price > 10 && newPost.price <= 50;
          } else if (priceRange === 'high') {
            shouldIncludeInFiltered = newPost.price > 50;
          }
        }
        
        // Only add to filtered posts if it passes all current filters
        if (shouldIncludeInFiltered) {
          setFilteredPosts(prev => {
            // Add new post and sort according to current sort setting
            const updatedList = [newPost, ...prev];
            
            // Apply sorting based on current sort setting
            updatedList.sort((a, b) => {
              switch (sortBy) {
                case 'newest':
                  return new Date(b.datePosted) - new Date(a.datePosted);
                case 'oldest':
                  return new Date(a.datePosted) - new Date(b.datePosted);
                case 'rating':
                  return b.averageRating - a.averageRating;
                case 'popular':
                  return b.totalRatings - a.totalRatings;
                default:
                  return 0;
              }
            });
            
            return updatedList;
          });
          
          // Fly to the new post location to show it on the map
          setTimeout(() => {
            flyToPost(newPost.position);
          }, 300); // Small delay to ensure the post is rendered
        }
        
        // Close the modal
        setShowCreatePostModal(false);
        setSelectedMapPosition(null);
        
        alert('Post created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.message || 'An error occurred while creating the post');
    } finally {
      setCreatePostLoading(false);
    }
  };

  // Get the appropriate tile layer URL based on map type
  const getTileLayerUrl = () => {
    switch (mapType) {
      case 'satellite':
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case 'terrain':
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      default: // street
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: MapPin },
    { id: 'nature', name: 'Nature', icon: MapPin },
    { id: 'culture', name: 'Culture', icon: MapPin },
    { id: 'shopping', name: 'Shopping', icon: MapPin },
    { id: 'food', name: 'Food', icon: MapPin },
    { id: 'event', name: 'Events', icon: MapPin },
    { id: 'general', name: 'General', icon: MapPin }
  ];



  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center p-6 bg-white rounded-xl shadow-xl max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Discover Page</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <Header isDiscoverPage={true} />
      

      
      {/* Full Screen Map Container - Takes full viewport */}
      <div className="relative w-screen h-screen overflow-hidden">
        {/* Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={18}
          style={{ height: '100vh', width: '100vw' }}
          ref={mapRef}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={getTileLayerUrl()}
          />
          
          <MapClickHandler 
            onMapClick={(latlng) => {
              // Handle map click
            }} 
            onMapPositionSelected={(position) => {
              // Only allow authenticated users to create posts and only when routing is not active
              if (isAuthenticated && !routingActive) {
                setSelectedMapPosition(position);
                setShowCreatePostModal(true);
              } else if (isAuthenticated && routingActive) {
                // If routing is active, just clear the routing and don't open the create post modal
                clearRouting();
              } else if (!isAuthenticated) {
                alert('Please login to create posts');
              }
            }}
          />
          
          {/* Show user's current location on the map */}
          {userLocation && (
            <CurrentLocationMarker 
              position={userLocation} 
              onClick={(position) => {
                // Optional: Add click functionality for user location marker
                console.log('User location marker clicked');
              }}
            />
          )}
          
          {/* Close Directions Button - appears when routing is active - Updated position for new layout */}
          {routingActive && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-20 right-20 z-[1000]"
            >
              <button
                onClick={clearRouting}
                className="px-3 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </motion.div>
          )}
          
          {/* Loading indicator - appears when routing is loading - Updated position for new layout */}
          {routingLoading && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-20 right-20 z-[1000]"
            >
              <div className="px-3 py-2 bg-blue-500 text-white rounded-lg shadow-md flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </div>
            </motion.div>
          )}
          
          {/* Render custom markers for each post */}
          <AnimatePresence>
            {filteredPosts.map((post, index) => {
              // Determine if the current user has liked this post based on the likes array
              const userHasLiked = post.likes?.some(like => 
                like.user && 
                (like.user._id === user?._id || 
                 (typeof like.user === 'string' && like.user === user?._id) ||
                 (typeof like.user === 'object' && like.user._id === user?._id))
              );
              
              // Check if this post is also in the saved locations to avoid duplicate markers
              const isSaved = favoritePosts.has(post.id);
              
              return (
                <CustomMarker 
                  key={`post-${post.id}`} 
                  post={post}
                  isLiked={userHasLiked}
                  onSave={togglePostBookmark}
                  isSaved={isSaved}
                  onGetDirections={getDirections}
                  onClick={(post) => {
                    setSelectedPost(post);
                    // Handle click on marker
                    console.log('Marker clicked for post:', post.title);
                  }}
                />
              );
            })}
          </AnimatePresence>
          
          {/* Render markers for saved locations when toggle is enabled */}
          {isAuthenticated && showSavedLocationsOnMap && savedLocations.map((savedLocation, index) => {
            // Check if this saved location is also in the filtered posts to avoid duplicate markers
            const isAlreadyDisplayed = filteredPosts.some(post => post.id === savedLocation.id);
            
            // Skip if it's already shown as a regular post marker
            if (isAlreadyDisplayed) {
              return null;
            }
            
            // Check if this saved location is also a post to determine if it's liked
            const associatedPost = posts.find(post => post.id === savedLocation.id);
            const userHasLiked = associatedPost?.likes?.some(like => 
              like.user && 
              (like.user._id === user?._id || 
               (typeof like.user === 'string' && like.user === user?._id) ||
               (typeof like.user === 'object' && like.user._id === user?._id))
            );
            
            // Only render if the location has valid position data
            if (savedLocation.position) {
              // Create a temporary post object for the saved location marker
              const tempPost = {
                _id: savedLocation.id,
                id: savedLocation.id,
                title: savedLocation.name || "Saved Location",
                description: savedLocation.description || "Saved location",
                image: savedLocation.image || null,
                images: savedLocation.images || [],
                averageRating: savedLocation.averageRating || 0,
                totalRatings: savedLocation.totalRatings || 0,
                postedBy: savedLocation.postedBy || "Unknown",
                category: savedLocation.category || "general",
                datePosted: savedLocation.datePosted || new Date().toISOString(),
                position: savedLocation.position,
                price: savedLocation.price || 0,
                tags: savedLocation.tags || [],
                comments: savedLocation.comments || [],
                likes: associatedPost?.likes || [],
                likesCount: associatedPost?.likesCount || 0,
              };
              
              return (
                <CustomMarker 
                  key={`saved-${savedLocation.id}`} 
                  post={tempPost}
                  isLiked={userHasLiked}
                  onSave={saveLocation}
                  isSaved={true} // Mark as saved since this is from the saved locations list
                  onGetDirections={getDirections}
                  onClick={(post) => {
                    setSelectedPost(post);
                    console.log('Saved location marker clicked:', savedLocation.name);
                  }}
                />
              );
            }
            return null;
          })}
          
          {/* Show route on the map when routing is active */}
          {routingActive && routingDestination && (
            <MapRouting 
              origin={routingDestination.origin}
              destination={routingDestination.destination}
              clearRoute={!routingActive}
            />
          )}
        </MapContainer>
        
        {/* Top Banner - Shown when saved locations are displayed - Updated for new layout */}
        {isAuthenticated && showSavedLocationsOnMap && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 right-20 z-[999]"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-2 px-3 rounded-lg shadow-md flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 fill-current" />
                <span>Saved</span>
              </div>
              <button 
                onClick={() => setShowSavedLocationsOnMap(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
        

        
        {/* Left Sidebar with Icons - Clean and minimal design */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute top-16 left-4 z-[1000] flex flex-col gap-3"
        >
          {/* Search and Filter control icons with clean styling */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('search-window')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 hover:bg-white transition-all flex items-center justify-center group modern-btn"
            title="Search"
          >
            <Search className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('category-window')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 hover:bg-white transition-all flex items-center justify-center group modern-btn"
            title="Categories"
          >
            <MapPin className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('filter-window')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 hover:bg-white transition-all flex items-center justify-center group modern-btn"
            title="Filters"
          >
            <SlidersHorizontal className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('view-mode-window')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 hover:bg-white transition-all flex items-center justify-center group modern-btn"
            title="View Mode"
          >
            <Grid3X3 className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('map-type-window')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 hover:bg-white transition-all flex items-center justify-center group modern-btn"
            title="Map Type"
          >
            <MapPin className="h-6 w-6 text-gray-700" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleWindow('saved-locations-window')}
            className={`w-14 h-14 rounded-xl shadow-md border transition-all flex items-center justify-center modern-btn ${
              showSavedLocationsOnMap 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-500' 
                : 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white'
            }`}
            title={isAuthenticated ? `${showSavedLocationsOnMap ? 'Hide' : 'Show'} saved locations` : 'Login to view saved locations'}
          >
            <Bookmark className={`h-6 w-6 ${showSavedLocationsOnMap ? 'fill-current' : ''}`} />
          </motion.button>
          
          {userLocation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={updateUserLocation}
              className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center modern-btn"
              title="My Location"
            >
              <Navigation className="h-6 w-6" />
            </motion.button>
          )}
        </motion.div>
        
        {/* Search Window */}
        <motion.div 
          id="search-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 glass-effect"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Search</h3>
            <button 
              onClick={() => document.getElementById('search-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for locations, categories, or keywords..."
                className="w-full pl-10 pr-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all modern-input focus-ring"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Category Window */}
        <motion.div 
          id="category-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 glass-effect max-h-[60vh] overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Categories</h3>
            <button 
              onClick={() => document.getElementById('category-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    document.getElementById('category-window')?.classList.add('hidden');
                  }}
                  className={`w-full text-left p-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        
        {/* Control Windows - Clean and minimal design - Updated positions for new left sidebar */}
        {/* Filter Window */}
        <motion.div 
          id="filter-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 glass-effect"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Filters</h3>
            <button 
              onClick={() => document.getElementById('filter-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="fade-in-up">
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm modern-input focus-ring"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
            
            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Rating</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm modern-input focus-ring"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value="0">Any Rating</option>
                <option value="1">1 Star & Up</option>
                <option value="2">2 Stars & Up</option>
                <option value="3">3 Stars & Up</option>
                <option value="4">4 Stars & Up</option>
              </select>
            </div>
            
            <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm modern-input focus-ring"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="low">Under $10</option>
                <option value="medium">$10 - $50</option>
                <option value="high">Over $50</option>
              </select>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('filter-window')?.classList.add('hidden')}
              className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm modern-btn"
            >
              Apply Filters
            </motion.button>
          </div>
        </motion.div>
        
        {/* View Mode Window */}
        <motion.div 
          id="view-mode-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 glass-effect"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">View Mode</h3>
            <button 
              onClick={() => document.getElementById('view-mode-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-3">
            <motion.button
              onClick={() => {
                setViewMode('grid');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-xl border flex items-center gap-2 transition-all modern-btn ${
                viewMode === 'grid' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="h-5 w-5 text-gray-700" />
              <div className="text-left">
                <div className="font-medium text-gray-800 text-sm">Grid View</div>
                <div className="text-xs text-gray-600">Display posts in a grid layout</div>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setViewMode('list');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-xl border flex items-center gap-2 transition-all modern-btn ${
                viewMode === 'list' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="h-5 w-5 text-gray-700" />
              <div className="text-left">
                <div className="font-medium text-gray-800 text-sm">List View</div>
                <div className="text-xs text-gray-600">Display posts in a list layout</div>
              </div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Map Type Window */}
        <motion.div 
          id="map-type-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 glass-effect"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Map Type</h3>
            <button 
              onClick={() => document.getElementById('map-type-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="space-y-2">
            <motion.button
              onClick={() => {
                setMapType('street');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-xl border transition-all modern-btn ${
                mapType === 'street' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">Street Map</div>
              <div className="text-xs text-gray-600">Standard road map view</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('satellite');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-xl border transition-all modern-btn ${
                mapType === 'satellite' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">Satellite View</div>
              <div className="text-xs text-gray-600">Satellite imagery view</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('terrain');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-xl border transition-all modern-btn ${
                mapType === 'terrain' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-gray-800 text-sm">Terrain View</div>
              <div className="text-xs text-gray-600">Topographical view</div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Saved Posts Window */}
        <motion.div 
          id="saved-locations-window" 
          className="hidden absolute top-16 left-20 z-[999] w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-5 max-h-[60vh] overflow-y-auto glass-effect"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Saved Posts</h3>
            <button 
              onClick={() => {
                document.getElementById('saved-locations-window')?.classList.add('hidden');
              }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          {/* Saved Posts Section */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center text-sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Posts ({favoritePosts.size})
            </h4>
            <div className="space-y-2">
              {posts.filter(post => favoritePosts.has(post.id)).length > 0 ? (
                posts.filter(post => favoritePosts.has(post.id)).map((post, index) => (
                  <motion.div 
                    key={`fav-${post.id}`} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-white/70 rounded-xl border border-gray-200 flex justify-between items-start text-sm glass-effect"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedPost(post);
                        document.getElementById('saved-locations-window')?.classList.add('hidden');
                      }}
                    >
                      <div className="font-medium text-gray-800 truncate">{post.title}</div>
                      <div className="text-xs text-gray-600 truncate">{post.description?.substring(0, 40)}{post.description?.length > 40 ? '...' : ''}</div>
                      <div className="text-xs text-gray-500 mt-1">{post.category || "general"}</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePostBookmark(post);
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-500 text-center py-3 text-sm"
                >
                  No saved posts yet
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Listing Panel - Side Panel on Desktop, Bottom Panel on Mobile */}
        <AnimatePresence>
          {showListings && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 h-screen w-full max-md:w-full max-md:inset-0 max-md:absolute bg-white/95 backdrop-blur-sm shadow-2xl z-[999] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 sticky top-0 bg-white/90 backdrop-blur-sm z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Discoveries ({filteredPosts.length})</h2>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowListings(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </motion.button>
              </div>
              
              {/* Filters Section */}
              {showFilters && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="rating">Highest Rated</option>
                        <option value="popular">Most Popular</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                      >
                        <option value="0">Any Rating</option>
                        <option value="1">1 Star & Up</option>
                        <option value="2">2 Stars & Up</option>
                        <option value="3">3 Stars & Up</option>
                        <option value="4">4 Stars & Up</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                      >
                        <option value="all">All Prices</option>
                        <option value="free">Free</option>
                        <option value="low">Under $10</option>
                        <option value="medium">$10 - $50</option>
                        <option value="high">Over $50</option>
                      </select>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Apply
                    </motion.button>
                  </div>
                </div>
              )}
              
              {/* Listings */}
              <div className="p-3 space-y-3">
                {posts.length === 0 ? (
                  // Skeleton loading for posts when loading
                  [...Array(5)].map((_, index) => (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 skeleton"
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="h-3 bg-gray-200 rounded w-12"></div>
                              <div className="h-4 bg-gray-200 rounded w-10"></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                              <div className="h-4 bg-gray-200 rounded w-4"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden cursor-pointer border border-gray-100 smooth-transition discover-card glass-effect"
                      onClick={() => {
                        setSelectedPost(post);
                        flyToPost(post.position);
                        setShowListings(false); // Close the panel after selection
                      }}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          {post.image && (
                            <div className="relative">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-sm">{post.title}</h3>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(post.averageRating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs text-gray-600">
                                  {post.averageRating.toFixed(1)} ({post.totalRatings})
                                </span>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                {post.category}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">by {typeof post.postedBy === 'string' ? post.postedBy : (post.postedBy?.name || post.postedBy?.email || 'Unknown')}</span>
                              {isAuthenticated && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveLocation(post);
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Heart className="w-4 h-4" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No places found</h3>
                    <p className="mt-1 text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Post Window Modal */}
      <AnimatePresence>
        {selectedPost ? (
          <PostWindow
            post={selectedPost}
            currentUser={isAuthenticated ? user : null}
            authToken={isAuthenticated ? localStorage.getItem('token') : null}
            isAuthenticated={isAuthenticated}
            isOpen={!!selectedPost}
            onClose={() => {
              setSelectedPost(null);
              // Clear routing when closing the post window
              clearRouting();
            }}
            onLike={handlePostLike}
            onSave={handlePostSave}
            onRate={handlePostRate}
            onGetDirections={getDirections}
            onComment={(postId) => {
              console.log('Comment clicked for post:', postId);
              // Handle comment click if needed
            }}
          />
        ) : null}
      </AnimatePresence>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setSelectedMapPosition(null);
        }}
        initialPosition={selectedMapPosition}
        onCreatePost={handleCreatePost}
        loading={createPostLoading}
      />
    </div>
  );
};

export default DiscoverMain;