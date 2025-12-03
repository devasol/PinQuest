import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import CustomMarker from './CustomMarker';
import PostWindow from '../PostWindow/PostWindow';
import CurrentLocationMarker from './CurrentLocationMarker';
import MapRouting from './MapRouting';
import CreatePostModal from './CreatePostModal';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Heart, Star, Grid3X3, ThumbsUp, X, SlidersHorizontal, Navigation, Bookmark, Plus, ChevronDown, ChevronUp, TrendingUp, Award, Globe, Users, Bell, User, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './DiscoverMain.css';
import { useModal } from '../../contexts/ModalContext';
import { connectSocket } from '../../services/socketService';
import Sidebar from '../Sidebar/Sidebar';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Custom hook for map events
const MapClickHandler = ({ onMapClick, onMapPositionSelected }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
      
      // If user is authenticated, allow them to create a post at the clicked location
      if (onMapPositionSelected) {
        // Convert the Leaflet LatLng object to a simple position object
        onMapPositionSelected({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
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
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false); // Don't block initial render
  const [initialLoading, setInitialLoading] = useState(false); // Don't block initial render
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('google'); // street, satellite, terrain, dark, light, topographic, navigation, cycle, google
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };
  const [routingActive, setRoutingActive] = useState(false); // Track if routing is active
  const [routingDestination, setRoutingDestination] = useState(null); // Store destination for routing
  const [routingLoading, setRoutingLoading] = useState(false); // Track if routing is being calculated
  const [showCreatePostModal, setShowCreatePostModal] = useState(false); // Track if create post modal is open
  const [selectedMapPosition, setSelectedMapPosition] = useState(null); // Store selected position for post creation
  const [createPostLoading, setCreatePostLoading] = useState(false); // Track if post creation is in progress
  const [locationLoading, setLocationLoading] = useState(false); // Track if updating user location is in progress
  const [bookmarkLoading, setBookmarkLoading] = useState(null); // Track which post is being bookmarked/unbookmarked
  const [followUser, setFollowUser] = useState(false); // Track if map should follow user's movement
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef();
  
  const { showModal } = useModal();
  const { logout: authLogout } = useAuth(); // Get logout from auth context
  
  const handleLogout = () => {
    authLogout(); // Clear authentication state
    navigate("/"); // Redirect to home page after logout
  };

  // Memoized search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return [];
    
    // Create a set to store unique suggestions
    const suggestions = new Set();
    
    // Look for posts that have similar terms or related content
    posts.forEach(post => {
      // Check title for similar terms
      if (post.title && typeof post.title === 'string') {
        const title = post.title.toLowerCase();
        searchTerms.forEach(term => {
          if (title.includes(term) && !title.includes(searchQuery.toLowerCase())) {
            suggestions.add({
              id: `title-suggestion-${post.id}`,
              type: 'title-matching-term',
              title: post.title,
              description: post.description,
              post: post,
              relevance: 'related'
            });
          }
        });
      }
      
      // Check description for similar terms
      if (post.description && typeof post.description === 'string') {
        const description = post.description.toLowerCase();
        searchTerms.forEach(term => {
          if (description.includes(term) && !description.includes(searchQuery.toLowerCase())) {
            suggestions.add({
              id: `desc-suggestion-${post.id}`,
              type: 'description-matching-term',
              title: post.title,
              description: post.description,
              post: post,
              relevance: 'related'
            });
          }
        });
      }
      
      // Check category for similar terms
      if (post.category && typeof post.category === 'string') {
        const category = post.category.toLowerCase();
        searchTerms.forEach(term => {
          if (category.includes(term) && !category.includes(searchQuery.toLowerCase())) {
            suggestions.add({
              id: `cat-suggestion-${post.id}`,
              type: 'category-matching-term',
              title: post.title,
              description: post.description,
              post: post,
              relevance: 'related'
            });
          }
        });
      }
      
      // Check tags for similar terms
      if (Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (typeof tag === 'string') {
            const tagLower = tag.toLowerCase();
            searchTerms.forEach(term => {
              if (tagLower.includes(term) && !tagLower.includes(searchQuery.toLowerCase())) {
                suggestions.add({
                  id: `tag-suggestion-${post.id}`,
                  type: 'tag-matching-term',
                  title: post.title,
                  description: post.description,
                  post: post,
                  relevance: 'related'
                });
              }
            });
          }
        });
      }
      
      // Check poster name for similar terms
      if (post.postedBy) {
        const posterName = typeof post.postedBy === 'string' 
          ? post.postedBy.toLowerCase() 
          : (post.postedBy.name || post.postedBy.email || '').toLowerCase();
        searchTerms.forEach(term => {
          if (posterName.includes(term) && !posterName.includes(searchQuery.toLowerCase())) {
            suggestions.add({
              id: `poster-suggestion-${post.id}`,
              type: 'poster-matching-term',
              title: post.title,
              description: post.description,
              post: post,
              relevance: 'related'
            });
          }
        });
      }
    });
    
    // Also include popular posts as suggestions
    const popularPosts = [...posts]
      .sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0))
      .slice(0, 3)
      .map(post => ({
        id: `popular-${post.id}`,
        type: 'popular',
        title: post.title,
        description: post.description,
        post: post,
        relevance: 'popular'
      }));
    
    // Convert to array and limit results
    const allSuggestions = [
      ...Array.from(suggestions),
      ...popularPosts.filter(pop => !Array.from(suggestions).some(sugg => sugg.post._id === pop.post._id))
    ];
    
    return allSuggestions.slice(0, 5); // Return top 5 suggestions
  }, [searchQuery, posts]);
  
  // State for geocoding search results
  const [geocodingResults, setGeocodingResults] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Simple debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL || "http://localhost:5000/api/v1"}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL || "http://localhost:5000/api/v1"}/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        const notificationButton = event.target.closest('button[aria-label="Notifications"]');
        
        if (isNotificationOpen && !notificationButton) {
          setIsNotificationOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);
  
  // Debounced geocoding function
  const debouncedGeocode = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 3) {
        setGeocodingResults([]);
        return;
      }

      // Only perform geocoding if the query doesn't match any existing posts
      const hasMatchingPost = posts.some(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) || 
        post.description.toLowerCase().includes(query.toLowerCase()) ||
        (typeof post.postedBy === 'string' ? post.postedBy.toLowerCase() : 
         (typeof post.postedBy === 'object' && post.postedBy.name ? post.postedBy.name.toLowerCase() : '')
        ).includes(query.toLowerCase()) ||
        post.category.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      // If we have matching posts, don't geocode (let the existing search handle it)
      if (hasMatchingPost) {
        setGeocodingResults([]);
        return;
      }

      setIsGeocoding(true);
      try {
        const result = await geocodeAddress(query);
        setGeocodingResults([{
          id: 'geocoded-result',
          type: 'geocoded-location',
          title: result.displayName,
          description: `Location: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
          location: {
            latitude: result.latitude,
            longitude: result.longitude
          },
          relevance: 'geocoded'
        }]);
      } catch (error) {
        setGeocodingResults([]);
        console.log('Geocoding failed, this is normal for non-location queries'); // Not an error we need to report
      } finally {
        setIsGeocoding(false);
      }
    }, 500), // 500ms debounce
    [posts]
  );

  // Update geocoding when search query changes
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      debouncedGeocode(searchQuery);
    } else {
      setGeocodingResults([]);
    }
  }, [searchQuery, debouncedGeocode]);
  
  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);
  const selectedPostRef = useRef(selectedPost); // Create a ref to track selectedPost
  const { isAuthenticated, user } = useAuth();

  // Update the ref when selectedPost changes
  useEffect(() => {
    selectedPostRef.current = selectedPost;
  }, [selectedPost]);
  
  // Fetch notifications when user is authenticated and set up socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to socket
    const socket = connectSocket(token);

    // Fetch notifications on mount and periodically
    const fetchNotifications = async () => {
      try {
        // Fetch unread count
        const countResponse = await fetch(
          `${API_BASE_URL || "http://localhost:5000/api/v1"}/notifications/unread-count`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setUnreadCount(countData.data?.count || 0);
        } else {
          console.error('Failed to fetch unread count:', countResponse.status, countResponse.statusText);
        }

        // Fetch recent notifications to display in dropdown
        const notifResponse = await fetch(
          `${API_BASE_URL || "http://localhost:5000/api/v1"}/notifications?page=1&limit=5`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          setNotifications(notifData.data?.notifications || []);
        } else {
          console.error('Failed to fetch notifications:', notifResponse.status, notifResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up socket listeners for real-time notifications
    socket.on('newNotification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Add new notification, keep only 5 most recent
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notificationRead', (data) => {
      // Update local state when a notification is marked as read from elsewhere
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Set up polling as backup if socket fails
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup function
    return () => {
      socket.off('newNotification');
      socket.off('notificationRead');
      clearInterval(interval);
    };
  }, [isAuthenticated, user, API_BASE_URL]);

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

    // Update the selected post's bookmarked status if it's the same post
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(prev => ({
        ...prev,
        bookmarked: isSaved,
        saved: isSaved
      }));
    }

    // Update the main posts array to reflect the bookmark change
    setPosts(prevPosts => prevPosts.map(post => {
      if (post && post._id === postId) {
        return {
          ...post,
          bookmarked: isSaved,
          saved: isSaved
        };
      }
      return post;
    }));

    // Also update filteredPosts if needed
    setFilteredPosts(prevFilteredPosts => prevFilteredPosts.map(post => {
      if (post && post._id === postId) {
        return {
          ...post,
          bookmarked: isSaved,
          saved: isSaved
        };
      }
      return post;
    }));
  }, [selectedPost]);

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

  // Fetch posts from the backend API - with concurrency control
  const fetchPostsRef = useRef();
  const fetchPosts = useCallback(async (preserveSelectedPost = null, limit = 50) => {
    // Prevent multiple concurrent requests for the same data
    if (fetchPostsRef.current) {
      console.log("Request already in progress, skipping duplicate fetch");
      return;
    }
    
    // Set a flag to indicate we're currently fetching
    fetchPostsRef.current = true;

    try {
      // Fetch posts with a default limit to improve initial load time
      let url = `${API_BASE_URL}/posts`;
      if (limit) {
        url += `?limit=${limit}`;
      }
      
      // Set loading state for posts
      setLoading(true);
      
      // Add a timeout to the fetch request to avoid hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        // Use cache to improve performance
        cache: 'default',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle 429 specifically to avoid UI spam
        if (response.status === 429) {
          console.log("Rate limit exceeded. Slowing down requests...");
          // Don't set error for rate limit to avoid spamming the UI
          return;
        }
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the API data to match the format expected by the frontend
        // Handle both location formats: coordinates array and latitude/longitude fields
        let transformedPosts = result.data
          .filter(post => {
            // Check if post exists and has location data
            if (!post || !post.location) {
              return false;
            }
            
            // Check if the post has valid location data in either format
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
            return false;
          })
          .map(post => {
            let position;
            // Handle GeoJSON format [longitude, latitude]
            if (post && post.location && post.location.coordinates && Array.isArray(post.location.coordinates) 
                && post.location.coordinates.length === 2) {
              // Convert to [latitude, longitude] for Leaflet
              position = [post.location.coordinates[1] || 0, post.location.coordinates[0] || 0];
            } 
            // Handle separate latitude/longitude format
            else if (post && post.location && typeof post.location.latitude === 'number' && 
                     typeof post.location.longitude === 'number') {
              position = [post.location.latitude, post.location.longitude];
            }
            
            return {
              _id: post && post._id ? post._id : null,
              id: post && post._id ? post._id : null, // Keep both for compatibility
              title: (post && post.title) || "Untitled",
              description: (post && post.description) || "No description provided",
              image: post && post.image ? post.image : null,
              images: (post && post.images) || [],
              averageRating: (post && post.averageRating) || 0,
              totalRatings: (post && post.totalRatings) || 0,
              postedBy: (post && (post.postedBy || (post.postedBy?.name))) || "Unknown", // Preserve full postedBy object
              category: (post && post.category) || "general",
              datePosted: (post && post.datePosted) || new Date().toISOString(),
              position: position, // [lat, lng] format for Leaflet
              price: (post && post.price) || 0,
              tags: (post && post.tags) || [],
              comments: (post && post.comments) || [],
              likes: (post && post.likes) || [], // Add likes array
              likesCount: (post && post.likesCount) || 0, // Add likes count
              location: {
                // Ensure location has proper latitude and longitude for the directions feature
                latitude: (post && post.location?.latitude) || 
                         (post && post.location?.coordinates && post.location.coordinates[1]) || 
                         (position && position[0]), // fallback to position[0] if available
                longitude: (post && post.location?.longitude) || 
                          (post && post.location?.coordinates && post.location.coordinates[0]) || 
                          (position && position[1]), // fallback to position[1] if available
                // Preserve other location properties if they exist
                ...(post && post.location ? post.location : {})
              },
            };
          });
        
        // Apply client-side limit if specified
        if (limit && limit > 0) {
          transformedPosts = transformedPosts.slice(0, limit);
        }
        
        // If we're preserving a selected post, we need to handle it specially
        if (preserveSelectedPost && preserveSelectedPost._id) {
          // Find if the selected post exists in the newly fetched data
          const updatedSelectedPost = transformedPosts.find(p => p._id === preserveSelectedPost._id);
          
          if (updatedSelectedPost) {
            // Update the selected post with only the fresh volatile data while preserving detailed data
            setSelectedPost(prev => {
              // Check if prev is null to avoid accessing _id on null
              if (!prev) return updatedSelectedPost;
              return {
                ...prev, // Preserve existing data first
                ...updatedSelectedPost, // Then apply fresh data, overwriting if keys exist
              };
            });
          }
        }
        
        // Filter out any null or undefined posts before setting state
        const validTransformedPosts = transformedPosts.filter(post => post && post._id);
        setPosts(validTransformedPosts);
        setFilteredPosts(validTransformedPosts);
      } else {
        console.error("Error: Invalid API response format", result);
        setError("Failed to load posts from server: Invalid response format");
        setPosts([]);
        setFilteredPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      // Provide more user-friendly error message based on error type
      if (err.name === 'AbortError') {
        setError("Request timed out. Please check your network connection and try again.");
      } else if (err.message.includes('Failed to fetch')) {
        setError("Unable to connect to the server. The server may be down or unreachable. Please make sure the backend server is running.");
      } else if (err.message.includes('Too many requests')) {
        // Don't show rate limit error as it will be repetitive (handled in try block)
        console.log("Rate limit exceeded. Slowing down requests...");
        // Don't set error for rate limit to avoid spamming the UI
      } else {
        setError("Failed to load posts: " + err.message);
      }
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      // Reset the flag and loading state
      fetchPostsRef.current = false;
      setLoading(false);
    }
  }, []); // Empty dependency array since we're using ref to track state

  // Fetch saved locations if user is authenticated
  const fetchSavedLocationsRef = useRef();
  const fetchSavedLocations = useCallback(async () => {
    if (isAuthenticated) {
      // Prevent multiple concurrent requests
      if (fetchSavedLocationsRef.current) {
        console.log("Saved locations fetch already in progress, skipping duplicate request");
        return;
      }
      
      fetchSavedLocationsRef.current = true;
      
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
          if (response.status === 429) {
            console.log("Rate limit exceeded for saved locations API. Skipping this request...");
            return;
          }
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
        if (!err.message.includes('Too many requests')) {
          setSavedLocations([]);
        }
      } finally {
        fetchSavedLocationsRef.current = false;
      }
    } else {
      // If not authenticated, reset to empty
      setSavedLocations([]);
    }
  }, [isAuthenticated, API_BASE_URL]);

  // Fetch user's favorite posts if user is authenticated
  const fetchUserFavoritePostsRef = useRef();
  const fetchUserFavoritePosts = useCallback(async () => {
    if (isAuthenticated && user) {
      // Prevent multiple concurrent requests
      if (fetchUserFavoritePostsRef.current) {
        console.log("Favorite posts fetch already in progress, skipping duplicate request");
        return;
      }
      
      fetchUserFavoritePostsRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            console.log("Rate limit exceeded for favorites API. Skipping this request...");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data?.favorites)) {
          // Extract post IDs from favorites to create a Set of favorite post IDs
          const favoritePostIds = new Set(
            result.data.favorites
              .map(fav => {
                // Handle different possible structures of favorite objects
                if (fav.post && typeof fav.post === 'object' && fav.post._id) {
                  return fav.post._id;
                } else if (fav.postId) {
                  return fav.postId;
                } else if (typeof fav.post === 'string') {
                  return fav.post;
                }
                return null;
              })
              .filter(id => id !== null) // Remove any null/undefined values
          );
          setFavoritePosts(favoritePostIds);
          
          // Update the posts array to mark them as bookmarked
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post && post._id) {
                return {
                  ...post,
                  bookmarked: favoritePostIds.has(post._id),
                  saved: favoritePostIds.has(post._id)
                };
              }
              return post;
            })
          );
          
          // Also update filtered posts
          setFilteredPosts(prevFilteredPosts => 
            prevFilteredPosts.map(post => {
              if (post && post._id) {
                return {
                  ...post,
                  bookmarked: favoritePostIds.has(post._id),
                  saved: favoritePostIds.has(post._id)
                };
              }
              return post;
            })
          );
          
          // Also update selected post if it exists
          if (selectedPost && selectedPost._id) {
            setSelectedPost(prev => {
              // Check if prev is null to avoid the error
              if (!prev || !prev._id) return prev;
              return {
                ...prev,
                bookmarked: favoritePostIds.has(prev._id),
                saved: favoritePostIds.has(prev._id)
              };
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user favorite posts:", err);
        if (!err.message.includes('Too many requests')) {
          // Don't reduce favorites if it's a rate limit error
        }
      } finally {
        fetchUserFavoritePostsRef.current = false;
      }
    }
  }, [isAuthenticated, user, API_BASE_URL]); // Removed selectedPost to prevent circular dependency

  // Update posts when favoritePosts changes to ensure correct bookmark status
  useEffect(() => {
    if (favoritePosts) {
      // Update the posts array to mark them as bookmarked based on favoritePosts
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post && post._id) {
            return {
              ...post,
              bookmarked: favoritePosts.has(post._id),
              saved: favoritePosts.has(post._id)
            };
          }
          return post;
        })
      );
      
      // Also update filtered posts
      setFilteredPosts(prevFilteredPosts => 
        prevFilteredPosts.map(post => {
          if (post && post._id) {
            return {
              ...post,
              bookmarked: favoritePosts.has(post._id),
              saved: favoritePosts.has(post._id)
            };
          }
          return post;
        })
      );
      
      // Also update selected post if it exists
      if (selectedPost && selectedPost._id) {
        setSelectedPost(prev => {
          // Check if prev is null to avoid the error
          if (!prev || !prev._id) return prev;
          return {
            ...prev,
            bookmarked: favoritePosts.has(prev._id),
            saved: favoritePosts.has(prev._id)
          };
        });
      }
    }
  }, [favoritePosts]); // Removed selectedPost to prevent circular dependency

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

  // Initial data fetch - non-blocking
  useEffect(() => {
    // Immediately show the map without waiting for data
    setInitialLoading(false);
    
    // Fetch saved locations and favorite posts in background (not blocking)
    if (isAuthenticated) {
      setTimeout(() => {
        fetchSavedLocations(); // Run in background to avoid blocking
        fetchUserFavoritePosts(); // Fetch favorite posts as well
      }, 0);
    }
    
    // Fetch posts in background
    fetchPosts(null, 50); // Fetch limited posts initially

    // Set up periodic refresh every 120 seconds to reduce load and avoid rate limiting
    fetchIntervalRef.current = setInterval(() => {
      // Preserve the selected post if it exists before refreshing
      // Use ref to get the current value instead of closure value
      fetchPosts(selectedPostRef.current, 50);
      
      if (isAuthenticated) {
        // Stagger the API calls to avoid overloading
        setTimeout(() => fetchSavedLocations(), 500);
        setTimeout(() => fetchUserFavoritePosts(), 1000);
      }
    }, 120000); // Changed from 60 to 120 seconds to avoid rate limiting
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchPosts, fetchSavedLocations, fetchUserFavoritePosts, isAuthenticated]); // Remove selectedPost to avoid interval recreation

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

  // Get user location for initial centering - non-blocking
  useEffect(() => {
    let watchId;
    
    // Set a quick default location immediately to avoid world view
    const defaultLocation = [20.5937, 78.9629]; // India coordinates as a default
    setMapCenter(defaultLocation);
    setMapZoom(3); // Start with a reasonable zoom level immediately (not too zoomed out)
    
    if (navigator.geolocation) {
      // Try to get initial position with reduced timeout for faster response
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Center the map on the user's location when page loads with a nice zoom level
          if (mapRef.current) {
            mapRef.current.setView(userPos, 13); // Use zoom 13 for better initial experience
          } else {
            // If map isn't ready yet, update the state
            setMapCenter(userPos);
            setMapZoom(13);
          }
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Fallback to default location with better zoom
          if (mapRef.current) {
            mapRef.current.setView(defaultLocation, 3);
          }
        },
        {
          enableHighAccuracy: true, // Changed back to true for accurate location
          timeout: 30000, // Increased timeout to 30 seconds to allow for GPS acquisition
          maximumAge: 0, // Do not use cached location - get fresh location
        }
      );
      
      // Watch for position updates to track user movement in real-time
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Update map to follow user if they've enabled follow mode
          if (followUser && mapRef.current) {
            mapRef.current.setView(userPos, 15); // Use zoom level 15 for better focus on current location
          }
        },
        (error) => {
          console.log("Geolocation watch error:", error.message);
        },
        {
          enableHighAccuracy: true, // Changed back to true for accurate location
          maximumAge: 0, // Do not use cached location - get fresh location
          timeout: 30000, // 30 seconds to allow for GPS acquisition
        }
      );
    } else {
      // Geolocation is not supported
      console.log("Geolocation is not supported by this browser");
      // Use a default location
      if (mapRef.current) {
        mapRef.current.setView(defaultLocation, 3);
      }
    }
    
    // Cleanup function to stop watching position
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // Run once when component mounts
  
  // Always request location when component mounts to ensure permission is requested
  useEffect(() => {
    // Only request location if user location doesn't exist yet
    if (!userLocation && navigator.geolocation) {
      const requestLocation = async () => {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 30000, // 30 seconds to allow for GPS acquisition
                maximumAge: 0 // Don't use cached position - get fresh location
              }
            );
          });
          
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          
          // Center the map on the user's location
          if (mapRef.current) {
            mapRef.current.setView(userPos, 13);
          } else {
            setMapCenter(userPos);
            setMapZoom(13);
          }
        } catch (error) {
          console.log("Location permission denied or unavailable:", error.message);
        }
      };
      
      requestLocation();
    }
  }, [userLocation]);

  // Fly to a post's location on the map
  const flyToPost = useCallback((position) => {
    if (mapRef.current && position && Array.isArray(position) && position.length >= 2) {
      mapRef.current.flyTo(position, 15);
    }
  }, []);

  // Toggle post bookmark/favorite status
  const togglePostBookmark = async (post) => {
    if (!isAuthenticated) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to bookmark posts',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to bookmark posts',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }
    
    // Check if post exists before accessing its properties
    if (!post || !post.id) {
      console.error("Invalid post provided to togglePostBookmark:", post);
      return;
    }
    
    // Set loading state for this specific post
    setBookmarkLoading(post.id);
    
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
        showModal({
          title: "Error",
          message: `Failed to ${isBookmarked ? 'un' : ''}bookmark post`,
          type: 'error',
          confirmText: 'OK'
        });
      }
    } catch (err) {
      console.error(`Error ${isBookmarked ? 'un' : ''}bookmarking post:`, err);
      showModal({
        title: "Error",
        message: `Error ${isBookmarked ? 'un' : 'book' }marking post`,
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      // Reset loading state for this post
      setBookmarkLoading(null);
    }
  };

  // Save a location (separate functionality from bookmarking posts)
  const saveLocation = async (locationData) => {
    if (!isAuthenticated) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to save locations',
        type: 'info',
        confirmText: 'OK'
      });
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
          showModal({
            title: "Error",
            message: 'Failed to remove location',
            type: 'error',
            confirmText: 'OK'
          });
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
          showModal({
            title: "Error",
            message: 'Failed to save location',
            type: 'error',
            confirmText: 'OK'
          });
        }
      }
    } catch (err) {
      console.error('Error saving location:', err);
      showModal({
        title: "Error",
        message: 'Error saving location',
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  // Remove a saved location
  const removeSavedLocation = async (locationId) => {
    if (!isAuthenticated) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to manage saved locations',
        type: 'info',
        confirmText: 'OK'
      });
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
        showModal({
          title: "Error",
          message: 'Failed to remove location',
          type: 'error',
          confirmText: 'OK'
        });
      }
    } catch (err) {
      console.error('Error removing location:', err);
      showModal({
        title: "Error",
        message: 'Error removing location',
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  // Function to show saved locations on the map
  const showSavedLocations = () => {
    if (!isAuthenticated) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to view saved locations',
        type: 'info',
        confirmText: 'OK'
      });
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
      showModal({
        title: "Geolocation Not Supported",
        message: 'Geolocation is not supported by your browser',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    // Validate the destination position before attempting to get user location
    if (!position || !Array.isArray(position) || position.length < 2) {
      showModal({
        title: "Invalid Position",
        message: 'Invalid destination position provided',
        type: 'error',
        confirmText: 'OK'
      });
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
            showModal({
              title: "Location Error",
              message: 'Could not get your location. Showing destination on map instead.',
              type: 'info',
              confirmText: 'OK'
            });
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
  const updateUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      // Fallback for browsers that don't support geolocation
      showModal({
        title: "Geolocation Not Supported",
        message: 'Geolocation is not supported by your browser. Please enable location services or try a different browser.',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    // Set loading state
    setLocationLoading(true);

    try {
      const position = await new Promise((resolve, reject) => {
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 30000, // Increased timeout to 30 seconds to allow for GPS acquisition
          maximumAge: 0, // Do not use any cached position - force fresh location reading
        };

        navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
      });

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
      
      // Show success message to confirm location update
      console.log(`Location updated to: [${latitude}, ${longitude}]`);
    } catch (error) {
      console.error("Geolocation error:", error);
      let errorMessage = "Could not get your current location. ";
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Location access was denied. Please allow location access in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage += "The request to get your location timed out. This might happen if you're indoors, underground, or have a weak GPS signal. Try moving to an area with better satellite visibility, or ensure Wi-Fi and location services are enabled on your device.";
          break;
        default:
          errorMessage += "Please make sure location services are enabled and you have allowed location access. For local development, try opening this site over HTTPS.";
          break;
      }
      
      showModal({
        title: "Location Error",
        message: errorMessage,
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      // Reset loading state in all cases
      setLocationLoading(false);
    }
  }, []);

  // Clear the routing state
  const clearRouting = useCallback(() => {
    setRoutingActive(false);
    setRoutingDestination(null);
    setRoutingLoading(false); // Also reset loading state
  }, []);

  // Function to geocode an address and find coordinates
  const geocodeAddress = async (address) => {
    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        return {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          displayName: location.display_name
        };
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Function to toggle windows - closes previous window and opens new one
  const toggleWindow = (windowId) => {
    // Get all window IDs
    const allWindowIds = [
      'search-window', 
      'category-window', 
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
      showModal({
        title: "Authentication Required",
        message: 'Please login to create posts',
        type: 'info',
        confirmText: 'OK'
      });
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
        
        showModal({
          title: "Success",
          message: 'Post created successfully!',
          type: 'success',
          confirmText: 'OK'
        });
      } else {
        throw new Error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showModal({
        title: "Error",
        message: error.message || 'An error occurred while creating the post',
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setCreatePostLoading(false);
    }
  };

  // Get the appropriate tile layer URL based on map type
  const getTileLayerUrl = () => {
    switch (mapType) {
      case 'google':
        // Google Maps-like style using Stadia Maps (Alidade)
        return "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png";
      case 'street':
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case 'satellite':
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case 'terrain':
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      case 'dark':
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      case 'light':
        return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      case 'topographic':
        return "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      case 'navigation':
        return "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      case 'cycle':
        return "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";
      default: // google as fallback
        return "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png";
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 fixed inset-0 z-[50000]">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center p-6 bg-white rounded-xl shadow-xl max-w-md z-[50001] relative">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Discover Page</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null); // Clear the error state first
                fetchPosts();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors cursor-pointer z-[50002]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Search bar at the top center of the map (adjusted for sidebar) */}
      <div className="top-search-bar absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for places, locations, categories..."
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // You can add search handling here if needed
              }
            }}
          />
        </div>
      </div>
      
      {/* Top-right user controls positioned above the map (adjusted for sidebar) */}
      <div className="top-right-controls absolute top-4 right-4 z-[1000] flex items-center gap-3">
        {/* User controls - login, notifications, name */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-gray-200">
            {/* Notifications */}
            <div className="relative">
              <button 
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div 
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[7001]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div 
                            key={notification._id} 
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              markNotificationAsRead(notification._id);
                              // Navigate to the relevant post
                              if (notification.post) {
                                navigate(`/discover#${notification.post}`);
                              }
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"} text-gray-800`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatNotificationDate(notification.date)}
                                </p>
                              </div>
                              {!notification.read && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification._id);
                                  }}
                                  className="ml-2 text-gray-400 hover:text-blue-600"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <Bell className="mx-auto h-10 w-10 text-gray-300" />
                        <h3 className="mt-2 font-medium text-gray-900">No notifications</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          You'll see notifications here when they arrive.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User profile */}
            <div className="flex items-center space-x-2">
              <Link
                to={user?.role === "admin" ? "/admin/dashboard" : "/profile"}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {user?.name ||
                    (user?.role === "admin" ? "Admin" : "Profile")}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          // Login button for unauthenticated users
          <Link
            to="/login"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <span className="text-sm font-medium">Login</span>
            <User className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      {/* Map and results area - adjust to account for sidebar */}
      <div className="map-container">
        {/* Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={18}
          zoomControl={true} // Let's use Leaflet's default controls
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          animate={true}
          easeLinearity={0.35}
          style={{ height: '100vh', width: '100%' }}
          ref={mapRef}
          className="z-0"
          maxBounds={[
            [-90, -180], // Southwest coordinates (bottom-left)
            [90, 180]    // Northeast coordinates (top-right)
          ]}
          maxBoundsViscosity={0.75}
          worldCopyJump={true}
          attributionControl={true}
        >
          <TileLayer
            attribution={mapType === 'satellite' 
              ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' 
              : mapType === 'terrain'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://opentopomap.org/">OpenTopoMap</a>'
              : mapType === 'dark' || mapType === 'light'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : mapType === 'topographic'
              ? '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
              : mapType === 'navigation'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://hot.opentreetmap.org/">Humanitarian OpenStreetMap Team</a>'
              : mapType === 'cycle'
              ? 'CyclOSM &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={getTileLayerUrl()}
            maxZoom={18}
            minZoom={2}
            tileSize={256}
            zoomOffset={0}
            detectRetina={true}
            updateWhenIdle={true}
            updateWhenZooming={false}
            unloadInvisibleTiles={true}
            reuseTiles={true}
            keepBuffer={2}
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
                showModal({
                  title: "Authentication Required",
                  message: 'Please login to create posts',
                  type: 'info',
                  confirmText: 'OK'
                });
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
                // Center the map on the user's location when marker is clicked
                if (mapRef.current) {
                  mapRef.current.flyTo(position, 15);
                }
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
          
          {/* Loading overlay for posts */}
          {loading && filteredPosts.length === 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[49999] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-xl font-medium text-gray-700">Loading map data...</p>
                <p className="text-sm text-gray-500 mt-2">Discovering amazing places near you</p>
              </div>
            </div>
          )}
          
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
            className="absolute top-20 right-4 z-[999]"
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
        {/* Universal Sidebar - Full height from top to bottom */}
        <Sidebar 
          onLogout={handleLogout} 
          user={isAuthenticated ? user : null} 
          toggleWindow={toggleWindow}
          showSavedLocationsOnMap={showSavedLocationsOnMap}
          updateUserLocation={updateUserLocation}
          followUser={followUser}
          locationLoading={locationLoading}
          setFollowUser={setFollowUser}
          isSidebarExpanded={isSidebarExpanded}
          toggleSidebar={toggleSidebar}
        />
        
        {/* Search Window */}
        <motion.div 
          id="search-window" 
          className="hidden absolute top-20 left-20 z-[999] sidebar-window search-window bg-white rounded-xl shadow-xl p-6 max-w-md w-full backdrop-blur-sm border border-gray-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Search</h3>
            <button 
              onClick={() => document.getElementById('search-window')?.classList.add('hidden')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for locations, categories, or keywords..."
                className="w-full pl-12 pr-4 py-3 rounded-xl modern-input focus-ring text-base"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
              />
            </div>
            
            {/* Search Results - Show both post matches and geocoded locations */}
            {(searchQuery && (searchSuggestions.length > 0 || geocodingResults.length > 0)) && (
              <div className="border-t border-gray-200 pt-4 max-h-[60vh] overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Search Results</h4>
                <div className="space-y-2">
                  {/* Geocoded locations first */}
                  {geocodingResults.map((result) => (
                    <motion.div
                      key={result.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white/70 rounded-xl border border-gray-200 cursor-pointer hover:bg-white transition-colors flex items-start gap-3"
                      onClick={() => {
                        // Set the map to the geocoded location and open the create post modal
                        if (mapRef.current) {
                          mapRef.current.flyTo([result.location.latitude, result.location.longitude], 15);
                        }
                        // Pass the location in the correct format expected by CreatePostModal
                        setSelectedMapPosition({
                          lat: result.location.latitude,
                          lng: result.location.longitude
                        });
                        setShowCreatePostModal(true);
                        // Close the search window
                        document.getElementById('search-window')?.classList.add('hidden');
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{result.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.description}</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Location
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Post suggestions */}
                  {searchSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-white/70 rounded-xl border border-gray-200 cursor-pointer hover:bg-white transition-colors flex items-start gap-3"
                      onClick={() => {
                        setSelectedPost(suggestion.post);
                        flyToPost(suggestion.post.position);
                        // Close the search window
                        document.getElementById('search-window')?.classList.add('hidden');
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{suggestion.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-1 mt-1">{suggestion.description}</div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center">
                        <Bookmark className="w-3 h-3 mr-1" />
                        Post
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show loading indicator when geocoding */}
            {isGeocoding && (
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm">Searching location...</span>
                </div>
              </div>
            )}
            
            {/* Show "no results" when search has no matches */}
            {searchQuery && searchQuery.trim().length > 0 && searchSuggestions.length === 0 && geocodingResults.length === 0 && !isGeocoding && (
              <div className="pt-4 text-center text-gray-500 text-sm">
                No matches found for "{searchQuery}"
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Category Window */}
        <motion.div 
          id="category-window" 
          className="hidden absolute top-20 left-20 z-[999] sidebar-window bg-white rounded-xl shadow-xl p-6 max-w-md w-full backdrop-blur-sm border border-gray-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Categories</h3>
            <button 
              onClick={() => document.getElementById('category-window')?.classList.add('hidden')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
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
                  className={`w-full text-left p-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white border border-blue-500'
                      : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-6 w-6 flex-shrink-0" />
                  <span className="text-base font-semibold">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        

        
        {/* View Mode Window */}
        <motion.div 
          id="view-mode-window" 
          className="hidden absolute top-20 left-20 z-[999] sidebar-window bg-white rounded-xl shadow-xl p-6 max-w-md w-full backdrop-blur-sm border border-gray-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">View Mode</h3>
            <button 
              onClick={() => document.getElementById('view-mode-window')?.classList.add('hidden')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-3">
            <motion.button
              onClick={() => {
                setViewMode('grid');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all flex items-start gap-4 border ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div className="text-left flex-1">
                <div className="font-bold text-base mb-1">Grid View</div>
                <div className="text-sm opacity-90">Display posts in a grid layout</div>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setViewMode('list');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all flex items-start gap-4 border ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ThumbsUp className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div className="text-left flex-1">
                <div className="font-bold text-base mb-1">List View</div>
                <div className="text-sm opacity-90">Display posts in a list layout</div>
              </div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Map Type Window */}
        <motion.div 
          id="map-type-window" 
          className="hidden absolute top-20 left-20 z-[999] sidebar-window bg-white rounded-xl shadow-xl p-6 max-w-md w-full backdrop-blur-sm border border-gray-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Map Type</h3>
            <button 
              onClick={() => document.getElementById('map-type-window')?.classList.add('hidden')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
            <motion.button
              onClick={() => {
                setMapType('google');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'google' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Google Maps</div>
              <div className="text-sm opacity-90">Classic Google Maps style</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('street');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'street' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Street Map</div>
              <div className="text-sm opacity-90">Standard road map view</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('satellite');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'satellite' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Satellite View</div>
              <div className="text-sm opacity-90">Satellite imagery view</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('terrain');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'terrain' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Terrain View</div>
              <div className="text-sm opacity-90">Topographical view</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('dark');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'dark' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Dark Theme</div>
              <div className="text-sm opacity-90">High contrast dark map</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('light');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'light' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Light Theme</div>
              <div className="text-sm opacity-90">Clean light map style</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('topographic');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'topographic' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Topographic</div>
              <div className="text-sm opacity-90">Detailed topographical map</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('navigation');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'navigation' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Navigation</div>
              <div className="text-sm opacity-90">Humanitarian/hot map style</div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                setMapType('cycle');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 rounded-lg transition-all border ${
                mapType === 'cycle' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-base mb-1">Cycle Map</div>
              <div className="text-sm opacity-90">Cycling-specific map features</div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Saved Posts Window */}
        <motion.div 
          id="saved-locations-window" 
          className="hidden absolute top-20 left-20 z-[999] sidebar-window bg-white rounded-xl shadow-xl p-6 max-w-md w-full backdrop-blur-sm border border-gray-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Saved Posts</h3>
            <button 
              onClick={() => {
                document.getElementById('saved-locations-window')?.classList.add('hidden');
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Saved Posts Section */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center text-base">
              <Bookmark className="h-5 w-5 mr-2.5" />
              Saved Posts ({favoritePosts.size})
            </h4>
            <div className="space-y-3">
              {posts.filter(post => favoritePosts.has(post.id)).length > 0 ? (
                posts.filter(post => favoritePosts.has(post.id)).map((post, index) => (
                  <motion.div 
                    key={`fav-${post.id}`} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-white rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedPost(post);
                        document.getElementById('saved-locations-window')?.classList.add('hidden');
                      }}
                    >
                      <div className="font-bold text-gray-800 mb-1.5">{post.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2 mb-2">{post.description?.substring(0, 60)}{post.description?.length > 60 ? '...' : ''}</div>
                      <div className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {post.category || "general"}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePostBookmark(post);
                      }}
                      className="ml-2 p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                      disabled={bookmarkLoading === post.id}
                    >
                      {bookmarkLoading === post.id ? (
                        <div className="h-4 w-4 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        </div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-500 text-center py-6 text-base"
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
              className="absolute top-20 right-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl z-[999] overflow-y-auto border border-gray-200"
            >
              <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Results ({filteredPosts.length})</h2>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowListings(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
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
                      className="bg-white rounded-lg overflow-hidden border border-gray-200 skeleton"
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
                      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer border border-gray-200 smooth-transition discover-card"
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
                                    togglePostBookmark(post);
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  disabled={bookmarkLoading === post.id}
                                >
                                  {bookmarkLoading === post.id ? (
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                    </div>
                                  ) : (
                                    <Heart className={`w-4 h-4 ${favoritePosts.has(post.id) ? 'fill-current' : ''}`} />
                                  )}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  // Show search suggestions when search query exists but no results found
                  searchQuery ? (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No places match your search</h3>
                        <p className="mt-1 text-xs text-gray-500">Here are some suggestions based on your search:</p>
                      </div>
                      
                      {/* Search suggestions */}
                      {searchSuggestions.length > 0 ? (
                        <div className="space-y-3">
                          {searchSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                              whileHover={{ y: -2, scale: 1.01 }}
                              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer border border-gray-200 smooth-transition discover-card p-3"
                              onClick={() => {
                                setSelectedPost(suggestion.post);
                                flyToPost(suggestion.post.position);
                                setShowListings(false); // Close the panel after selection
                                // Clear the search query to show the selected post
                                setSearchQuery('');
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {suggestion.post.image && (
                                  <div className="relative">
                                    <img
                                      src={suggestion.post.image}
                                      alt={suggestion.post.title}
                                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">{suggestion.post.title}</h3>
                                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{suggestion.post.description}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < Math.floor(suggestion.post.averageRating)
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-1 text-xs text-gray-600">
                                        {suggestion.post.averageRating.toFixed(1)} ({suggestion.post.totalRatings})
                                      </span>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                      {suggestion.post.category}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">by {typeof suggestion.post.postedBy === 'string' ? suggestion.post.postedBy : (suggestion.post.postedBy?.name || suggestion.post.postedBy?.email || 'Unknown')}</span>
                                    {isAuthenticated && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePostBookmark(suggestion.post);
                                        }}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                        disabled={bookmarkLoading === suggestion.post.id}
                                      >
                                        {bookmarkLoading === suggestion.post.id ? (
                                          <div className="w-4 h-4 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                          </div>
                                        ) : (
                                          <Heart className={`w-4 h-4 ${favoritePosts.has(suggestion.post.id) ? 'fill-current' : ''}`} />
                                        )}
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No places match your search</h3>
                          <p className="mt-1 text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
                          
                          {/* Show popular posts as fallback */}
                          <div className="mt-6">
                            <h4 className="text-xs font-medium text-gray-700 mb-3">Popular locations you might like:</h4>
                            <div className="space-y-2">
                              {posts
                                .sort((a, b) => (b.totalRatings || 0) - (a.totalRatings || 0))
                                .slice(0, 3)
                                .map((post, index) => (
                                  <motion.div
                                    key={`popular-${post.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="text-left bg-white rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
                                    onClick={() => {
                                      setSelectedPost(post);
                                      flyToPost(post.position);
                                      setShowListings(false);
                                    }}
                                  >
                                    <div className="text-xs font-medium text-gray-800 truncate">{post.title}</div>
                                    <div className="text-xs text-gray-600">{post.totalRatings || 0} ratings</div>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Original "no places found" message when no search query
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No places found</h3>
                      <p className="mt-1 text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
                    </motion.div>
                  )
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