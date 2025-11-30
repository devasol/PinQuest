import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import Header from "../Landing/Header/Header";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { auth } from "../../config/firebase";
import { getMarkerByCategory } from "./CustomMapMarkers";
import CustomMarker from "./CustomMarker";

import NotificationModal from "../NotificationModal";
import OptimizedImage from "../OptimizedImage";
import RatingsAndComments from "../RatingsAndComments.jsx";
import "./MapView.css";

// Fix for Leaflet default icon issue in React/Vite environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xPng,
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// API base URL - adjust based on your backend URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Extract the base server URL from the API base URL for image paths
const getServerBaseUrl = () => {
  // Remove the /api/v1 part to get the base server URL
  return API_BASE_URL.replace("/api/v1", "");
};

// Helper function to get the correct image URL
const getImageUrl = (imageObj) => {
  if (!imageObj) return "";
  const serverBaseUrl = getServerBaseUrl();
  if (typeof imageObj === "string") {
    return imageObj.startsWith("http")
      ? imageObj
      : `${serverBaseUrl}${imageObj}`;
  }
  if (imageObj.url) {
    return imageObj.url.startsWith("http")
      ? imageObj.url
      : `${serverBaseUrl}${imageObj.url}`;
  }
  return "";
};

// Component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

// Component to get map instance reference
function MapRefHandler({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    if (map && mapRef.current !== map) {
      mapRef.current = map;
    }
    
    return () => {
      // Only clear the ref if it's still pointing to the same map
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null;
}

// Component to handle geocoding (search) events
function Geocoder({
  searchQuery,
  setSearchQuery,
  mapRef,
  setSuggestions,
  suggestions,
  setIsSearching,
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (searchQuery.trim().length > 2) {
      timeoutId = setTimeout(async () => {
        setIsSearching(true); // Indicate that we're searching globally
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              searchQuery
            )}&limit=5`
          );
          const results = await response.json();
          setSuggestions(
            results.map((result) => ({
              display_name: result.display_name,
              lat: parseFloat(result.lat),
              lon: parseFloat(result.lon),
            }))
          );
          setIsOpen(true);
        } catch (error) {
          console.error("Geocoding error:", error);
          setSuggestions([]);
        } finally {
          setIsSearching(false); // Stop searching indicator
        }
      }, 300); // Debounce the search
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false); // Clear searching state
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery, setIsSearching, setSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    if (mapRef.current) {
      mapRef.current.flyTo([suggestion.lat, suggestion.lon], 15);
    }
    setSearchQuery(suggestion.display_name);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search for any place in the world..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery && suggestions.length > 0 && setIsOpen(true)}
        className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium text-gray-800">
                {suggestion.display_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


const MapView = () => {
  const { isAuthenticated, user } = useAuth();
  const [activePopup, setActivePopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null, // Changed from string to null to handle both URL strings and File objects
    postedBy: "",
    category: "general",
  });
  // Support multiple images when creating a post from the map modal
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isRemovingLocation, setIsRemovingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Initialize as null to indicate no location yet
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterMine, setFilterMine] = useState(false); // New state for filtering user's posts
  const [postsFilter, setPostsFilter] = useState("latest"); // Filter for posts: latest, top, ratings, likes
  const mapRef = useRef();
  
  // Image gallery state
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  
  // Ref to store marker instances for programmatic popup opening
  const markerRefs = useRef({});
  
  // State for sidebar and its sections
  const [activeSidebarTab, setActiveSidebarTab] = useState(""); // '', explore, stats, map-settings, saved, recents
  // State for saved/bookmarked locations
  const [savedLocations, setSavedLocations] = useState([]);
  // State for recently viewed locations
  const [recentLocations, setRecentLocations] = useState([]);
  
  // Pagination state for posts
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // Display 10 posts per page
  
  // Pagination state for recent locations
  const [currentRecentPage, setCurrentRecentPage] = useState(1);
  const recentsPerPage = 10; // Display 10 recent locations per page
  
  // Pagination state for saved locations
  const [currentSavedPage, setCurrentSavedPage] = useState(1);
  const savedPerPage = 10; // Display 10 saved locations per page

  // Function to save a location
  const saveLocation = async (location) => {
    // Check if location is already saved
    const isAlreadySaved = savedLocations.some(
      (saved) => saved.id === location.id
    );

    if (!isAuthenticated) {
      showNotification("Please login to save locations", "error");
      return;
    }

    if (!isAlreadySaved) {
      setIsSavingLocation(true);
      
      // First, save to local state
      const newSavedLocation = {
        ...location,
        postedBy:
          typeof location.postedBy === "string"
            ? location.postedBy
            : location.postedBy?.name || location.postedBy || "",
        savedAt: new Date().toISOString(),
      };

      const updatedSavedLocations = [newSavedLocation, ...savedLocations]; // Add to the top
      setSavedLocations(updatedSavedLocations);

      // Update localStorage as fallback
      localStorage.setItem(
        "savedLocations",
        JSON.stringify(updatedSavedLocations)
      );

      try {
        // Get fresh token to ensure it's not expired
        const currentUser = auth.currentUser;
        let token = localStorage.getItem("token");

        if (currentUser && token) {
          // Get a fresh token to ensure it's not expired
          const freshToken = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem("token", freshToken);
          token = freshToken;
        }

        // Prepare a backend-compatible payload (backend expects `id` and `name`)
        const payload = {
          id: location.id,
          name:
            location.title ||
            location.name ||
            location.display_name ||
            "Untitled location",
          description: location.description || "",
          position:
            location.position || (location.lat && location.lng)
              ? [location.lat, location.lng]
              : location.position || null,
          category: location.category || "general",
          datePosted: location.datePosted || new Date().toISOString(),
          postedBy:
            typeof location.postedBy === "string"
              ? location.postedBy
              : location.postedBy?.name || location.postedBy || "",
          type: location.type || "location",
        };

        // Save to backend
        const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          // Use authoritative savedLocations from backend if provided
          if (data && data.data && Array.isArray(data.data.savedLocations)) {
            setSavedLocations(data.data.savedLocations);
            localStorage.setItem(
              "savedLocations",
              JSON.stringify(data.data.savedLocations)
            );
          }
          showNotification("Location saved!", "success");
        } else {
          // If backend fails, revert the UI change
          const revertedSavedLocations = savedLocations;
          setSavedLocations(revertedSavedLocations);
          localStorage.setItem(
            "savedLocations",
            JSON.stringify(revertedSavedLocations)
          );
          showNotification(
            "Failed to save location. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error saving location to backend:", error);
        // If backend fails, revert the UI change
        const revertedSavedLocations = savedLocations;
        setSavedLocations(revertedSavedLocations);
        localStorage.setItem(
          "savedLocations",
          JSON.stringify(revertedSavedLocations)
        );
        showNotification("Failed to save location. Please try again.", "error");
      } finally {
        setIsSavingLocation(false);
      }
    } else {
      showNotification("Location already saved!", "info");
    }
  };

  // Function to remove a saved location
  const removeSavedLocation = async (locationId) => {
    if (!isAuthenticated) {
      showNotification("Please login to manage saved locations", "error");
      return;
    }

    setIsRemovingLocation(true);
    
    // First, update local state
    const updatedSavedLocations = savedLocations.filter(
      (location) => location.id !== locationId
    );
    setSavedLocations(updatedSavedLocations);

    // Update localStorage as fallback
    localStorage.setItem(
      "savedLocations",
      JSON.stringify(updatedSavedLocations)
    );

    try {
      // Get fresh token to ensure it's not expired
      const currentUser = auth.currentUser;
      let token = localStorage.getItem("token");

      if (currentUser && token) {
        // Get a fresh token to ensure it's not expired
        const freshToken = await currentUser.getIdToken(true); // Force refresh
        localStorage.setItem("token", freshToken);
        token = freshToken;
      }

      // Remove from backend
      const response = await fetch(
        `${API_BASE_URL}/users/saved-locations/${locationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showNotification("Location removed from saved!", "info");
      } else {
        // If backend fails, revert the UI change
        const revertedSavedLocations = [...savedLocations];
        setSavedLocations(revertedSavedLocations);
        localStorage.setItem(
          "savedLocations",
          JSON.stringify(revertedSavedLocations)
        );
        showNotification(
          "Failed to remove location. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error removing saved location from backend:", error);
      // If backend fails, revert the UI change
      const revertedSavedLocations = [...savedLocations];
      setSavedLocations(revertedSavedLocations);
      localStorage.setItem(
        "savedLocations",
        JSON.stringify(revertedSavedLocations)
      );
      showNotification("Failed to remove location. Please try again.", "error");
    } finally {
      setIsRemovingLocation(false);
    }
  };

  // Function to add a location to recents
  const addRecentLocation = React.useCallback(async (location) => {
    try {
      // First, update the local state immediately for UI responsiveness
      setRecentLocations(prevRecents => {
        // Check if location is already in recents
        const existingIndex = prevRecents.findIndex(
          (recent) => recent.id === location.id
        );
        let updatedRecents = [...prevRecents];

        if (existingIndex !== -1) {
          // If already exists, move to the top
          const [existingLocation] = updatedRecents.splice(existingIndex, 1);
          updatedRecents = [existingLocation, ...updatedRecents];
        } else {
          // If new, add to the top
          const newRecentLocation = {
            ...location,
            viewedAt: new Date().toISOString(),
          };
          updatedRecents = [newRecentLocation, ...updatedRecents];
        }

        // Limit to 20 recent items
        updatedRecents = updatedRecents.slice(0, 20);
        
        // When not authenticated, also save to localStorage (for non-authenticated users)
        if (!isAuthenticated) {
          try {
            localStorage.setItem("recentLocations", JSON.stringify(updatedRecents));
          } catch (e) {
            console.error("Failed to save recentLocations to localStorage:", e);
          }
        }
        
        return updatedRecents;
      });

      // Then, save to the backend if user is authenticated
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/users/recent-locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(location)
        });

        if (!response.ok) {
          console.error('Failed to save recent location to backend:', await response.text());
          // The local state update still happened, so UI remains responsive
        }
      }
    } catch (error) {
      console.error('Error adding recent location:', error);
    }
  }, [isAuthenticated]);

  // Load recent locations from backend API when user is authenticated
  useEffect(() => {
    const fetchRecentLocations = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/users/recent-locations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setRecentLocations(data.data.recentLocations || []);
          } else {
            console.error('Failed to fetch recent locations:', response.status);
            setRecentLocations([]);
          }
        } catch (error) {
          console.error('Error fetching recent locations:', error);
          setRecentLocations([]);
        }
      } else {
        // When not authenticated, load from localStorage (device-specific behavior)
        const recents = localStorage.getItem("recentLocations");
        if (recents) {
          try {
            setRecentLocations(JSON.parse(recents));
          } catch (e) {
            console.error("Error parsing recent locations:", e);
            setRecentLocations([]);
          }
        } else {
          setRecentLocations([]);
        }
      }
    };

    fetchRecentLocations();
  }, [isAuthenticated]);

  // Effect to open popup when activePopup changes (programmatically triggered from explore sidebar)
  useEffect(() => {
    if (activePopup && markerRefs.current[activePopup]) {
      // Close any currently open popups first
      try {
        if (mapRef.current) {
          mapRef.current.closePopup();
        }
      } catch (e) {
        // No popup to close or error closing popup, continue anyway
      }
      
      // Open the popup for the selected marker after a short delay to ensure map transition is smooth
      const timer = setTimeout(() => {
        const markerRef = markerRefs.current[activePopup];
        // Different ways to access the leaflet instance depending on react-leaflet version
        if (markerRef) {
          try {
            // In some versions of react-leaflet, the marker ref itself is the leaflet instance
            if (typeof markerRef.openPopup === 'function') {
              markerRef.openPopup();
            } 
            // In other versions it might be under leafletElement property
            else if (markerRef.leafletElement && typeof markerRef.leafletElement.openPopup === 'function') {
              markerRef.leafletElement.openPopup();
            }
            // Or there might be another way to access it
            else {
              console.log("Could not access openPopup function on marker");
            }
          } catch (error) {
            console.error("Error opening popup:", error.message);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activePopup, markerRefs, mapRef]);

  // Fetch saved locations from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedLocations();
    } else {
      // Clear saved locations for logged out users (do not expose other users' data)
      setSavedLocations([]);
    }
  }, [isAuthenticated]);

  // When user logs out, clear recent locations from local state and load device-specific ones from localStorage
  useEffect(() => {
    const loadRecentLocations = async () => {
      if (!isAuthenticated) {
        // When not authenticated, load from localStorage (device-specific behavior)
        const recents = localStorage.getItem("recentLocations");
        if (recents) {
          try {
            setRecentLocations(JSON.parse(recents));
          } catch (e) {
            console.error("Error parsing recent locations:", e);
            setRecentLocations([]);
          }
        } else {
          setRecentLocations([]);
        }
      } else {
        // When authenticated, load from backend
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/users/recent-locations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setRecentLocations(data.data.recentLocations || []);
          } else {
            console.error('Failed to fetch recent locations:', response.status);
            setRecentLocations([]);
          }
        } catch (error) {
          console.error('Error fetching recent locations:', error);
          setRecentLocations([]);
        }
      }
    };

    loadRecentLocations();
  }, [isAuthenticated]);



  const fetchSavedLocations = async () => {
    try {
      // Get fresh token to ensure it's not expired
      const currentUser = auth.currentUser;
      let token = localStorage.getItem("token");

      if (currentUser && token) {
        // Get a fresh token to ensure it's not expired
        const freshToken = await currentUser.getIdToken(true); // Force refresh
        localStorage.setItem("token", freshToken);
        token = freshToken;
      }

      if (!token) {
        console.error("No token available for fetching saved locations");
        // Load from localStorage as fallback
        const saved = localStorage.getItem("savedLocations");
        if (saved) {
          try {
            setSavedLocations(JSON.parse(saved));
          } catch (e) {
            console.error("Error parsing saved locations:", e);
          }
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLocations(data.data.savedLocations);

        // Also save to localStorage as a fallback
        localStorage.setItem(
          "savedLocations",
          JSON.stringify(data.data.savedLocations)
        );
      } else {
        // If backend fails, load from localStorage as fallback
        const saved = localStorage.getItem("savedLocations");
        if (saved) {
          try {
            setSavedLocations(JSON.parse(saved));
          } catch (e) {
            console.error("Error parsing saved locations:", e);
          }
        }
        console.error("Failed to fetch saved locations from backend");
      }
    } catch (error) {
      console.error("Error fetching saved locations:", error);
      // If backend fails, load from localStorage as fallback
      const saved = localStorage.getItem("savedLocations");
      if (saved) {
        try {
          setSavedLocations(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved locations:", e);
        }
      }
    }
  };

  // Fetch posts from the backend API
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true); // Show loading state
      try {
        const headers = {
          "Content-Type": "application/json",
        };

        // Get fresh token to ensure it's not expired
        const currentUser = auth.currentUser;
        let token = localStorage.getItem("token");

        if (currentUser && token) {
          try {
            // Get a fresh token to ensure it's not expired
            const freshToken = await currentUser.getIdToken(true); // Force refresh
            localStorage.setItem("token", freshToken);
            token = freshToken;
          } catch (error) {
            console.error("Error refreshing token:", error);
            // Fallback to stored token if refresh fails
          }
        }

        // Add auth token if available
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/posts`, {
          headers,
        });
        const result = await response.json();

        if (result.status === "success") {
          // Transform the API data to match the format expected by the frontend
          // and filter out posts with invalid location data
          if (!result.data || !Array.isArray(result.data)) {
            console.error("API response data is not an array:", result.data);
            setUserPosts([]);
            setIsLoading(false);
            return;
          }
          
          const transformedPosts = result.data
            .filter((post) => {
              // Check if the post has valid location data in the expected format
              return (
                post.location &&
                typeof post.location.latitude === "number" &&
                typeof post.location.longitude === "number" &&
                !isNaN(post.location.latitude) &&
                !isNaN(post.location.longitude)
              );
            })
            .map((post) => ({
              id: post._id,
              title: post.title || "Untitled",
              description: post.description || "No description provided",
              image: post.image,
              images:
                Array.isArray(post.images) && post.images.length > 0
                  ? post.images
                  : post.image
                  ? [post.image]
                  : [],
              // Ratings: prefer cached aggregate fields, otherwise compute from ratings array
              averageRating:
                typeof post.averageRating === "number"
                  ? post.averageRating
                  : Array.isArray(post.ratings) && post.ratings.length > 0
                  ? post.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) /
                    post.ratings.length
                  : 0,
              totalRatings:
                typeof post.totalRatings === "number"
                  ? post.totalRatings
                  : Array.isArray(post.ratings)
                  ? post.ratings.length
                  : 0,
              postedBy:
                post.postedBy && typeof post.postedBy === "object"
                  ? post.postedBy.name || post.postedBy.displayName || "Anonymous"
                  : post.postedBy || "Anonymous",
              category: post.category || "general",
              datePosted: post.datePosted || new Date().toISOString(),
              position: [post.location.latitude, post.location.longitude], // [lat, lng] format for Leaflet
              type: "user-post",
            }));
          setUserPosts(transformedPosts);
        } else {
          console.error("Error fetching posts:", result.message);
          setUserPosts([]); // Set to empty array on error to ensure markers are updated
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false); // Hide loading state
      }
    };

    // Get user location with improved accuracy
    let watchId;
    if (navigator.geolocation) {
      // First, get a high accuracy position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation([latitude, longitude]);
          setHasUserLocation(true);
          console.log(
            `Initial location: ${latitude}, ${longitude} with accuracy: ${accuracy} meters`
          );

          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error("Error getting initial user location:", error);
          setHasUserLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );

      // Set up continuous location watching for more accurate positioning
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, timestamp } =
            position.coords;

          // Only update if the new position is more accurate than the current one
          // or if it's the first update after initial positioning
          if (!userLocation || accuracy < 50) {
            // Update if accuracy is better than 50 meters
            setUserLocation([latitude, longitude]);
            setHasUserLocation(true);
            console.log(
              `Updated location: ${latitude}, ${longitude} with accuracy: ${accuracy} meters at ${new Date(
                timestamp
              ).toLocaleTimeString()}`
            );

            // Optionally fly to new location if it's significantly more accurate
            if (accuracy < 30 && mapRef.current) {
              // Only fly to location if accuracy is better than 30 meters
              mapRef.current.flyTo([latitude, longitude], 15, {
                animate: true,
              });
            }
          }
        },
        (error) => {
          console.error("Error watching user location:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000, // Accept cached positions up to 10 seconds old
          timeout: 20000, // Wait up to 20 seconds for a position
          distanceFilter: 5, // Update only when user moves at least 5 meters
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setHasUserLocation(false);
    }

    fetchPosts();

    // Clean up the watch when component unmounts
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Add timeout to ensure loading doesn't get stuck
  useEffect(() => {
    if (isLoading) {
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading]);


  
  // All locations are now from the database
  const allLocations = userPosts;

  // Memoize filtered and sorted locations to prevent unnecessary re-calculations
  const filteredLocations = React.useMemo(() => {
    // Filter posts based on search query and user's posts if applicable
    let result = allLocations.filter(
      (location) => {
        const matchesSearch = searchQuery === "" ||
          location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.category.toLowerCase().includes(searchQuery.toLowerCase());
          
        const matchesFilterMine = !filterMine || (location.postedBy === user?.name) || 
          (typeof location.postedBy === 'object' && location.postedBy.name === user?.name);
          
        return matchesSearch && matchesFilterMine;
      }
    );

    // Sort filtered locations based on selected filter
    result = result.sort((a, b) => {
      switch (postsFilter) {
        case "latest":
          // Sort by datePosted (newest first)
          return new Date(b.datePosted) - new Date(a.datePosted);
        case "top":
          // Sort by totalRatings (highest first, then by averageRating)
          if (b.totalRatings !== a.totalRatings) {
            return b.totalRatings - a.totalRatings;
          }
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "ratings":
          // Sort by averageRating (highest first)
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "likes":
          // Sort by totalRatings (highest first) - assuming totalRatings represents likes/ratings
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        default:
          return new Date(b.datePosted) - new Date(a.datePosted); // Default to latest
      }
    });
    
    return result;
  }, [allLocations, searchQuery, filterMine, user?.name, postsFilter]);

  // Memoize paginated locations
  const paginatedLocations = React.useMemo(() => {
    if (!filteredLocations || filteredLocations.length === 0) {
      return [];
    }
    
    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    
    // Return the slice of filtered locations for the current page
    return filteredLocations.slice(startIndex, endIndex);
  }, [filteredLocations, currentPage, postsPerPage]);

  // Calculate total number of pages
  const totalPages = Math.ceil((filteredLocations?.length || 0) / postsPerPage);

  // Reset to page 1 when filters change (search, filterMine, postsFilter)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMine, postsFilter]);

  // Memoize paginated recent locations
  const paginatedRecentLocations = React.useMemo(() => {
    if (!recentLocations || recentLocations.length === 0) {
      return [];
    }
    
    // Calculate start and end indices for recent locations pagination
    const startIndex = (currentRecentPage - 1) * recentsPerPage;
    const endIndex = startIndex + recentsPerPage;
    
    // Return the slice of recent locations for the current page
    return recentLocations.slice(startIndex, endIndex);
  }, [recentLocations, currentRecentPage, recentsPerPage]);

  // Calculate total number of recent location pages
  const totalRecentPages = Math.ceil((recentLocations?.length || 0) / recentsPerPage);

  // Reset to page 1 when recent locations change
  React.useEffect(() => {
    setCurrentRecentPage(1);
  }, [recentLocations]);

  // Memoize paginated saved locations
  const paginatedSavedLocations = React.useMemo(() => {
    if (!savedLocations || savedLocations.length === 0) {
      return [];
    }
    
    // Calculate start and end indices for saved locations pagination
    const startIndex = (currentSavedPage - 1) * savedPerPage;
    const endIndex = startIndex + savedPerPage;
    
    // Return the slice of saved locations for the current page
    return savedLocations.slice(startIndex, endIndex);
  }, [savedLocations, currentSavedPage, savedPerPage]);

  // Calculate total number of saved location pages
  const totalSavedPages = Math.ceil((savedLocations?.length || 0) / savedPerPage);

  // Reset to page 1 when saved locations change
  React.useEffect(() => {
    setCurrentSavedPage(1);
  }, [savedLocations]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info", // 'success', 'error', 'info', 'warning'
  });

  const showNotification = (message, type = "info") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Update image URL only if it's currently a string (not a File object)
    if (name === "image") {
      setFormData({
        ...formData,
        [name]: value,
      });
    } else if (name !== "image") {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Make sure showNotification is in the dependency array of useCallback hooks that reference it

  const hideNotification = () => {
    setNotification({
      show: false,
      message: "",
      type: "info",
    });
  };

  const handleMapClick = (e) => {
    if (!isAuthenticated) {
      // Close any open forms/sidebars before showing login modal
      setShowPostForm(false);
      setClickPosition(null);
      setActiveSidebarTab("");
      setShowImageGallery(false);
      setShowLoginModal(true);
      return;
    }

    // Close any other modals before opening the post form
    setShowLoginModal(false);
    setShowImageGallery(false);
    const position = [e.latlng.lat, e.latlng.lng];
    openPostForm(position);

    // Pre-populate the form with user's name from auth context
    setFormData({
      title: "",
      description: "",
      image: null,
      category: "general",
      // Don't include postedBy since the backend will automatically use the authenticated user ID
    });
    // Clear any previously selected images when opening the modal
    setImages([]);
  };

  // Image helpers for multi-file upload in the map modal
  const validateAndAddImage = (file) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        image: "Please select a valid image file",
      }));
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "File size must be less than 5MB",
      }));
      return false;
    }
    if (images.length >= 10) {
      setErrors((prev) => ({
        ...prev,
        image: "You can only upload up to 10 images",
      }));
      return false;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = {
        id: Date.now() + Math.random(),
        file,
        preview: reader.result,
      };
      setImages((prev) => [...prev, newImage]);
      if (errors.image) setErrors((prev) => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      const remaining = 10 - images.length;
      setErrors((prev) => ({
        ...prev,
        image: `You can only upload up to 10 images. You can add ${remaining} more.`,
      }));
      return;
    }
    files.forEach((f) => validateAndAddImage(f));
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return; // prevent duplicate submits
    
    // Check authentication first
    if (!isAuthenticated) {
      showNotification("Please login to create a post.", "error");
      return;
    }
    
    setSubmitting(true);

    try {
      // Check if we have valid location data
      if (
        !clickPosition ||
        clickPosition.length !== 2 ||
        typeof clickPosition[0] !== "number" ||
        typeof clickPosition[1] !== "number" ||
        isNaN(clickPosition[0]) ||
        isNaN(clickPosition[1])
      ) {
        showNotification(
          "Invalid location data. Please click on the map again.",
          "error"
        );
        return;
      }

      // Always try to get a fresh token from Firebase if user is logged in
      // This ensures we never use an expired token
      let token = null;
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          // Always force refresh to get a valid token
          token = await currentUser.getIdToken(true);
          localStorage.setItem("token", token);
          console.log("Token refreshed successfully for post creation");
        } catch (error) {
          console.error("Error refreshing token:", error);
          // Fallback to stored token if refresh fails
          token = localStorage.getItem("token");
          if (!token) {
            showNotification("Authentication error. Please login again.", "error");
            setSubmitting(false);
            return;
          }
        }
      } else {
        // No user logged in, check if there's a stored token (shouldn't happen but safety check)
        token = localStorage.getItem("token");
        if (!token) {
          showNotification("Authentication required. Please login.", "error");
          setSubmitting(false);
          return;
        }
      }

      // Final check - ensure we have a token
      if (!token || token.trim() === "") {
        showNotification("Authentication required. Please login.", "error");
        setSubmitting(false);
        return;
      }

      // Create form data based on whether we have image files or a URL
      let postData;
      let isFormData = false;

      // If multiple images were selected in the modal, send them as 'images' fields
      if (images && images.length > 0) {
        postData = new FormData();
        postData.append("title", formData.title);
        postData.append("description", formData.description);
        postData.append("category", formData.category);
        images.forEach((img) => {
          postData.append("images", img.file, img.file.name);
        });
        postData.append(
          "location",
          JSON.stringify({
            type: "Point",
            latitude: parseFloat(clickPosition[0]),
            longitude: parseFloat(clickPosition[1]),
            coordinates: [
              parseFloat(clickPosition[1]),
              parseFloat(clickPosition[0]),
            ],
          })
        );
        isFormData = true;
      } else if (formData.image && formData.image instanceof File) {
        // Single file selected via the legacy input — send as images[] for backend compatibility
        postData = new FormData();
        postData.append("title", formData.title);
        postData.append("description", formData.description);
        postData.append("category", formData.category);
        postData.append("images", formData.image, formData.image.name);
        postData.append(
          "location",
          JSON.stringify({
            type: "Point",
            latitude: parseFloat(clickPosition[0]),
            longitude: parseFloat(clickPosition[1]),
            coordinates: [
              parseFloat(clickPosition[1]),
              parseFloat(clickPosition[0]),
            ],
          })
        );
        isFormData = true;
      } else {
        // Use regular JSON for no file or URL string
        postData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: {
            type: "Point",
            coordinates: [
              parseFloat(clickPosition[1]),
              parseFloat(clickPosition[0]),
            ],
            latitude: parseFloat(clickPosition[0]),   // Added explicit latitude
            longitude: parseFloat(clickPosition[1]),  // Added explicit longitude
          },
        };

        // Include image URL if it exists
        if (formData.image && typeof formData.image === "string") {
          postData.image = formData.image;
        }
      }

      // Prepare headers - ensure token is clean and properly formatted
      const cleanToken = token.trim();
      if (!cleanToken) {
        showNotification("Invalid authentication token. Please login again.", "error");
        setSubmitting(false);
        return;
      }
      
      const headers = {
        Authorization: `Bearer ${cleanToken}`,
      };

      // Set content type only if not FormData
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      // Send the post to the backend
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: headers,
        body: isFormData ? postData : JSON.stringify(postData),
      });

      // If response is not ok, read text and try to extract meaningful message
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (readErr) {
          console.error("Error reading error response text:", readErr);
        }

        // Try to parse JSON directly
        let parsed = null;
        try {
          parsed = JSON.parse(errorText);
        } catch (e) {
          parsed = null;
        }

        // If body is HTML, try to extract JSON-like substring inside it (common when servers embed JSON in HTML)
        if (
          !parsed &&
          typeof errorText === "string" &&
          errorText.includes("<")
        ) {
          try {
            const jsonMatch = errorText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          } catch {
            // ignore
          }
        }

        let errorMessage = `HTTP ${response.status}`;
        if (parsed) {
          if (typeof parsed.message === "string") errorMessage = parsed.message;
          else if (parsed.error && typeof parsed.error === "string")
            errorMessage = parsed.error;
          else errorMessage = JSON.stringify(parsed).slice(0, 500);
        } else if (errorText) {
          // Fallback: try to strip HTML tags for readability
          const stripped = errorText
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const snippet = stripped.slice(0, 800);
          errorMessage = snippet + (snippet.length >= 800 ? "..." : "");
        }

        console.error("Create post failed:", {
          status: response.status,
          text: errorText,
          parsed,
        });
        showNotification(`Error creating post: ${errorMessage}`, "error");
        return;
      }

      let result;
      try {
        result = await response.json();
      } catch {
        // Non-JSON success response
        const text = await response.text().catch(() => "");
        console.warn("Server returned non-JSON success response:", text);
        result = { status: "success", data: null, raw: text };
      }

      if (result.status === "success" && result.data) {
        // Add the new post to the local state
        const newPost = {
          id: result.data._id || `new-post-${Date.now()}`,
          position: (Array.isArray(result.data.location?.coordinates) && result.data.location.coordinates.length === 2)
            ? [result.data.location.coordinates[1], result.data.location.coordinates[0]] // [lat, lng] - GeoJSON format is [lng, lat]
            : (result.data.location?.latitude !== undefined && result.data.location?.longitude !== undefined)
            ? [result.data.location.latitude, result.data.location.longitude] // [lat, lng] - legacy format
            : (Array.isArray(clickPosition) && clickPosition.length === 2)
            ? [clickPosition[0], clickPosition[1]] // fallback to original click position [lat, lng]
            : null,
          title: formData.title || result.data.title,
          description: formData.description || result.data.description,
          image: result.data.image,
          images: Array.isArray(result.data.images) && result.data.images.length > 0
            ? result.data.images
            : result.data.image
            ? [result.data.image]
            : [],
          postedBy: result.data.postedBy && typeof result.data.postedBy === "object"
            ? result.data.postedBy?.name || result.data.postedBy
            : result.data.postedBy || user?.name,
          category: result.data.category || formData.category,
          datePosted: result.data.datePosted || new Date().toISOString(),
          type: "user-post",
        };
        setUserPosts((prevPosts) => [newPost, ...prevPosts]);
        showNotification("Post created successfully!", "success");
        setShowPostForm(false);
        setClickPosition(null);
        setFormData({ title: "", description: "", image: null, postedBy: "", category: "general" });
      } else {
        console.error("Error creating post:", result.message || "Unknown error");
        showNotification("Error creating post: " + (result.message || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Error:", error);
      // Check if this is a JSON parsing error
      if (error instanceof SyntaxError) {
        showNotification(
          "Server returned invalid response. Please try again later.",
          "error"
        );
      } else {
        showNotification("Error creating post. Please try again.", "error");
      }
    } finally {
      // Always clear submitting state so the UI isn't blocked by the overlay
      setSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowPostForm(false);
    setClickPosition(null);
    // Also close any open sidebars when the form closes
    setActiveSidebarTab("");
    // Close any other modals that might interfere
    setShowLoginModal(false);
    setShowImageGallery(false); // Close image gallery if open
  };

  const openPostForm = (position) => {
    setShowPostForm(true);
    setClickPosition(position);
    // Close any open sidebars when the form opens
    setActiveSidebarTab("");
    // Also close any other modals that might interfere
    setShowLoginModal(false);
    setShowImageGallery(false); // Close image gallery if open
  };



  const formatDate = React.useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const flyToLocation = React.useCallback((position) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 15);
    }
  }, [mapRef]);

  // Ref to track the last update time for active popup
  const lastPopupUpdate = useRef(0);
  
  const handleSidebarItemClick = React.useCallback((locationId) => {
    const location = allLocations.find((loc) => loc.id === locationId);
    if (location) {
      // Close any post creation form that might be open
      setShowPostForm(false);
      setClickPosition(null);
      // Close login modal if it's open
      setShowLoginModal(false);
      // Close image gallery if it's open
      setShowImageGallery(false);
      
      // Debounce to prevent multiple rapid updates that might cause shaking
      const now = Date.now();
      if (now - lastPopupUpdate.current > 100) { // 100ms debounce
        setActivePopup(locationId);
        lastPopupUpdate.current = now;
        flyToLocation(location.position);
        addRecentLocation(location);  // Add to recent locations when clicked from explore
      }
    }
  }, [allLocations, setActivePopup, flyToLocation, addRecentLocation, setShowPostForm, setClickPosition, setShowLoginModal, setShowImageGallery]);

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {" "}
      {/* pt-16 accounts for header height */}
      <Header isDiscoverPage={true} />
      {/* Full-Screen Map Container - with explicit z-index */}
      <div className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] z-[1]">
        {/* 4rem = 64px which is header height */}
        {/* Loading indicator - only show when loading is in progress and not showing post form */}
        {isLoading && !showPostForm && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[10]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-xl font-medium text-gray-700">
                Loading map data...
              </p>
            </div>
          </div>
        )}
        {/* Map */}
        <MapContainer
          key="discover-map" // Adding key to prevent potential re-rendering issues
          center={userLocation || [20, 0]} // Default to world view until location is acquired
          zoom={userLocation ? 15 : 5}
          minZoom={3}
          maxZoom={18}
          style={{ height: "100%", width: "100%" }}
          className="absolute inset-0 z-[1]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />
          <MapRefHandler mapRef={mapRef} />

          {filteredLocations.map((location) => {
            // Check if location.position is valid before creating the marker
            if (
              !location.position ||
              !Array.isArray(location.position) ||
              location.position.length !== 2 ||
              typeof location.position[0] !== "number" ||
              typeof location.position[1] !== "number" ||
              isNaN(location.position[0]) ||
              isNaN(location.position[1])
            ) {
              console.warn(
                `Invalid location position for post ${location.id}:`,
                location.position
              );
              return null; // Skip rendering this marker if location is invalid
            }

            return (
              <CustomMarker
                key={location.id}
                location={location}
                icon={getMarkerByCategory(
                  location.category || "general",
                  location.averageRating
                )}
                onClick={() => handleSidebarItemClick(location.id)}
                onAddToRef={(id, markerRef) => {
                  if (markerRef) {
                    markerRefs.current[id] = markerRef;
                  }
                }}
                onRemoveFromRef={(id) => {
                  delete markerRefs.current[id];
                }}
                mapRef={mapRef}
                savedLocations={savedLocations}
                saveLocation={saveLocation}
                removeSavedLocation={removeSavedLocation}
                isSavingLocation={isSavingLocation}
                addRecentLocation={addRecentLocation}
                user={user}
                isAuthenticated={isAuthenticated}
                activePopup={activePopup}
                onPopupOpen={setActivePopup}
                onPopupClose={() => setActivePopup(null)}
              />
            );
          })}

        </MapContainer>

        
        {/* Static Icon Sidebar */}
        <div className="sidebar-icon-container absolute left-0 top-0 h-full w-16 sm:w-20 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[1000] flex flex-col items-center py-4 space-y-2 sm:space-y-3">
          <button
            className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "explore"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(
                activeSidebarTab === "explore" ? "" : "explore"
              )
            }
            title="Explore"
          >
            <svg
              className="w-4 sm:w-6 h-4 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>



          <button
            className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "saved"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(activeSidebarTab === "saved" ? "" : "saved")
            }
            title="Saved Locations"
          >
            <svg
              className="w-4 sm:w-6 h-4 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          <button
            className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "recents"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(
                activeSidebarTab === "recents" ? "" : "recents"
              )
            }
            title="Recent Locations"
          >
            <svg
              className="w-4 sm:w-6 h-4 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "stats"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(activeSidebarTab === "stats" ? "" : "stats")
            }
            title="Statistics"
          >
            <svg
              className="w-4 sm:w-6 h-4 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        </div>
        {/* Window Panes - appear when icons are clicked */}
        <AnimatePresence>
          {activeSidebarTab && (
            <motion.div
              className={`sidebar-pane absolute top-0 h-full bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col overflow-x-hidden ${activeSidebarTab ? 'is-open' : ''}`}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 300, 
                mass: 0.8 
              }}
            >
              <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  {activeSidebarTab.replace("-", " ")}
                </h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700 p-1 sm:p-2"
                >
                  <svg
                    className="w-5 sm:w-6 h-5 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1">
                {activeSidebarTab === "explore" && (
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="space-y-3 sm:space-y-4 flex-shrink-0 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                          Search Places
                        </h3>
                        <Geocoder
                          searchQuery={searchQuery}
                          setSearchQuery={setSearchQuery}
                          mapRef={mapRef}
                          setSuggestions={setSuggestions}
                          suggestions={suggestions}
                          setIsSearching={setIsSearching}
                        />
                      </div>

                      {isAuthenticated && (
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                          <span className="text-sm">Show Only My Posts</span>
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              filterMine ? "bg-blue-500" : "bg-gray-300"
                            }`}
                            onClick={() => setFilterMine(!filterMine)}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                filterMine ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-h-0">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                            Posts & Locations
                          </h3>
                          <select
                            value={postsFilter}
                            onChange={(e) => setPostsFilter(e.target.value)}
                            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-auto"
                          >
                            <option value="latest">Latest</option>
                            <option value="top">Top Rated</option>
                            <option value="ratings">By Ratings</option>
                            <option value="likes">By Likes</option>
                          </select>
                        </div>
                        <div className="space-y-3 sm:space-y-4 h-full">
                          <AnimatePresence>
                            {paginatedLocations.length > 0 ? (
                              paginatedLocations.map((location, index) => (
                                <motion.div
                                  key={location.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                                    activePopup === location.id
                                      ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                                      : "bg-gray-50/80 hover:bg-gray-100 border-2 border-transparent"
                                  }`}
                                  onClick={() =>
                                    handleSidebarItemClick(location.id)
                                  }
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="flex items-start space-x-2 sm:space-x-3">
                                    <div
                                      className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mt-2.5 ${
                                        location.category === "nature"
                                          ? "bg-green-500"
                                          : location.category === "culture"
                                          ? "bg-yellow-500"
                                          : location.category === "shopping"
                                          ? "bg-purple-500"
                                          : location.category === "food"
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                      }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                        {location.title}
                                      </h3>
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                                        {location.description}
                                      </p>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-2">
                                        <span className="text-xs text-gray-500 truncate">
                                          By {location.postedBy}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(location.datePosted)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="text-center py-6 sm:py-8">
                                {filterMine && isAuthenticated ? (
                                  <div className="text-gray-500">
                                    <p className="text-base sm:text-lg">
                                      You haven't posted anything yet
                                    </p>
                                    <p className="text-xs sm:text-sm mt-2 text-gray-400">
                                      Start by clicking anywhere on the map to
                                      create your first post!
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">
                                    <p>No matching posts found</p>
                                    <p className="text-xs sm:text-sm mt-2">
                                      Try a different search term
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Pagination Controls */}
                        {filteredLocations.length > postsPerPage && (
                          <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                currentPage === 1
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                currentPage === totalPages
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSidebarTab === "stats" && (
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center bg-blue-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {allLocations.length}
                          </div>
                          <div className="text-xs text-gray-600">
                            Total Locations
                          </div>
                        </div>
                        <div className="text-center bg-green-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {userPosts.length}
                          </div>
                          <div className="text-xs text-gray-600">User Posts</div>
                        </div>
                        <div className="text-center bg-purple-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">
                            {new Set(allLocations.map((l) => l.category)).size}
                          </div>
                          <div className="text-xs text-gray-600">Categories</div>
                        </div>
                        <div className="text-center bg-orange-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-orange-600">
                            24/7
                          </div>
                          <div className="text-xs text-gray-600">Live Updates</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          User Info
                        </h4>
                        {isAuthenticated ? (
                          <p className="text-sm text-gray-600">
                            Logged in as: {user?.name}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">Not logged in</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {activeSidebarTab === "saved" && (
                  <div className="p-4">
                    <div className="space-y-4">
                      {!isAuthenticated ? (
                        <div className="text-center py-12 text-gray-500">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                          <p className="mt-4 text-lg">
                            Saved locations are private
                          </p>
                          <p className="text-sm mt-2">
                            Log in to view and manage your saved locations.
                          </p>
                          <div className="mt-4">
                            <button
                              onClick={() => setShowLoginModal(true)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm"
                            >
                              Log in
                            </button>
                          </div>
                        </div>
                      ) : savedLocations.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {paginatedSavedLocations.map((location, index) => (
                              <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
                                onClick={() => {
                                  if (mapRef.current) {
                                    mapRef.current.flyTo(location.position, 15);
                                    setActivePopup(location.id);
                                  }
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">
                                      {location.name || location.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {location.description || ""}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-500">
                                        {location.type === "poi"
                                          ? `From OpenStreetMap`
                                          : `By ${
                                              typeof location.postedBy === "object"
                                                ? location.postedBy?.name ||
                                                  location.postedBy
                                                : location.postedBy
                                            }`}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          location.savedAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSavedLocation(location.id);
                                    }}
                                    className={`ml-2 ${isRemovingLocation ? 'opacity-50 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                    title="Remove from saved"
                                    disabled={isRemovingLocation}
                                  >
                                    {isRemovingLocation ? (
                                      <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {/* Saved Locations Pagination Controls */}
                          {savedLocations.length > savedPerPage && (
                            <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
                              <button
                                onClick={() => setCurrentSavedPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentSavedPage === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  currentSavedPage === 1
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Previous
                              </button>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                  Page {currentSavedPage} of {totalSavedPages}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => setCurrentSavedPage(prev => Math.min(prev + 1, totalSavedPages))}
                                disabled={currentSavedPage === totalSavedPages}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  currentSavedPage === totalSavedPages
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                          <p className="mt-4 text-lg">No saved locations yet</p>
                          <p className="text-sm mt-2">
                            Locations you save will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeSidebarTab === "recents" && (
                  <div className="p-4">
                    <div className="space-y-4">
                      {recentLocations.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {paginatedRecentLocations.map((location, index) => (
                              <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
                                onClick={() => {
                                  if (mapRef.current) {
                                    mapRef.current.flyTo(location.position, 15);
                                    setActivePopup(location.id);
                                  }
                                }}
                              >
                                <h3 className="font-semibold text-gray-800">
                                  {location.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {location.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {location.type === "poi"
                                      ? `From OpenStreetMap`
                                      : `By ${
                                          typeof location.postedBy === "object"
                                            ? location.postedBy?.name ||
                                              location.postedBy
                                            : location.postedBy
                                        }`}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(location.viewedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {/* Recent Locations Pagination Controls */}
                          {recentLocations.length > recentsPerPage && (
                            <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
                              <button
                                onClick={() => setCurrentRecentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentRecentPage === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  currentRecentPage === 1
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Previous
                              </button>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                  Page {currentRecentPage} of {totalRecentPages}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => setCurrentRecentPage(prev => Math.min(prev + 1, totalRecentPages))}
                                disabled={currentRecentPage === totalRecentPages}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  currentRecentPage === totalRecentPages
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="mt-4 text-lg">No recent locations</p>
                          <p className="text-sm mt-2">
                            Locations you view will appear here
                          </p>
                          {!isAuthenticated && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600">Log in to save and manage your locations</p>
                              <button
                                onClick={() => setShowLoginModal(true)}
                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm"
                              >
                                Log in
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Post Creation Form Modal */}
      <AnimatePresence>
        {showPostForm && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[800]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[801] p-4">
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-transform duration-300 ease-in-out"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Submitting overlay */}
                {submitting && (
                  <div className="absolute inset-0 z-[900] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 p-8">
                      <svg
                        className="animate-spin h-12 w-12 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      <div className="text-gray-700 font-medium text-lg text-center">
                        Creating post — please wait...
                      </div>
                      <div className="text-gray-500 text-sm text-center">
                        Your post is being saved to the map
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fixed header with close button - always visible */}
                <div className="p-4 flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 z-[850]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Create New Post
                        </h2>
                        <p className="text-sm text-gray-600">
                          Share a location with the community
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeForm}
                      className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                      aria-label="Close create post"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* Scrollable form area */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label
                          className="block text-gray-700 mb-2 font-semibold"
                          htmlFor="title"
                        >
                          Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleFormChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none shadow-sm"
                          placeholder="Enter a descriptive title"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 mb-2 font-semibold"
                          htmlFor="category"
                        >
                          Category *
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none shadow-sm"
                        >
                          <option value="general">General</option>
                          <option value="nature">Nature</option>
                          <option value="culture">Culture</option>
                          <option value="shopping">Shopping</option>
                          <option value="food">Food & Drinks</option>
                          <option value="event">Event</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          className="block text-gray-700 mb-2 font-semibold"
                          htmlFor="description"
                        >
                          Description *
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          rows="4"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none resize-y shadow-sm"
                          placeholder="Describe this location, what makes it special, or any helpful details..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-gray-700 mb-2 font-semibold">
                          Images (optional — up to 10)
                        </label>

                        {/* URL input (optional) */}
                        <div className="mb-4">
                          <input
                            type="text"
                            id="image"
                            name="image"
                            value={
                              typeof formData.image === "string"
                                ? formData.image
                                : ""
                            }
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 outline-none shadow-sm"
                            placeholder="Or paste an image URL (optional)"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            You can either paste a URL or upload images below.
                          </p>
                        </div>

                        {/* Upload area */}
                        <div className="space-y-4">
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
                            onClick={handleAddButtonClick}
                          >
                            <svg
                              className="mx-auto h-10 w-10 text-blue-500 mb-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 15a4 4 0 014-4h10a4 4 0 110 8H7a4 4 0 01-4-4zM7 11V7m0 0L5 9m2-2l2 2"
                              />
                            </svg>
                            <div className="text-center">
                              <div className="text-sm text-gray-700 font-medium mb-1">
                                Click to add images
                              </div>
                              <div className="text-xs text-gray-500">
                                JPG, PNG, GIF — up to 5MB each
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleAddButtonClick}
                              disabled={images.length >= 10}
                              className={`px-4 py-2.5 rounded-xl text-white font-medium shadow-sm ${
                                images.length >= 10
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {images.length > 0 ? `Add More (${10 - images.length} left)` : "Add Images"}
                            </button>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>

                          {errors.image && (
                            <p className="text-red-500 text-sm mt-2">
                              {errors.image}
                            </p>
                          )}

                          {images.length > 0 && (
                            <div className="mt-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-3">
                                <span>Selected Images ({images.length}/10)</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {images.map((image, idx) => (
                                  <div
                                    key={image.id}
                                    className="relative rounded-xl overflow-hidden h-24 bg-gray-100 border border-gray-200"
                                  >
                                    <img
                                      src={image.preview}
                                      alt={`Preview ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(image.id)}
                                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                                      aria-label={`Remove image ${idx + 1}`}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-800 font-medium">
                                ℹ️ Auto-Associated Account
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                Your post will be automatically associated with your account. No need to enter your name.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0L6.94 17.25a1.998 1.998 0 010-2.827l3.646-3.647a1.999 1.999 0 012.828 0L17.657 16.657zM19.07 8.93l-1.414-1.414a1.999 1.999 0 00-2.828 0L10.586 11.75a1.999 1.999 0 000 2.828l3.646 3.647a1.999 1.999 0 002.828 0L19.07 13.93a1.999 1.999 0 000-2.828z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-800 font-medium">
                                📍 Selected Location
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                {clickPosition
                                  ? `Latitude: ${clickPosition[0].toFixed(6)}, Longitude: ${clickPosition[1].toFixed(6)}`
                                  : "No location selected - click on the map to select a location"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="flex-1 bg-gray-100 text-gray-800 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 py-3 px-6 rounded-xl transition-all duration-200 font-medium shadow-md ${
                          submitting
                            ? "bg-blue-400 text-white cursor-wait"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5"
                        }`}
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              ></path>
                            </svg>
                            Creating...
                          </div>
                        ) : (
                          "Publish Post"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-gradient-to-br from-blue-400/40 via-purple-500/40 to-indigo-600/40 backdrop-blur-md z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Authentication Required
                  </h2>

                  <p className="text-gray-600 mb-6">
                    You need to be logged in to add pins to the map. Please
                    login to continue.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowLoginModal(false);
                        window.location.href = "/login";
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    >
                      Login Now
                    </button>
                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-400 transition-all duration-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      {/* Custom CSS */}

      
      {/* Image Gallery Modal */}
      {showImageGallery && galleryImages && galleryImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-black/70 to-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageGallery(false)}
        >
          <div 
            className="relative w-full max-w-6xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === 0 ? galleryImages.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 rounded-full p-3 hover:bg-white transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === galleryImages.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 rounded-full p-3 hover:bg-white transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image display container with close button */}
            <div className="relative flex flex-col items-center">
              <div className="relative inline-block">
                <img
                  src={getImageUrl(galleryImages[currentImageIndex])}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
                
                {/* Close button positioned relative to image */}
                <button
                  onClick={() => setShowImageGallery(false)}
                  className="absolute -top-3 -right-3 z-30 bg-white text-gray-900 rounded-full p-2.5 hover:bg-gray-100 transition-all duration-200 shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Image counter */}
              {galleryImages.length > 1 && (
                <div className="mt-4 text-white text-lg font-medium drop-shadow-lg">
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Modal */}
      <NotificationModal
        show={notification.show}
        onClose={hideNotification}
        message={notification.message}
        type={notification.type}
        autoClose={notification.type === "error" ? 0 : 5000} // Don't auto-close error messages
      />
    </div>
  );
};

export default MapView;
