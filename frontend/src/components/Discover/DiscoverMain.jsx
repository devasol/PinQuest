import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import CustomMarker from './CustomMarker';
import PostWindow from '../PostWindow/PostWindow';
import CurrentLocationMarker from './CurrentLocationMarker';
import MapRouting from './MapRouting';
import EnhancedSidebarWindows from './EnhancedSidebarWindows';
import PostCreationForm from './PostCreationForm';

import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Heart, Star, Grid3X3, ThumbsUp, X, SlidersHorizontal, Navigation, Bookmark, Plus, ChevronDown, ChevronUp, TrendingUp, Award, Globe, Users, Bell, User, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './DiscoverMain.css';
import './ResponsiveLayout.css'; // Import the new responsive layout CSS
import { useModal } from '../../contexts/ModalContext';
import { connectSocket } from '../../services/socketService';
import { postApi } from '../../services/api'; // Import the postApi to handle post creation
import apiService from '../../services/api'; // Import the default apiService for direct upload functionality
import { getImageUrl } from '../../utils/imageUtils'; // Import getImageUrl utility
import Sidebar from '../Sidebar/Sidebar';
import SearchBar from '../Search/SearchBar';

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
      const windows = ['category-window', 'view-mode-window', 'map-type-window', 'saved-locations-window', 'notifications-window'];
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
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('google'); // street, satellite, terrain, dark, light, topographic, navigation, cycle, google
  const [savedLocations, setSavedLocations] = useState([]); // For saved locations (separate from bookmarks)
  const [favoritePosts, setFavoritePosts] = useState(new Set()); // Track which posts are bookmarked/favorited

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
  const [showWindows, setShowWindows] = useState({
    'category-window': false,
    'view-mode-window': false,
    'map-type-window': false,
    'saved-locations-window': false,
    'notifications-window': false
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
    // Close any open sidebar windows
    if (!isSidebarExpanded) { // If sidebar is being opened
      if (window.innerWidth < 640) {
        setIsSearchBarVisible(false);
      }
      // Close any open sidebar windows
      setShowWindows(prev => Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {}));
    }
  };
  const [routingActive, setRoutingActive] = useState(false); // Track if routing is active
  const [routingDestination, setRoutingDestination] = useState(null); // Store destination for routing
  const [routingLoading, setRoutingLoading] = useState(false); // Track if routing is being calculated

  const [locationLoading, setLocationLoading] = useState(false); // Track if updating user location is in progress
  const [bookmarkLoading, setBookmarkLoading] = useState(null); // Track which post is being bookmarked/unbookmarked
  const [followUser, setFollowUser] = useState(false); // Track if map should follow user's movement
  const [creatingPostAt, setCreatingPostAt] = useState(null); // Track the position where user wants to create a post
  const [postCreationForm, setPostCreationForm] = useState({
    title: "",
    description: "",
    category: "general",
    loading: false,
    error: null,
    images: [], // Store selected image files
    imageLinks: [] // Store image URLs added via input
  });
  const [searchQuery, setSearchQuery] = useState(''); // Track search query for filtering

  const handlePostCreationFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setPostCreationForm(prev => ({ ...prev, [name]: value }));
  }, []); // This preserves the function identity across re-renders

  // Handle responsive sidebar for mobile
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      // On mobile, ensure sidebar is collapsed
      if (window.innerWidth < 768) {
        setIsSidebarExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef();

  // Mobile Bottom Navigation States - moved to top to satisfy Rules of Hooks
  const [mobileBottomNavActive, setMobileBottomNavActive] = useState('');
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [activeSidebarWindow, setActiveSidebarWindow] = useState(null);

  const { showModal } = useModal();
  const { logout: authLogout } = useAuth(); // Get logout from auth context

  const handleLogout = () => {
    authLogout(); // Clear authentication state
    navigate("/"); // Redirect to home page after logout
  };


  // State for enhanced search results
  const [enhancedSearchResults, setEnhancedSearchResults] = useState([]);

  // State for responsive search bar functionality
  const searchContainerRef = useRef(null);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false); // Start with search bar hidden, will be shown by default on larger screens through CSS

  // Effect to handle responsive search bar visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // On small screens, hide the search bar if it was open
        setIsSearchBarVisible(false);
      } else {
        // On larger screens, show the search bar
        setIsSearchBarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  // State for geocoding search results




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

    // Handle post deletion events - remove deleted posts from all states
    socket.on('post-deleted', (deletedPostId) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== deletedPostId));
      setFilteredPosts(prevFiltered => prevFiltered.filter(post => post._id !== deletedPostId));

      // Also close the selected post if it's the one being deleted
      if (selectedPost && selectedPost._id === deletedPostId) {
        setSelectedPost(null);
      }
    });

    // Set up polling as backup if socket fails
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup function
    return () => {
      socket.off('newNotification');
      socket.off('notificationRead');
      socket.off('post-deleted');
      clearInterval(interval);
    };
  }, [isAuthenticated, user, API_BASE_URL, selectedPost]);

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
          likesCount: isLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
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
          likesCount: isLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
        };
      }
      return post;
    }));
  }, [selectedPost, user, showModal]);

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
  }, [selectedPost, showModal]);

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
  }, [isAuthenticated]);

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
  }, [isAuthenticated, user]);

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



  // Initial data fetch - non-blocking
    useEffect(() => {
    // Immediately show the map without waiting for data

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

  // Apply filters when category, or other filters change (search is handled by SearchBar component)
  useEffect(() => {
    // If we have enhanced search results, apply filters to them
    if (enhancedSearchResults.length > 0) {
      let result = [...enhancedSearchResults];

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
    } else {
      // Use the original filtering logic when no enhanced search results
      let result = [...posts];

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
    }
  }, [selectedCategory, rating, priceRange, sortBy, posts, enhancedSearchResults]);

  // Get user location for initial centering - non-blocking
  useEffect(() => {
    let watchId;

    // Set a quick default location immediately to avoid world view
    const defaultLocation = [20.5937, 78.9629]; // India coordinates as a default
    setMapCenter(defaultLocation);
    setMapZoom(3); // Start with a reasonable zoom level immediately (not too zoomed out)

    if (navigator.geolocation) {
      // Try to get initial position with high accuracy first
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
          console.log("Geolocation error on first attempt:", error.message);

          // If first attempt fails, try with fallback settings
          if (error.code === error.TIMEOUT) {
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
              (fallbackError) => {
                console.log("Geolocation fallback also failed:", fallbackError.message);
                // Fallback to default location with better zoom
                if (mapRef.current) {
                  mapRef.current.setView(defaultLocation, 3);
                }
              },
              {
                enableHighAccuracy: false, // Use less accuracy for faster response
                timeout: 10000, // 10 seconds timeout
                maximumAge: 300000, // Allow cached location up to 5 minutes old
              }
            );
          } else {
            // Fallback to default location with better zoom
            if (mapRef.current) {
              mapRef.current.setView(defaultLocation, 3);
            }
          }
        },
        {
          enableHighAccuracy: true, // Start with high accuracy for precise location
          timeout: 15000, // 15 seconds to allow for GPS acquisition
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
          timeout: 15000, // 15 seconds to allow for GPS acquisition
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
                timeout: 15000, // 15 seconds to allow for GPS acquisition
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
          console.log("Location permission denied or unavailable on first attempt:", error.message);

          // If the first attempt with high accuracy fails, try with fallback settings
          if (error.code === error.TIMEOUT) {
            try {
              console.log("Retrying location with fallback settings...");
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  {
                    enableHighAccuracy: false, // Use less accuracy for faster response
                    timeout: 10000, // 10 seconds timeout
                    maximumAge: 300000, // Allow cached location up to 5 minutes old
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
            } catch (fallbackError) {
              console.log("Fallback location request also failed:", fallbackError.message);
            }
          }
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



  // Get directions to a location - now shows directions in the map itself
  const getDirections = useCallback((target) => {
    if (!navigator.geolocation) {
      showModal({
        title: "Geolocation Not Supported",
        message: 'Geolocation is not supported by your browser',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    // Extract position from target (could be position array or post object)
    let position = target;
    if (target && !Array.isArray(target)) {
      if (target.position) {
        position = target.position;
      } else if (target.location && typeof target.location.latitude === 'number') {
        position = [target.location.latitude, target.location.longitude];
      }
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
        timeout: 15000, // Increased to 15 seconds for better GPS acquisition
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [userLocation, showModal]);

  // Update user's current location manually - with retry and fallback options
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
      // First attempt with high accuracy and longer timeout
      const position = await new Promise((resolve, reject) => {
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds to allow for GPS acquisition
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
      console.error("Geolocation error on first attempt:", error);

      // If first attempt with high accuracy fails due to timeout, try with less strict settings
      if (error.code === error.TIMEOUT) {
        try {
          console.log("Retrying with less strict geolocation settings...");
          const position = await new Promise((resolve, reject) => {
            const geoOptions = {
              enableHighAccuracy: false, // Use less accuracy to get faster response
              timeout: 10000, // 10 seconds timeout
              maximumAge: 300000, // Allow cached location up to 5 minutes old
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

          // Success after retry
          console.log(`Location updated to: [${latitude}, ${longitude}] with fallback settings`);
          return; // Exit successfully after retry
        } catch (retryError) {
          console.error("Geolocation error on retry:", retryError);
        }
      }

      // If both attempts fail, show appropriate error message
      let errorMessage = "Could not get your current location. ";

      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Location access was denied. Please allow location access in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable. Please make sure location services are enabled on your device.";
          break;
        case error.TIMEOUT:
          errorMessage += "The request to get your location timed out. This might happen if you're indoors, underground, or have a weak GPS signal. Try moving to an area with better satellite visibility, or ensure Wi-Fi and location services are enabled on your device.";
          break;
        default:
          errorMessage += "Please make sure location services are enabled and you have allowed location access. For local development, try opening this site over HTTPS.";
          break;
      }

      // Show the error message in a modal to the user
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
  }, [showModal]);

  // Clear the routing state
  const clearRouting = useCallback(() => {
    setRoutingActive(false);
    setRoutingDestination(null);
    setRoutingLoading(false); // Also reset loading state
  }, []);

  // Function to handle creating a post directly on the map
  const handleMapPostCreation = useCallback(async (e) => {
    e.preventDefault();

    // Validate form data
    if (!postCreationForm.title.trim() || !postCreationForm.description.trim()) {
      setPostCreationForm(prev => ({
        ...prev,
        loading: false, // Reset loading state
        error: "Title and description are required"
      }));
      return;
    }

    if (!creatingPostAt) {
      setPostCreationForm(prev => ({
        ...prev,
        loading: false, // Reset loading state
        error: "Location is required"
      }));
      return;
    }

    setPostCreationForm(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create form data for the post with location
      const formData = new FormData();
      formData.append('title', postCreationForm.title);
      formData.append('description', postCreationForm.description);
      formData.append('category', postCreationForm.category);
      formData.append('location[latitude]', creatingPostAt.lat.toString());
      formData.append('location[longitude]', creatingPostAt.lng.toString());

      // Add image files if any
      if (postCreationForm.images && postCreationForm.images.length > 0) {
        postCreationForm.images.forEach(image => {
          formData.append('images', image);
        });
      }

      // Add image links if any
      if (postCreationForm.imageLinks && postCreationForm.imageLinks.length > 0) {
        postCreationForm.imageLinks.forEach(link => {
          formData.append('imageLinks', link);
        });
      }

      // Call the API to create the post
      const result = await apiService.upload('/posts', formData, token);

      if (result.success && result.data && result.data.status === 'success' && result.data.data) {
        // Add the new post to our local state
        const newPost = {
          _id: result.data.data._id,
          id: result.data.data._id,
          title: result.data.data.title,
          description: result.data.data.description,
          image: result.data.data.image || null,
          images: result.data.data.images || [],
          averageRating: result.data.data.averageRating || 0,
          totalRatings: result.data.data.totalRatings || 0,
          postedBy: result.data.data.postedBy?.name || user?.name || user?.email || "Anonymous",
          category: result.data.data.category,
          datePosted: result.data.data.datePosted || new Date().toISOString(),
          position: Array.isArray(result.data.data.location.coordinates) && result.data.data.location.coordinates.length === 2
            ? [result.data.data.location.coordinates[1], result.data.data.location.coordinates[0]] // [lat, lng] from [lng, lat]
            : [result.data.data.location.latitude, result.data.data.location.longitude],
          price: result.data.data.price || 0,
          tags: result.data.data.tags || [],
          comments: result.data.data.comments || [],
          likes: result.data.data.likes || [],
          likesCount: result.data.data.likesCount || 0,
          location: {
            latitude: Array.isArray(result.data.data.location.coordinates) && result.data.data.location.coordinates.length === 2
              ? result.data.data.location.coordinates[1]  // latitude from [lng, lat] array
              : result.data.data.location.latitude,
            longitude: Array.isArray(result.data.data.location.coordinates) && result.data.data.location.coordinates.length === 2
              ? result.data.data.location.coordinates[0]  // longitude from [lng, lat] array
              : result.data.data.location.longitude,
            ...(result.data.data.location || {})
          },
        };

        setPosts(prev => [newPost, ...prev]);

        // Apply current filters to determine if the new post should be in the filtered list
        let shouldIncludeInFiltered = true;

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
        }

        // Show success message
        showModal({
          title: "Success",
          message: 'Post created successfully!',
          type: 'success',
          confirmText: 'OK'
        });

        // Close the creation form
        setCreatingPostAt(null);

        // Reset form to initial state
        setPostCreationForm({
          title: "",
          description: "",
          category: "general",
          loading: false,
          error: null,
          images: [],
          imageLinks: []
        });

        // Fly to the new post location to show it on the map
        setTimeout(() => {
          if (newPost.position) {
            flyToPost(newPost.position);
          }
        }, 300);
      } else {
        // Handle error response from API
        const errorMessage = result.data?.message || result.data?.error || result.error || 'Failed to create post';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setPostCreationForm(prev => ({
        ...prev,
        loading: false,
        error: error.message || error.toString() || 'An error occurred while creating the post'
      }));
    }
  }, [postCreationForm, creatingPostAt, selectedCategory, rating, priceRange, sortBy, user, showModal, flyToPost]);

  // Close all windows using ESC key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // Close all windows if any are open
        if (Object.values(showWindows).some(open => open)) {
          setShowWindows({
            'category-window': false,
            'view-mode-window': false,
            'map-type-window': false,
            'saved-locations-window': false,
            'notifications-window': false
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWindows]);



  // Function to toggle windows - closes previous window and opens new one
  const toggleWindow = (windowId) => {
    // Close all windows and open the requested window atomically
    setShowWindows({
      'category-window': windowId === 'category-window',
      'view-mode-window': windowId === 'view-mode-window',
      'map-type-window': windowId === 'map-type-window',
      'saved-locations-window': windowId === 'saved-locations-window',
      'notifications-window': windowId === 'notifications-window'
    });
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

  // Determine if we're on mobile
  const isMobile = screenWidth < 768;

  return (
    <div className="responsive-map-layout">
      {/* User profile button in top-left corner - only show when authenticated */}
      {isAuthenticated && !isMobile && (
        <div className="top-user-controls absolute top-4 left-4 z-[7010]" style={{ left: isSidebarExpanded ? '4rem' : '1rem' }}>
          <div className="login-control">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 shadow-md border border-gray-200">
              {/* User profile - logout and notifications moved to sidebar */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <Link
                  to={user?.role === "admin" ? "/admin/dashboard" : "/profile"}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <span className="text-xs hidden sm:block font-medium max-w-[60px) sm:max-w-[100px] truncate">
                    {user?.name ||
                      (user?.role === "admin" ? "Admin" : "Profile")}
                  </span>
                </Link>
                {/* Logout and notifications moved to sidebar */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered search bar on desktop, top-positioned on mobile - hidden when post creation form is open */}
      {!creatingPostAt && (
        <div className="search-bar-centered" style={{ top: '20px' }}>
          <div className="search-input-container" ref={searchContainerRef}>
            <SearchBar
              placeholder="Search for places, locations, categories..."
              autoFocus
              onSearchResults={(results, query) => {
                setFilteredPosts(results);
                // Update the enhanced search results state
                setEnhancedSearchResults(results);
                // Update search query state
                setSearchQuery(query || '');
              }}
              onLocationSelect={(post) => {
                // Only navigate to the location without opening the post window
                // Ensure the post has a valid position before flying to it
                if (post.position && Array.isArray(post.position) && post.position.length >= 2) {
                  flyToPost(post.position);
                } else if (post.location && typeof post.location.latitude !== 'undefined' && typeof post.location.longitude !== 'undefined') {
                  // Fallback to location object if position is not available
                  flyToPost([post.location.latitude, post.location.longitude]);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Map container */}
      <div className={`map-container-responsive ${
        isMobile ? (showBottomNav ? '' : 'bottom-nav-hidden') :
        (isSidebarExpanded ? 'map-container-sidebar-expanded' : 'map-container-sidebar-collapsed')
      }`}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={18}
          zoomControl={false} // Disable default zoom controls
          doubleClickZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          animate={true}
          easeLinearity={0.35}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="z-0 w-full"
          maxBounds={[
            [-90, -180], // Southwest coordinates (bottom-left)
            [90, 180]    // Northeast coordinates (top-right)
          ]}
          maxBoundsViscosity={0.75}
          worldCopyJump={true}
          attributionControl={true}
          whenCreated={(map) => {
            // Ensure the map handles resize events properly on mobile
            window.addEventListener('resize', () => {
              setTimeout(() => map.invalidateSize(), 100); // Small delay to ensure DOM is updated
            });
          }}
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
            onMapClick={() => {
              // Handle map click only when routing is not active
              if (!routingActive) {
                // Handle map click
              }
            }}
            onMapPositionSelected={(position) => {
              // Only allow authenticated users to create posts and only when routing is not active
              if (isAuthenticated && !routingActive) {
                setCreatingPostAt(position);
                setPostCreationForm({
                  ...postCreationForm,
                  loading: false,
                  error: null
                });
              } else if (isAuthenticated && routingActive) {
                // If routing is active, just clear the routing and don't create a post
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

          {/* Loading indicator - appears when routing is loading */}
          {routingLoading && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-24 z-[5992]"
              style={{
                right: isMobile ? '0.5rem' : (isSidebarExpanded ? 'calc(4rem + 0.5rem)' : '0.5rem')
              }}
            >
              <div className="px-3 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </div>
            </motion.div>
          )}


          {/* Render custom markers for each post */}
          <AnimatePresence>
            {filteredPosts.map((post) => {
              // Determine if the current user has liked this post based on the likes array
              const userHasLiked = post.likes?.some(like =>
                like.user &&
                (like.user._id === user?._id ||
                 (typeof like.user === 'string' && like.user === user?._id) ||
                 (typeof like.user === 'object' && like.user._id === user?._id))
              );

              // Check if this post is also in the saved locations to avoid duplicate markers
              const isSaved = favoritePosts.has(post.id);

              // Only render markers for posts with valid IDs to prevent duplicate key errors
              if (!post.id) {
                return null;
              }

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
          {isAuthenticated && showSavedLocationsOnMap && savedLocations.map((savedLocation) => {
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


          {/* Map-based Post Creation Overlay - Replaces Leaflet Popup to prevent flickering */}
          {creatingPostAt && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 sm:p-0">
              <div className="w-full h-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-transparent flex items-center justify-center pointer-events-auto">
                <PostCreationForm
                  creatingPostAt={creatingPostAt}
                  postCreationForm={postCreationForm}
                  handlePostCreationFormChange={handlePostCreationFormChange}
                  handleMapPostCreation={handleMapPostCreation}
                  setCreatingPostAt={setCreatingPostAt}
                />
              </div>
            </div>
          )}
        </MapContainer>

        {/* Close Directions Button - appears when routing is active - positioned outside MapContainer to prevent click conflicts */}
        {routingActive && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-24 z-[5993]"
            style={{
              right: isMobile ? '0.5rem' : (isSidebarExpanded ? 'calc(4rem + 0.5rem)' : '0.5rem')
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Prevent click from propagating to the map
                clearRouting();
              }}
              className="directions-close-button px-3 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 text-sm"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent mouse down from affecting map
                e.stopPropagation();
              }}
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </motion.div>
        )}

        {/* Top Banner - Shown when saved locations are displayed */}
        {isAuthenticated && showSavedLocationsOnMap && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-24 z-[5994]"
            style={{
              right: isMobile ? '0.5rem' : (isSidebarExpanded ? 'calc(4rem + 0.5rem)' : '0.5rem')
            }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-2 px-3 rounded-lg flex items-center justify-between text-sm">
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
      </div>

      {/* Sidebar - Desktop and Mobile */}
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
        isMobile={isMobile}
        mobileBottomNavActive={mobileBottomNavActive}
        setMobileBottomNavActive={setMobileBottomNavActive}
        showBottomNav={showBottomNav}
        setShowBottomNav={setShowBottomNav}
        activeSidebarWindow={activeSidebarWindow}
        setActiveSidebarWindow={setActiveSidebarWindow}
      />

      {/* Enhanced Sidebar Windows */}
      <EnhancedSidebarWindows
        showWindows={showWindows}
        setShowWindows={setShowWindows}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        mapType={mapType}
        setMapType={setMapType}
        favoritePosts={favoritePosts}
        posts={posts}
        togglePostBookmark={togglePostBookmark}
        bookmarkLoading={bookmarkLoading}
        showSavedLocationsOnMap={showSavedLocationsOnMap}
        setShowSavedLocationsOnMap={setShowSavedLocationsOnMap}
        user={user}
        updateUserLocation={updateUserLocation}
        followUser={followUser}
        isSidebarExpanded={isSidebarExpanded}
        authToken={isAuthenticated ? localStorage.getItem('token') : null}
      />

      {/* Listing Panel - Side Panel on Desktop, Bottom Panel on Mobile */}
      <AnimatePresence>
        {showListings && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-20 right-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl z-[5995] overflow-y-auto border border-gray-200"
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
                filteredPosts.filter(post => post.id).map((post, index) => (
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
                        {(post.image || (post.images && post.images.length > 0)) && (
                          <div className="relative">
                            <img
                              src={getImageUrl(
                                post.image
                                  ? (typeof post.image === 'object' ? post.image : { url: post.image })
                                  : (post.images && post.images.length > 0
                                      ? (typeof post.images[0] === 'object' ? post.images[0] : { url: post.images[0] })
                                      : null)
                              )}
                              alt={post.title}
                              crossOrigin="anonymous"
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
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No places match your search</h3>
                    <p className="mt-1 text-xs text-gray-500">Try adjusting your search or filter criteria.</p>

                    {/* Show popular posts as fallback */}
                    <div className="mt-6">
                      <h4 className="text-xs font-medium text-gray-700 mb-3">Popular locations you might like:</h4>
                      <div className="space-y-2">
                        {posts
                          .filter(post => post.id)
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
    </div>
  );
};

export default DiscoverMain;