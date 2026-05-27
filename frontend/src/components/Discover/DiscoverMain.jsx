import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Popup,
  useMapEvents,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import CustomMarker from "./CustomMarker";
import PostWindow from "../PostWindow/PostWindow";
import CurrentLocationMarker from "./CurrentLocationMarker";
import MapRouting from "./MapRouting";
import EnhancedSidebarWindows from "./EnhancedSidebarWindows";
import PostCreationForm from "./PostCreationForm";

import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Heart,
  Star,
  Grid3X3,
  ThumbsUp,
  X,
  SlidersHorizontal,
  Navigation,
  Bookmark,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Globe,
  Users,
  Bell,
  User,
  Check,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "./DiscoverMain.css";
import "./MapView.css"; // Import map styles to prevent black tile flash on drag
import "./ResponsiveLayout.css"; // Import the new responsive layout CSS
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";
import { postApi } from "../../services/api"; // Import the postApi to handle post creation
import apiService from "../../services/api"; // Import the default apiService for direct upload functionality
import { getImageUrl } from "../../utils/imageUtils"; // Import getImageUrl utility
import Sidebar from "../Sidebar/Sidebar";
import SearchBar from "../Search/SearchBar";
import AuthModal from "../Auth/AuthModal";
import { API_BASE_URL, API_TIMEOUT } from "../../utils/config";

// Custom hook for map events
const MapClickHandler = ({ onMapClick, onMapPositionSelected }) => {
  useMapEvents({
    click: (e) => {
      // Wrap coordinates to standard -180/180 range to prevent ghost placements
      const wrapped = e.latlng.wrap();

      if (onMapClick) onMapClick(wrapped);

      // If user is authenticated, allow them to create a post at the clicked location
      if (onMapPositionSelected) {
        onMapPositionSelected({
          lat: wrapped.lat,
          lng: wrapped.lng,
        });
      }

      // Hide all control windows when clicking on map
      const windows = [
        "category-window",
        "view-mode-window",
        "map-type-window",
        "saved-locations-window",
        "notifications-window",
      ];
      windows.forEach((windowId) => {
        const windowElement = document.getElementById(windowId);
        if (windowElement && !windowElement.classList.contains("hidden")) {
          windowElement.classList.add("hidden");
        }
      });
    },
  });
  return null;
};

const DiscoverMain = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false); // Controlled by initial fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track first-ever load
  const [retryStatus, setRetryStatus] = useState(null); // Track retry attempts for UI
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mapType, setMapType] = useState("street"); // street, satellite, terrain, dark, light, topographic, navigation, cycle, google
  const [savedLocations, setSavedLocations] = useState([]); // For saved locations (separate from bookmarks)
  const [favoritePosts, setFavoritePosts] = useState(new Set()); // Track which posts are bookmarked/favorited

  const [showSavedLocationsOnMap, setShowSavedLocationsOnMap] = useState(false); // Toggle to show saved locations
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'list'
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [rating, setRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showListings, setShowListings] = useState(false);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [userLocation, setUserLocation] = useState(null);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showWindows, setShowWindows] = useState({
    "category-window": false,
    "view-mode-window": false,
    "map-type-window": false,
    "saved-locations-window": false,
    "notifications-window": false,
  });
  const [activeSidebarWindow, setActiveSidebarWindow] = useState(null);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [enhancedSearchResults, setEnhancedSearchResults] = useState([]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded((prev) => !prev);
    // Close any open sidebar windows
    if (!isSidebarExpanded) {
      // If sidebar is being opened
      if (window.innerWidth < 640) {
        setIsSearchBarVisible(false);
      }
      // Close any open sidebar windows
      setShowWindows((prev) =>
        Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {}),
      );
      setActiveSidebarWindow(null);
    }
  }, [isSidebarExpanded]);

  const toggleWindow = useCallback((windowId) => {
    setShowWindows((prev) => {
      const newState = { ...prev };
      // Close all other windows
      Object.keys(newState).forEach((key) => {
        if (key !== windowId) newState[key] = false;
      });
      // Toggle the target window
      newState[windowId] = !prev[windowId];

      // Update the active window reference for the sidebar layout
      setActiveSidebarWindow(newState[windowId] ? windowId : null);

      return newState;
    });
  }, []);
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
    imageLinks: [], // Store image URLs added via input
  });
  const [searchQuery, setSearchQuery] = useState(""); // Track search query for filtering

  // Use useMemo for filteredPosts to eliminate unnecessary state update cycle
  const filteredPosts = useMemo(() => {
    let source =
      enhancedSearchResults.length > 0 ? enhancedSearchResults : posts;
    let result = [...source];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(
        (post) =>
          post.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(q) ||
          post.description?.toLowerCase().includes(q),
      );
    }

    // Filter by rating
    if (rating > 0) {
      result = result.filter((post) => (post.averageRating || 0) >= rating);
    }

    // Filter by price range
    if (priceRange !== "all") {
      if (priceRange === "free") {
        result = result.filter((post) => post.price === 0);
      } else if (priceRange === "low") {
        result = result.filter((post) => post.price > 0 && post.price <= 10);
      } else if (priceRange === "medium") {
        result = result.filter((post) => post.price > 10 && post.price <= 50);
      } else if (priceRange === "high") {
        result = result.filter((post) => post.price > 50);
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.datePosted) - new Date(a.datePosted);
        case "oldest":
          return new Date(a.datePosted) - new Date(b.datePosted);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "popular":
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [
    posts,
    enhancedSearchResults,
    selectedCategory,
    rating,
    priceRange,
    sortBy,
    searchQuery,
  ]);

  const handlePostCreationFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setPostCreationForm((prev) => ({ ...prev, [name]: value }));
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef();

  // State to track if the user has dismissed the error overlay
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Mobile Bottom Navigation States - moved to top to satisfy Rules of Hooks
  const [mobileBottomNavActive, setMobileBottomNavActive] = useState("");
  // Removed showBottomNav to ensure immersive map background
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { showModal } = useModal();

  const handleLogout = () => {
    showModal({
      title: "End Session",
      message:
        "Are you sure you want to log out of PinQuest? You will need to sign in again to create new posts or save locations.",
      type: "warning",
      showCancelButton: true,
      confirmText: "Log Out",
      cancelText: "Stay Logged In",
      onConfirm: () => {
        logout();
        navigate("/");
      },
    });
  };

  // State for responsive search bar functionality
  const searchContainerRef = useRef(null);
  // State for geocoding search results

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

    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize);
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
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
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

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true })),
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

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString();
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        const notificationButton = event.target.closest(
          'button[aria-label="Notifications"]',
        );

        if (isNotificationOpen && !notificationButton) {
          setIsNotificationOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);
  const selectedPostRef = useRef(selectedPost); // Create a ref to track selectedPost
  const { isAuthenticated, user, logout } = useAuth();

  // Auto-dismiss auth modal when authenticated (important for Google Login/Redirects)
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

  // Handle initial auth modal show if landing on /login or /signup
  useEffect(() => {
    if (
      window.location.pathname === "/login" ||
      window.location.pathname === "/signup"
    ) {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
      // Clean up URL without reload
      window.history.replaceState({}, "", "/");
    }
  }, [isAuthenticated]);

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
        // We import apiRequest dynamically here or at the top of the file
        const { apiRequest } = await import("../../services/api.jsx");

        // Fetch unread count
        const countResponse = await apiRequest("/notifications/unread-count", {
          method: "GET",
        });

        if (countResponse && countResponse.status === "success") {
          setUnreadCount(countResponse.data?.count || 0);
        } else {
          console.error("Failed to fetch unread count:", countResponse);
        }

        // Fetch recent notifications to display in dropdown
        const notifResponse = await apiRequest(
          "/notifications?page=1&limit=5",
          {
            method: "GET",
          },
        );

        if (notifResponse && notifResponse.status === "success") {
          setNotifications(notifResponse.data?.notifications || []);
        } else {
          console.error("Failed to fetch notifications:", notifResponse);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up socket listeners for real-time notifications
    socket.on("newNotification", (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]); // Add new notification, keep only 5 most recent
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("notificationRead", (data) => {
      // Update local state when a notification is marked as read from elsewhere
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === data.notificationId ? { ...notif, read: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    // Handle post deletion events - remove deleted posts from all states
    socket.on("post-deleted", (data) => {
      const deletedPostId = data?.postId || data;

      // Update posts state to remove the deleted post
      setPosts((prevPosts) =>
        prevPosts.filter((p) => (p._id || p.id) !== deletedPostId),
      );

      // Also close the selected post if it's the one being deleted
      if (
        selectedPostRef.current &&
        (selectedPostRef.current._id === deletedPostId ||
          selectedPostRef.current.id === deletedPostId)
      ) {
        setSelectedPost(null);
      }
    });

    // Handle post update events - update posts in real-time
    socket.on("post-updated", (data) => {
      const updatedPost = data?.post || data;
      if (!updatedPost || !updatedPost._id) return;

      setPosts((prevPosts) => {
        const existingIndex = prevPosts.findIndex(
          (p) => (p._id || p.id) === updatedPost._id,
        );

        // If post exists in local state
        if (existingIndex !== -1) {
          // If it's still published, update it
          if (!updatedPost.status || updatedPost.status === "published") {
            return prevPosts.map((p) =>
              (p._id || p.id) === updatedPost._id
                ? { ...p, ...updatedPost }
                : p,
            );
          }
          // If it's no longer published (e.g. rejected by admin), remove it from user view
          else {
            return prevPosts.filter((p) => (p._id || p.id) !== updatedPost._id);
          }
        }
        // If post doesn't exist but is now published, add it
        else if (updatedPost.status === "published") {
          // We need to transform it to the format expected by our app
          // This transformation logic is similar to what's in fetchPosts
          let position;
          if (
            updatedPost.location?.coordinates &&
            Array.isArray(updatedPost.location.coordinates)
          ) {
            position = [
              updatedPost.location.coordinates[1],
              updatedPost.location.coordinates[0],
            ];
          } else if (
            updatedPost.location?.latitude &&
            updatedPost.location?.longitude
          ) {
            position = [
              updatedPost.location.latitude,
              updatedPost.location.longitude,
            ];
          }

          const transformed = {
            ...updatedPost,
            id: updatedPost._id,
            position: position,
          };
          return [transformed, ...prevPosts];
        }
        return prevPosts;
      });

      // Update selected post if it's the one being modified
      if (
        selectedPostRef.current &&
        (selectedPostRef.current._id === updatedPost._id ||
          selectedPostRef.current.id === updatedPost._id)
      ) {
        if (updatedPost.status && updatedPost.status !== "published") {
          setSelectedPost(null);
        } else {
          setSelectedPost((prev) => ({ ...prev, ...updatedPost }));
        }
      }
    });

    // Set up polling as backup if socket fails
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup function
    return () => {
      socket.off("newNotification");
      socket.off("notificationRead");
      socket.off("post-deleted");
      clearInterval(interval);
    };
  }, [isAuthenticated, user, API_BASE_URL, selectedPost]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePostLike = useCallback(
    (postId, isLiked) => {
      // Update the posts state in DiscoverMain if needed
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          likes: isLiked
            ? [...(prev.likes || []), { user: user?._id }]
            : (prev.likes || []).filter((like) => {
                const userId =
                  typeof like.user === "object" ? like.user._id : like.user;
                return userId !== user?._id;
              }),
          likesCount: isLiked
            ? (prev.likesCount || 0) + 1
            : (prev.likesCount || 0) - 1,
        }));
      }

      // Also update the main posts array to reflect the change
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              likes: isLiked
                ? [...(post.likes || []), { user: user?._id }]
                : (post.likes || []).filter((like) => {
                    const userId =
                      typeof like.user === "object" ? like.user._id : like.user;
                    return userId !== user?._id;
                  }),
              likesCount: isLiked
                ? (post.likesCount || 0) + 1
                : (post.likesCount || 0) - 1,
            };
          }
          return post;
        }),
      );
    },
    [selectedPost, user, showModal],
  );

  const handlePostSave = useCallback(
    (postId, isSaved) => {
      // Update favorite posts when a post is bookmarked/unbookmarked
      setFavoritePosts((prev) => {
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
        setSelectedPost((prev) => ({
          ...prev,
          bookmarked: isSaved,
          saved: isSaved,
        }));
      }

      // Update the main posts array to reflect the bookmark change
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post && post._id === postId) {
            return {
              ...post,
              bookmarked: isSaved,
              saved: isSaved,
            };
          }
          return post;
        }),
      );
    },
    [selectedPost, showModal],
  );

  const handlePostRate = useCallback(
    (postId, newAverageRating, newTotalRatings) => {
      // Update the posts state in DiscoverMain when ratings change
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
        }));
      }

      // Also update the main posts array to reflect the rating change
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              averageRating: newAverageRating,
              totalRatings: newTotalRatings,
            };
          }
          return post;
        }),
      );
    },
    [selectedPost],
  );

  // Fetch posts from the backend API - with concurrency control
  const fetchPostsRef = useRef();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const fetchPosts = useCallback(
    async (preserveSelectedPost = null, limit = 50) => {
      // Prevent multiple concurrent requests for the same data
      if (fetchPostsRef.current) {
        setLoading(false); // Ensure loading is not stuck if request is blocked
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
        // Using centralized timeout (45-50s) to allow for backend cold starts
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(url, {
          // Use cache to improve performance
          cache: "default",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If we made it here, the connection succeeded
        setRetryStatus(null);

        if (!response.ok) {
          // Handle 429 specifically to avoid UI spam
          if (response.status === 429) {
            // Don't set error for rate limit to avoid spamming the UI
            return;
          }
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }

        // Parse response safely and detect HTML error pages
        const parseResponse = (await import("../../utils/parseResponse"))
          .default;
        const result = await parseResponse(response);

        if (result.status === "success" && Array.isArray(result.data)) {
          // Transform the API data to match the format expected by the frontend
          // Handle both location formats: coordinates array and latitude/longitude fields
          let transformedPosts = result.data
            .filter((post) => {
              // Check if post exists and has location data
              if (!post || !post.location) {
                return false;
              }

              // Check if the post has valid location data in either format
              // Check GeoJSON format: [longitude, latitude]
              if (
                post.location.coordinates &&
                Array.isArray(post.location.coordinates) &&
                post.location.coordinates.length === 2 &&
                typeof post.location.coordinates[0] === "number" &&
                typeof post.location.coordinates[1] === "number"
              ) {
                return true;
              }
              // Check separate latitude/longitude format
              if (
                typeof post.location.latitude === "number" &&
                typeof post.location.longitude === "number" &&
                !isNaN(post.location.latitude) &&
                !isNaN(post.location.longitude)
              ) {
                return true;
              }
              return false;
            })
            .map((post) => {
              let position;
              // Handle GeoJSON format [longitude, latitude]
              if (
                post &&
                post.location &&
                post.location.coordinates &&
                Array.isArray(post.location.coordinates) &&
                post.location.coordinates.length === 2
              ) {
                // Convert to [latitude, longitude] for Leaflet
                position = [
                  post.location.coordinates[1] || 0,
                  post.location.coordinates[0] || 0,
                ];
                  "📍 Fetch Posts - Transformed post",
                  post._id,
                  "- GeoJSON coords:",
                  post.location.coordinates,
                  "-> position:",
                  position,
                );
              }
              // Handle separate latitude/longitude format
              else if (
                post &&
                post.location &&
                typeof post.location.latitude === "number" &&
                typeof post.location.longitude === "number"
              ) {
                position = [post.location.latitude, post.location.longitude];
                  "📍 Fetch Posts - Transformed post",
                  post._id,
                  "- Lat/Lng coords:",
                  { lat: post.location.latitude, lng: post.location.longitude },
                  "-> position:",
                  position,
                );
              }

              return {
                _id: post && post._id ? post._id : null,
                id: post && post._id ? post._id : null, // Keep both for compatibility
                title: (post && post.title) || "Untitled",
                description:
                  (post && post.description) || "No description provided",
                image: post && post.image ? post.image : null,
                images: (post && post.images) || [],
                averageRating: (post && post.averageRating) || 0,
                totalRatings: (post && post.totalRatings) || 0,
                postedBy:
                  (post && (post.postedBy || post.postedBy?.name)) || "Unknown", // Preserve full postedBy object
                category: (post && post.category) || "general",
                datePosted:
                  (post && post.datePosted) || new Date().toISOString(),
                position: position, // [lat, lng] format for Leaflet
                price: (post && post.price) || 0,
                tags: (post && post.tags) || [],
                comments: (post && post.comments) || [],
                likes: (post && post.likes) || [], // Add likes array
                likesCount: (post && post.likesCount) || 0, // Add likes count
                location: {
                  // Ensure location has proper latitude and longitude for the directions feature
                  latitude:
                    (post && post.location?.latitude) ||
                    (post &&
                      post.location?.coordinates &&
                      post.location.coordinates[1]) ||
                    (position && position[0]), // fallback to position[0] if available
                  longitude:
                    (post && post.location?.longitude) ||
                    (post &&
                      post.location?.coordinates &&
                      post.location.coordinates[0]) ||
                    (position && position[1]), // fallback to position[1] if available
                  // Preserve other location properties if they exist
                  ...(post && post.location ? post.location : {}),
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
            const updatedSelectedPost = transformedPosts.find(
              (p) => p._id === preserveSelectedPost._id,
            );

            if (updatedSelectedPost) {
              // Update the selected post with only the fresh volatile data while preserving detailed data
              setSelectedPost((prev) => {
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
          const validTransformedPosts = transformedPosts.filter(
            (post) => post && post._id,
          );

          // Preserve any locally created posts that haven't been synced to the server yet
          // by checking if there are posts in the current state that don't exist in the fetched data
          setPosts((prev) => {
            // Create a map of fetched posts by ID for quick lookup
            const fetchedPostIds = new Set(
              validTransformedPosts.map((p) => p._id),
            );

            // Find locally created posts that aren't in the fetched data yet
            const localPosts = prev.filter(
              (post) => post && post._id && !fetchedPostIds.has(post._id),
            );

            // Combine fetched posts with local posts (local posts first since they're newer)
            return [...localPosts, ...validTransformedPosts];
          });

          // Success - reset retry count
          retryCountRef.current = 0;
        } else {
          console.error("Error: Invalid API response format", result);
          setError("Failed to load posts from server: Invalid response format");
          setPosts([]);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);

        // Auto-retry logic for "Load failed" or general network errors
        if (
          !preserveSelectedPost &&
          (err.message.includes("load failed") ||
            err.message.includes("Failed to fetch")) &&
          retryCountRef.current < MAX_RETRIES
        ) {
          retryCountRef.current++;
          setRetryStatus(
            `Attempt ${retryCountRef.current} of ${MAX_RETRIES}...`,
          );

          // Don't call setLoading(false) yet to avoid flickering
            `Network error detected. Retry ${retryCountRef.current}/${MAX_RETRIES} in 3 seconds...`,
          );

          setTimeout(() => {
            fetchPosts(null, limit);
          }, 3000);
          return; // Exit and wait for the retried call to finish
        }

        // Provide more user-friendly error message based on error type
        if (err.name === "AbortError") {
          setError(
            "Request timed out. The server might be taking longer than usual to wake up (Render cold-start). This is common on free-tier hosting. Please wait a moment.",
          );
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("load failed")
        ) {
          setError(
            `Unable to connect to the server at ${API_BASE_URL.split("/api")[0]}. The API may be cold-starting, misconfigured (check VITE_API_BASE_URL points to your backend), or unreachable.`,
          );
        } else if (err.message.includes("Too many requests")) {
        } else {
          setError("Failed to load posts: " + err.message);
        }
        setPosts([]);
        setErrorDismissed(false);
      } finally {
        // Reset the fetch flag
        fetchPostsRef.current = false;

        // ONLY set loading to false if we are NOT in the middle of a retry
        // This prevents the flickering "again and again" effect
        const isRetrying =
          retryCountRef.current > 0 && retryCountRef.current < MAX_RETRIES;

        if (!isRetrying) {
          setLoading(false);
          setIsInitialLoading(false);
          setRetryStatus(null);
        }
      }
    },
    [],
  ); // Empty dependency array since we're using ref to track state

  // Fetch saved locations if user is authenticated
  const fetchSavedLocationsRef = useRef();
  const fetchSavedLocations = useCallback(async () => {
    if (isAuthenticated) {
      // Prevent multiple concurrent requests
      if (fetchSavedLocationsRef.current) {
          "Saved locations fetch already in progress, skipping duplicate request",
        );
        return;
      }

      fetchSavedLocationsRef.current = true;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          setSavedLocations([]);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const parseResponse = (await import("../../utils/parseResponse"))
          .default;
        if (!response.ok) {
          if (response.status === 429) {
              "Rate limit exceeded for saved locations API. Skipping this request...",
            );
            return;
          }
          let errorData = {};
          try {
            errorData = await parseResponse(response);
          } catch (e) {
            errorData = {};
          }
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`,
          );
        }

        const result = await parseResponse(response);
        if (
          result.status === "success" &&
          Array.isArray(result.data?.savedLocations)
        ) {
          setSavedLocations(result.data.savedLocations);
        } else {
          console.warn(
            "Saved locations API returned unexpected format:",
            result,
          );
          setSavedLocations([]);
        }
      } catch (err) {
        console.error("Error fetching saved locations:", err);
        if (!err.message.includes("Too many requests")) {
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
          "Favorite posts fetch already in progress, skipping duplicate request",
        );
        return;
      }

      fetchUserFavoritePostsRef.current = true;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
              "Rate limit exceeded for favorites API. Skipping this request...",
            );
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const parseResponse = (await import("../../utils/parseResponse"))
          .default;
        const result = await parseResponse(response);
        if (
          result.status === "success" &&
          Array.isArray(result.data?.favorites)
        ) {
          // Extract post IDs from favorites to create a Set of favorite post IDs
          const favoritePostIds = new Set(
            result.data.favorites
              .map((fav) => {
                // Handle different possible structures of favorite objects
                if (fav.post && typeof fav.post === "object" && fav.post._id) {
                  return fav.post._id;
                } else if (fav.postId) {
                  return fav.postId;
                } else if (typeof fav.post === "string") {
                  return fav.post;
                }
                return null;
              })
              .filter((id) => id !== null), // Remove any null/undefined values
          );
          setFavoritePosts(favoritePostIds);

          // Update the posts array to mark them as bookmarked
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post && post._id) {
                return {
                  ...post,
                  bookmarked: favoritePostIds.has(post._id),
                  saved: favoritePostIds.has(post._id),
                };
              }
              return post;
            }),
          );

          // Also update selected post if it exists

          // Also update selected post if it exists
          if (selectedPost && selectedPost._id) {
            setSelectedPost((prev) => {
              // Check if prev is null to avoid the error
              if (!prev || !prev._id) return prev;
              return {
                ...prev,
                bookmarked: favoritePostIds.has(prev._id),
                saved: favoritePostIds.has(prev._id),
              };
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user favorite posts:", err);
        if (!err.message.includes("Too many requests")) {
          // Don't reduce favorites if it's a rate limit error
        }
      } finally {
        fetchUserFavoritePostsRef.current = false;
      }
    }
  }, [isAuthenticated, user]);

  // Update posts when favoritePosts changes to ensure correct bookmark status
  useEffect(() => {
    if (!favoritePosts) return;

    // Check if any post actually needs updating to prevent unnecessary setPosts
    const needsUpdate = (postsToUpdate) =>
      postsToUpdate.some(
        (post) =>
          post && post._id && post.bookmarked !== favoritePosts.has(post._id),
      );

    setPosts((prevPosts) => {
      if (!needsUpdate(prevPosts)) return prevPosts;
      return prevPosts.map((post) => {
        if (!post || !post._id) return post;
        const isFav = favoritePosts.has(post._id);
        if (post.bookmarked === isFav) return post;
        return { ...post, bookmarked: isFav, saved: isFav };
      });
    });

    if (
      selectedPost &&
      selectedPost._id &&
      selectedPost.bookmarked !== favoritePosts.has(selectedPost._id)
    ) {
      setSelectedPost((prev) => {
        if (!prev || !prev._id) return prev;
        const isFav = favoritePosts.has(prev._id);
        return { ...prev, bookmarked: isFav, saved: isFav };
      });
    }
  }, [favoritePosts]); // Dependency remains favoritePosts

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
  }, [
    fetchPosts,
    fetchSavedLocations,
    fetchUserFavoritePosts,
    isAuthenticated,
  ]); // Remove selectedPost to avoid interval recreation

  // Invalidate map size when the layout changes to ensure click coordinates remain accurate
  // Consolidated logic with a slightly longer delay to ensure sidebar transition is fully complete
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeSidebarWindow, isSidebarExpanded, screenWidth]);

  // Centered search bar - Dynamically shifts to avoid windows
  const flyToPost = useCallback((position) => {
    if (
      mapRef.current &&
      position &&
      Array.isArray(position) &&
      position.length >= 2
    ) {
      mapRef.current.flyTo(position, 15);
    }
  }, []);

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
                  "Geolocation fallback also failed:",
                  fallbackError.message,
                );
                // Fallback to default location with better zoom
                if (mapRef.current) {
                  mapRef.current.setView(defaultLocation, 3);
                }
              },
              {
                enableHighAccuracy: false, // Use less accuracy for faster response
                timeout: 10000, // 10 seconds timeout
                maximumAge: 300000, // Allow cached location up to 5 minutes old
              },
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
        },
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
        },
        {
          enableHighAccuracy: true, // Changed back to true for accurate location
          maximumAge: 0, // Do not use cached location - get fresh location
          timeout: 15000, // 15 seconds to allow for GPS acquisition
        },
      );
    } else {
      // Geolocation is not supported
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
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000, // 15 seconds to allow for GPS acquisition
              maximumAge: 0, // Don't use cached position - get fresh location
            });
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
            "Location permission denied or unavailable on first attempt:",
            error.message,
          );

          // If the first attempt with high accuracy fails, try with fallback settings
          if (error.code === error.TIMEOUT) {
            try {
              const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false, // Use less accuracy for faster response
                  timeout: 10000, // 10 seconds timeout
                  maximumAge: 300000, // Allow cached location up to 5 minutes old
                });
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
                "Fallback location request also failed:",
                fallbackError.message,
              );
            }
          }
        }
      };

      requestLocation();
    }
  }, [userLocation]);

  // Fly to a post's location on the map

  // Toggle post bookmark/favorite status
  const togglePostBookmark = useCallback(
    async (post) => {
      if (!isAuthenticated) {
        showModal({
          title: "Authentication Required",
          message: "Please login to bookmark posts",
          type: "info",
          confirmText: "OK",
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showModal({
          title: "Authentication Required",
          message: "Please login to bookmark posts",
          type: "info",
          confirmText: "OK",
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

      try {
        const isBookmarked = favoritePosts.has(post.id);
        let response;

        if (isBookmarked) {
          response = await fetch(`${API_BASE_URL}/users/favorites/${post.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          response = await fetch(`${API_BASE_URL}/users/favorites`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ postId: post.id }),
          });
        }

        if (response.ok) {
          setFavoritePosts((prev) => {
            const newFavorites = new Set(prev);
            if (isBookmarked) newFavorites.delete(post.id);
            else newFavorites.add(post.id);
            return newFavorites;
          });
        } else {
          showModal({
            title: "Error",
            message: `Failed to ${isBookmarked ? "un" : ""}bookmark post`,
            type: "error",
            confirmText: "OK",
          });
        }
      } catch (err) {
        console.error("Error toggling bookmark:", err);
      } finally {
        setBookmarkLoading(null);
      }
    },
    [isAuthenticated, favoritePosts, showModal],
  );

  // Save a location (separate functionality from bookmarking posts)
  const saveLocation = useCallback(
    async (locationData) => {
      if (!isAuthenticated) {
        showModal({
          title: "Authentication Required",
          message: "Please login to save locations",
          type: "info",
          confirmText: "OK",
        });
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const isAlreadySaved = savedLocations.some(
          (loc) => loc.id === locationData.id,
        );

        let response;
        if (isAlreadySaved) {
          response = await fetch(
            `${API_BASE_URL}/users/saved-locations/${locationData.id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        } else {
          response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(locationData),
          });
        }

        if (response.ok) {
          fetchSavedLocations();
        } else {
          showModal({
            title: "Error",
            message: "Action failed",
            type: "error",
            confirmText: "OK",
          });
        }
      } catch (err) {
        console.error("Error saving location:", err);
      }
    },
    [isAuthenticated, savedLocations, fetchSavedLocations, showModal],
  );

  // Get directions to a location - now shows directions in the map itself
  const getDirections = useCallback(
    (target) => {
      if (!navigator.geolocation) {
        showModal({
          title: "Geolocation Not Supported",
          message: "Geolocation is not supported by your browser",
          type: "info",
          confirmText: "OK",
        });
        return;
      }

      // Extract position from target (could be position array or post object)
      let position = target;
      if (target && !Array.isArray(target)) {
        if (target.position) {
          position = target.position;
        } else if (
          target.location &&
          typeof target.location.latitude === "number"
        ) {
          position = [target.location.latitude, target.location.longitude];
        }
      }

      // Validate the destination position before attempting to get user location
      if (!position || !Array.isArray(position) || position.length < 2) {
        showModal({
          title: "Invalid Position",
          message: "Invalid destination position provided",
          type: "error",
          confirmText: "OK",
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
          setRoutingDestination({
            origin: [userLat, userLng],
            destination: position,
          });
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
            setRoutingDestination({
              origin: userLocation,
              destination: position,
            });
            setRoutingActive(true);

            // Fly to the destination to show it on the map
            if (mapRef.current) {
              mapRef.current.flyTo(position, 13);
            }
          } else {
            // If we don't have a user location, try to use current map center
            if (mapRef.current) {
              const currentCenter = mapRef.current.getCenter();
              setRoutingDestination({
                origin: [currentCenter.lat, currentCenter.lng],
                destination: position,
              });
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
                message:
                  "Could not get your location. Showing destination on map instead.",
                type: "info",
                confirmText: "OK",
              });
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased to 15 seconds for better GPS acquisition
          maximumAge: 300000, // 5 minutes
        },
      );
    },
    [userLocation, showModal],
  );

  // Update user's current location manually - with retry and fallback options
  const updateUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      // Fallback for browsers that don't support geolocation
      showModal({
        title: "Geolocation Not Supported",
        message:
          "Geolocation is not supported by your browser. Please enable location services or try a different browser.",
        type: "info",
        confirmText: "OK",
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
    } catch (error) {
      console.error("Geolocation error on first attempt:", error);

      // If first attempt with high accuracy fails due to timeout, try with less strict settings
      if (error.code === error.TIMEOUT) {
        try {
          const position = await new Promise((resolve, reject) => {
            const geoOptions = {
              enableHighAccuracy: false, // Use less accuracy to get faster response
              timeout: 10000, // 10 seconds timeout
              maximumAge: 300000, // Allow cached location up to 5 minutes old
            };

            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              geoOptions,
            );
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
            `Location updated to: [${latitude}, ${longitude}] with fallback settings`,
          );
          return; // Exit successfully after retry
        } catch (retryError) {
          console.error("Geolocation error on retry:", retryError);
        }
      }

      // If both attempts fail, show appropriate error message
      let errorMessage = "Could not get your current location. ";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage +=
            "Location access was denied. Please allow location access in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage +=
            "Location information is unavailable. Please make sure location services are enabled on your device.";
          break;
        case error.TIMEOUT:
          errorMessage +=
            "The request to get your location timed out. This might happen if you're indoors, underground, or have a weak GPS signal. Try moving to an area with better satellite visibility, or ensure Wi-Fi and location services are enabled on your device.";
          break;
        default:
          errorMessage +=
            "Please make sure location services are enabled and you have allowed location access. For local development, try opening this site over HTTPS.";
          break;
      }

      // Show the error message in a modal to the user
      showModal({
        title: "Location Error",
        message: errorMessage,
        type: "error",
        confirmText: "OK",
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
  const handleMapPostCreation = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate form data
      if (
        !postCreationForm.title.trim() ||
        !postCreationForm.description.trim()
      ) {
        setPostCreationForm((prev) => ({
          ...prev,
          loading: false, // Reset loading state
          error: "Title and description are required",
        }));
        return;
      }

      if (!creatingPostAt) {
        setPostCreationForm((prev) => ({
          ...prev,
          loading: false, // Reset loading state
          error: "Location is required",
        }));
        return;
      }

      setPostCreationForm((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

          latitude: creatingPostAt.lat.toString(),
          longitude: creatingPostAt.lng.toString(),
        });

        // Create form data for the post with location
        const formData = new FormData();
        formData.append("title", postCreationForm.title);
        formData.append("description", postCreationForm.description);
        formData.append("category", postCreationForm.category);
        formData.append("location[latitude]", creatingPostAt.lat.toString());
        formData.append("location[longitude]", creatingPostAt.lng.toString());

        // Add image files if any
        if (postCreationForm.images && postCreationForm.images.length > 0) {
          postCreationForm.images.forEach((image) => {
            formData.append("images", image);
          });
        }

        // Add image links if any
        if (
          postCreationForm.imageLinks &&
          postCreationForm.imageLinks.length > 0
        ) {
          postCreationForm.imageLinks.forEach((link) => {
            formData.append("imageLinks", link);
          });
        }

        // Call the API to create the post
        const result = await apiService.upload("/posts", formData, token);

        if (
          result.success &&
          result.data &&
          result.data.status === "success" &&
          result.data.data
        ) {
          // Add the new post to our local state
          // Use the exact coordinates the user clicked on (creatingPostAt) to guarantee
          // the pin appears exactly where clicked, avoiding any API coordinate parsing ambiguity.
          const clickedLat = creatingPostAt.lat;
          const clickedLng = creatingPostAt.lng;

            lat: clickedLat,
            lng: clickedLng,
          });

          const newPost = {
            _id: result.data.data._id,
            id: result.data.data._id,
            title: result.data.data.title,
            description: result.data.data.description,
            image: result.data.data.image || null,
            images: result.data.data.images || [],
            averageRating: result.data.data.averageRating || 0,
            totalRatings: result.data.data.totalRatings || 0,
            postedBy:
              result.data.data.postedBy?.name ||
              user?.name ||
              user?.email ||
              "Anonymous",
            category: result.data.data.category,
            datePosted: result.data.data.datePosted || new Date().toISOString(),
            // Use the original clicked coordinates – this is exactly where the user placed the pin
            position: [clickedLat, clickedLng],
            price: result.data.data.price || 0,
            tags: result.data.data.tags || [],
            comments: result.data.data.comments || [],
            likes: result.data.data.likes || [],
            likesCount: result.data.data.likesCount || 0,
            location: {
              latitude: clickedLat,
              longitude: clickedLng,
              type: "Point",
              coordinates: [clickedLng, clickedLat], // GeoJSON [lng, lat]
            },
          };

            "📍 Post creation - New post position:",
            newPost.position,
          );
            "📍 Post creation - New post location:",
            newPost.location,
          );
            "📍 Post creation - Server returned location:",
            result.data.data.location,
          );

          setPosts((prev) => [newPost, ...prev]);

          // Show success message
          showModal({
            title: "Success",
            message: "Post created successfully!",
            type: "success",
            confirmText: "OK",
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
            imageLinks: [],
          });

          // Fly to the new post location to show it on the map
          setTimeout(() => {
            if (newPost.position) {
              flyToPost(newPost.position);
            }
          }, 300);
        } else {
          // Handle error response from API
          const errorMessage =
            result.data?.message ||
            result.data?.error ||
            result.error ||
            "Failed to create post";
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Error creating post:", error);
        setPostCreationForm((prev) => ({
          ...prev,
          loading: false,
          error:
            error.message ||
            error.toString() ||
            "An error occurred while creating the post",
        }));
      }
    },
    [
      postCreationForm,
      creatingPostAt,
      selectedCategory,
      rating,
      priceRange,
      sortBy,
      user,
      showModal,
      flyToPost,
    ],
  );

  // Close all windows using ESC key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Close all windows if any are open
        if (Object.values(showWindows).some((open) => open)) {
          setShowWindows({
            "category-window": false,
            "view-mode-window": false,
            "map-type-window": false,
            "saved-locations-window": false,
            "notifications-window": false,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showWindows]);

  // Get the appropriate tile layer URL based on map type
  const getTileLayerUrl = () => {
    switch (mapType) {
      case "street":
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "terrain":
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      case "dark":
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      case "light":
        return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      case "topographic":
        return "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      case "navigation":
        return "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
      case "cycle":
        return "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  const categories = [
    { id: "all", name: "All", icon: MapPin },
    { id: "nature", name: "Nature", icon: MapPin },
    { id: "culture", name: "Culture", icon: MapPin },
    { id: "shopping", name: "Shopping", icon: MapPin },
    { id: "food", name: "Food", icon: MapPin },
    { id: "event", name: "Events", icon: MapPin },
    { id: "general", name: "General", icon: MapPin },
  ];

  if (error && !errorDismissed) {
    const isNetworkError =
      error?.includes("load failed") ||
      error?.includes("Failed to fetch") ||
      error?.includes("Unable to connect");

    return (
      <div className="fixed inset-0 z-[60000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl transition-all duration-500">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", duration: 0.7, bounce: 0.4 }}
          className="relative w-full max-w-lg overflow-hidden bg-white/90 dark:bg-slate-900/80 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          {/* Ambient Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative p-8 sm:p-12 flex flex-col items-center text-center">
            {/* Icon Container */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="w-24 h-24 mb-6 rounded-[1.5rem] bg-gradient-to-tr from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-100 dark:border-red-500/20 flex items-center justify-center shadow-inner relative group"
            >
              <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <X
                className="w-12 h-12 text-red-500 dark:text-red-400 relative z-10"
                strokeWidth={2.5}
              />
            </motion.div>

            {/* Header Text */}
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
              Connection{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Lost
              </span>
            </h2>

            {/* Body Text */}
            <p className="text-slate-600 dark:text-slate-300 text-[15px] sm:text-base leading-relaxed mb-10 max-w-[280px] sm:max-w-sm mx-auto font-medium">
              {isNetworkError
                ? "The API is starting up or unreachable. If this persists, confirm VITE_API_BASE_URL in Vercel points to your backend URL (not the frontend)."
                : error}
            </p>

            {/* Actions */}
            <div className="w-full flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setError(null);
                  fetchPosts();
                }}
                className="group relative flex-1 inline-flex items-center justify-center px-6 py-4 text-[15px] font-bold text-white transition-all bg-gray-900 dark:bg-white dark:text-slate-900 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/20 dark:shadow-white/20 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Try to Reconnect
                </span>
              </button>

              <button
                onClick={() => setErrorDismissed(true)}
                className="group flex-1 inline-flex items-center justify-center px-6 py-4 text-[15px] font-bold text-slate-700 dark:text-slate-200 transition-all bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-slate-300/50 dark:hover:border-slate-600/50"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  Offline Mode
                </span>
              </button>
            </div>

            {/* Footer Details */}
            <div className="mt-8 pt-6 w-full border-t border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate w-full text-center hover:whitespace-normal hover:text-clip transition-all duration-300">
                ERR: {error}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine if we're on mobile
  const isMobile = screenWidth < 768;

  return (
    <div className="responsive-map-layout">
      {/* Small Error Banner when dismissed */}
      {error && errorDismissed && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[5999] w-auto max-w-[90%] pointer-events-auto">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur-sm border border-red-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-700">
              Offline mode: Server unavailable
            </span>
            <button
              onClick={() => {
                setErrorDismissed(false);
                setError(null);
                fetchPosts();
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        </div>
      )}

      {/* User profile button removed in favor of modern Nexus Sidebar profile */}

      {/* Centered search bar - Dynamically shifts to avoid windows */}
      {!creatingPostAt && !activeSidebarWindow && (
        <motion.div
          layout
          className="search-bar-centered"
          style={{
            top: isMobile ? "12px" : "25px",
            zIndex: 8060,
            left:
              !isMobile && activeSidebarWindow ? "calc(50% + 140px)" : "50%",
            maxWidth: isMobile ? "calc(100% - 24px)" : "600px",
          }}
        >
          <div className="search-input-container" ref={searchContainerRef}>
            <SearchBar
              placeholder="Search destinations, categories..."
              autoFocus
              onSearchResults={(results, query) => {
                setEnhancedSearchResults(results);
                setSearchQuery(query || "");
              }}
              onLocationSelect={(post) => {
                if (
                  post.position &&
                  Array.isArray(post.position) &&
                  post.position.length >= 2
                ) {
                  flyToPost(post.position);
                } else if (
                  post.location &&
                  typeof post.location.latitude !== "undefined" &&
                  typeof post.location.longitude !== "undefined"
                ) {
                  flyToPost([post.location.latitude, post.location.longitude]);
                }
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Map container */}
      <div className="map-container-responsive inset-0 absolute">
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
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          className="z-0 w-full"
          maxBounds={[
            [-90, -180], // Southwest coordinates (bottom-left)
            [90, 180], // Northeast coordinates (top-right)
          ]}
          maxBoundsViscosity={0.75}
          worldCopyJump={true}
          attributionControl={true}
        >
          <TileLayer
            attribution={
              mapType === "satellite"
                ? "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                : mapType === "terrain"
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles courtesy of <a href="https://opentopomap.org/">OpenTopoMap</a>'
                  : mapType === "dark" || mapType === "light"
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    : mapType === "topographic"
                      ? '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
                      : mapType === "navigation"
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://hot.opentreetmap.org/">Humanitarian OpenStreetMap Team</a>'
                        : mapType === "cycle"
                          ? 'CyclOSM &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={getTileLayerUrl()}
            maxZoom={18}
            minZoom={2}
            tileSize={256}
            zoomOffset={0}
            detectRetina={true}
            updateWhenIdle={false}
            updateWhenZooming={false}
            unloadInvisibleTiles={false}
            reuseTiles={true}
            keepBuffer={8}
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
                  error: null,
                });
              } else if (isAuthenticated && routingActive) {
                // If routing is active, just clear the routing and don't create a post
                clearRouting();
              } else if (!isAuthenticated) {
                showModal({
                  title: "Authentication Required",
                  message: "Please login to create posts",
                  type: "info",
                  confirmText: "OK",
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
                right: isMobile
                  ? "0.5rem"
                  : isSidebarExpanded
                    ? "calc(4rem + 0.5rem)"
                    : "0.5rem",
              }}
            >
              <div className="px-3 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </div>
            </motion.div>
          )}

          {/* Render custom markers for each post */}
          {filteredPosts.map((post) => {
            // Determine if the current user has liked this post based on the likes array
            const userHasLiked = post.likes?.some(
              (like) =>
                like.user &&
                (like.user._id === user?._id ||
                  (typeof like.user === "string" && like.user === user?._id) ||
                  (typeof like.user === "object" &&
                    like.user._id === user?._id)),
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
                }}
              />
            );
          })}

          {/* Premium Loading Overlay for Map Data */}
          <AnimatePresence>
            {(loading || isInitialLoading) && filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl z-[49999] flex items-center justify-center p-6"
              >
                <div className="relative max-w-sm w-full">
                  {/* Modern Pulsing Background Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />

                  <div className="relative text-center">
                    <div className="relative inline-block mb-8">
                      {/* Unique custom SVG map pin animation */}
                      <motion.div
                        animate={{
                          y: [0, -15, 0],
                          scaleX: [1, 1.1, 1],
                          scaleY: [1, 0.9, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                        className="relative z-10"
                      >
                        <MapPin
                          className="h-20 w-20 text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.6)]"
                          strokeWidth={1}
                        />
                      </motion.div>

                      {/* Realistic floor shadow */}
                      <motion.div
                        animate={{
                          scale: [1, 0.6, 1],
                          opacity: [0.3, 0.1, 0.3],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                        className="mx-auto mt-2 h-2 w-10 bg-slate-950/50 rounded-[100%] blur-[3px]"
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <motion.h2
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-3xl font-black italic uppercase tracking-tighter text-white font-jakarta"
                        >
                          Loading <span className="text-blue-400">Map</span>
                        </motion.h2>

                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80 font-jakarta ml-1">
                          Retrieving Locations
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                          <div className="relative w-2 h-2">
                            <motion.div
                              animate={{
                                scale: [1, 1.8, 1],
                                opacity: [1, 0, 1],
                              }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="absolute inset-0 bg-blue-400 rounded-full"
                            />
                            <div className="absolute inset-0 bg-blue-400 rounded-full" />
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                            {retryStatus || "Initializing Secure Link..."}
                          </span>
                        </div>

                        {retryStatus && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] text-slate-500 uppercase tracking-widest italic"
                          >
                            Backend node waking up from sleep...
                          </motion.p>
                        )}
                      </div>

                      <div className="pt-2 max-w-[200px] mx-auto">
                        <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                            className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render markers for saved locations when toggle is enabled */}
          {isAuthenticated &&
            showSavedLocationsOnMap &&
            savedLocations.map((savedLocation) => {
              // Check if this saved location is also in the filtered posts to avoid duplicate markers
              const isAlreadyDisplayed = filteredPosts.some(
                (post) => post.id === savedLocation.id,
              );

              // Skip if it's already shown as a regular post marker
              if (isAlreadyDisplayed) {
                return null;
              }

              // Check if this saved location is also a post to determine if it's liked
              const associatedPost = posts.find(
                (post) => post.id === savedLocation.id,
              );
              const userHasLiked = associatedPost?.likes?.some(
                (like) =>
                  like.user &&
                  (like.user._id === user?._id ||
                    (typeof like.user === "string" &&
                      like.user === user?._id) ||
                    (typeof like.user === "object" &&
                      like.user._id === user?._id)),
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
                  datePosted:
                    savedLocation.datePosted || new Date().toISOString(),
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
                        "Saved location marker clicked:",
                        savedLocation.name,
                      );
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

          {/* Preview point to help the user see exactly where the click was registered */}
          {creatingPostAt && (
            <CircleMarker
              center={[creatingPostAt.lat, creatingPostAt.lng]}
              radius={4}
              pathOptions={{
                fillColor: "#ef4444",
                fillOpacity: 1,
                stroke: true,
                color: "white",
                weight: 2,
              }}
            />
          )}

          {/* Preview pin for the post being created - shows exactly where the pin will land */}
          {creatingPostAt && (
            <CustomMarker
              key="preview-marker"
              post={{
                position: [creatingPostAt.lat, creatingPostAt.lng],
                category: postCreationForm.category || "general",
                averageRating: 0,
                id: "preview",
                location: {
                  latitude: creatingPostAt.lat,
                  longitude: creatingPostAt.lng,
                  type: "Point",
                  coordinates: [creatingPostAt.lng, creatingPostAt.lat],
                },
              }}
              isLiked={false}
              isSaved={false}
              onClick={() => {}} // No action on click for preview
            />
          )}
        </MapContainer>

        {/* Map-based Post Creation Overlay - Positioned outside MapContainer to prevent event leakage */}
        <AnimatePresence>
          {creatingPostAt && (
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 sm:p-0"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full h-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-transparent flex items-center justify-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <PostCreationForm
                  creatingPostAt={creatingPostAt}
                  postCreationForm={postCreationForm}
                  handlePostCreationFormChange={handlePostCreationFormChange}
                  handleMapPostCreation={handleMapPostCreation}
                  setCreatingPostAt={setCreatingPostAt}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Close Directions Button - appears when routing is active - positioned outside MapContainer to prevent click conflicts */}
        {routingActive && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-24 z-[5993]"
            style={{
              right: isMobile
                ? "0.5rem"
                : isSidebarExpanded
                  ? "calc(4rem + 0.5rem)"
                  : "0.5rem",
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
              right: isMobile
                ? "0.5rem"
                : isSidebarExpanded
                  ? "calc(4rem + 0.5rem)"
                  : "0.5rem",
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
        user={user}
        onLogout={handleLogout}
        toggleWindow={toggleWindow}
        updateUserLocation={updateUserLocation}
        followUser={followUser}
        setFollowUser={setFollowUser}
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
        isMobile={screenWidth < 768}
        activeSidebarWindow={activeSidebarWindow}
        setActiveSidebarWindow={setActiveSidebarWindow}
        openAuthModal={() => setShowAuthModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Enhanced Sidebar Windows */}
      <EnhancedSidebarWindows
        showWindows={showWindows}
        setShowWindows={setShowWindows}
        activeSidebarWindow={activeSidebarWindow}
        setActiveSidebarWindow={setActiveSidebarWindow}
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
        authToken={isAuthenticated ? localStorage.getItem("token") : null}
      />

      {/* Listing Panel - Side Panel on Desktop, Bottom Panel on Mobile */}
      <AnimatePresence>
        {showListings && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-20 right-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl z-[5995] overflow-y-auto border border-gray-200"
          >
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Results ({filteredPosts.length})
              </h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Rating
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
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
                filteredPosts
                  .filter((post) => post.id)
                  .map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                      }}
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
                          {(post.image ||
                            (post.images && post.images.length > 0)) && (
                            <div className="relative">
                              <img
                                src={getImageUrl(
                                  post.image
                                    ? typeof post.image === "object"
                                      ? post.image
                                      : { url: post.image }
                                    : post.images && post.images.length > 0
                                      ? typeof post.images[0] === "object"
                                        ? post.images[0]
                                        : { url: post.images[0] }
                                      : null,
                                )}
                                alt={post.title}
                                crossOrigin="anonymous"
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-sm">
                              {post.title}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {post.description}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(post.averageRating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-xs text-gray-600">
                                  {post.averageRating.toFixed(1)} (
                                  {post.totalRatings})
                                </span>
                              </div>
                              <span className="text-xs bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                                {post.category}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">
                                by{" "}
                                {typeof post.postedBy === "string"
                                  ? post.postedBy
                                  : post.postedBy?.name ||
                                    post.postedBy?.email ||
                                    "Unknown"}
                              </span>
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
                                    <Heart
                                      className={`w-4 h-4 ${favoritePosts.has(post.id) ? "fill-current" : ""}`}
                                    />
                                  )}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
              ) : // Show search suggestions when search query exists but no results found
              searchQuery ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No places match your search
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>

                  {/* Show popular posts as fallback */}
                  <div className="mt-6">
                    <h4 className="text-xs font-medium text-gray-700 mb-3">
                      Popular locations you might like:
                    </h4>
                    <div className="space-y-2">
                      {posts
                        .filter((post) => post.id)
                        .sort(
                          (a, b) =>
                            (b.totalRatings || 0) - (a.totalRatings || 0),
                        )
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
                            <div className="text-xs font-medium text-gray-800 truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-gray-600">
                              {post.totalRatings || 0} ratings
                            </div>
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No places found
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>
                </motion.div>
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
            authToken={isAuthenticated ? localStorage.getItem("token") : null}
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
              // Handle comment click if needed
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default DiscoverMain;
