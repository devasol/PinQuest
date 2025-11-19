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
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import Header from "../Landing/Header/Header";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { auth } from "../../config/firebase";
import RoutingMachine from "./RoutingMachine";
import NotificationModal from "../NotificationModal";
import OptimizedImage from "../OptimizedImage";
import {
  getMarkerByCategory,
  createUserLocationMarker,
  createPOIMarker,
} from "./CustomMapMarkers";

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

// Fix for missing marker icons (Leaflet's default markers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
    mapRef.current = map;
    return () => {
      mapRef.current = null;
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

// Custom hook for drag functionality
const useDraggable = (initialPosition = { x: 0, y: 0 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];

      setPosition({
        x: touch.clientX - offset.x,
        y: touch.clientY - offset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, offset]);

  return { position, isDragging, handleMouseDown, handleTouchStart };
};

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
  const [userLocation, setUserLocation] = useState(null); // Initialize as null to indicate no location yet
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterMine, setFilterMine] = useState(false); // New state for filtering user's posts
  const mapRef = useRef();
  const [routingStart, setRoutingStart] = useState(null);
  const [routingEnd, setRoutingEnd] = useState(null);
  const [showRouting, setShowRouting] = useState(false);
  const [travelMode, setTravelMode] = useState("driving"); // 'driving' or 'walking'

  // Map layout state
  const [mapLayout, setMapLayout] = useState(() => {
    // Try to get saved preference from localStorage
    const savedLayout = localStorage.getItem("mapLayout");
    return savedLayout || "google_style"; // Default to 'google_style' for more detailed labels
  });

  // Map layout options
  const mapLayouts = {
    default: {
      name: "Streets",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    },
    satellite: {
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
    terrain: {
      name: "Terrain",
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
    dark: {
      name: "Dark",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    },
    light: {
      name: "Light",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    },
    // New layout with enhanced labeling
    labels: {
      name: "Detailed Labels",
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    },
    // Google Maps style layer with more POIs
    google_style: {
      name: "Google Style",
      url: "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM contributors</a>',
    },
  };

  // Draggable positions for UI elements (keeping for backward compatibility)
  const statsPanelDrag = useDraggable({ x: 24, y: 80 }); // Initial position for stats panel (top-right)
  const sidebarDrag = useDraggable({ x: 24, y: 80 }); // Initial position for sidebar (top-left)

  // State for Points of Interest (POIs)
  const [pois, setPois] = useState([]);
  const [showPoiLayer, setShowPoiLayer] = useState(false); // Toggle for showing POIs (default off)

  // State for sidebar and its sections
  const [activeSidebarTab, setActiveSidebarTab] = useState(""); // '', explore, stats, map-settings, pois, saved, recents
  // State for saved/bookmarked locations
  const [savedLocations, setSavedLocations] = useState([]);
  // State for recently viewed locations
  const [recentLocations, setRecentLocations] = useState([]);

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
    }
  };

  // Function to add a location to recents
  const addRecentLocation = (location) => {
    // Check if location is already in recents
    const existingIndex = recentLocations.findIndex(
      (recent) => recent.id === location.id
    );
    let updatedRecents = [...recentLocations];

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

    setRecentLocations(updatedRecents);

    // Save to localStorage
    localStorage.setItem("recentLocations", JSON.stringify(updatedRecents));
  };

  // Function to load saved and recent locations from localStorage and backend on component mount
  useEffect(() => {
    const recents = localStorage.getItem("recentLocations");

    if (recents) {
      try {
        setRecentLocations(JSON.parse(recents));
      } catch (e) {
        console.error("Error parsing recent locations:", e);
      }
    }
  }, []);

  // Fetch saved locations from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedLocations();
    } else {
      // If not authenticated, load from localStorage as fallback
      const saved = localStorage.getItem("savedLocations");
      if (saved) {
        try {
          setSavedLocations(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved locations:", e);
        }
      }
    }
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
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showPoiSettings, setShowPoiSettings] = useState(false);

  // Function to fetch nearby Points of Interest using Overpass API
  const fetchPois = async (bounds) => {
    if (!bounds || !showPoiLayer) return;

    try {
      // Convert bounds to bbox format for Overpass API
      const bbox = `${bounds._southWest.lat},${bounds._southWest.lng},${bounds._northEast.lat},${bounds._northEast.lng}`;

      // Overpass API query to fetch various types of POIs
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"](bbox);
          node["tourism"](bbox);
          node["shop"](bbox);
          node["restaurant"](bbox);
          node["cafe"](bbox);
          node["hotel"](bbox);
          node["attraction"](bbox);
          node["landmark"](bbox);
          node["building"](bbox);
          node["place"](bbox);
        );
        out body;
      `.replace("bbox", bbox);

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      const data = await response.json();

      // Process the POI data into a format we can use
      const processedPois = data.elements
        .filter((element) => element.type === "node") // Only process nodes for simplicity
        .map((element) => {
          return {
            id: element.id,
            lat: element.lat,
            lng: element.lon,
            tags: element.tags || {},
            name:
              element.tags.name ||
              element.tags.amenity ||
              element.tags.tourism ||
              "Point of Interest",
            type:
              element.tags.amenity ||
              element.tags.tourism ||
              element.tags.shop ||
              element.tags.building ||
              element.tags.place ||
              "poi",
            position: [element.lat, element.lon],
          };
        })
        .filter((poi) => poi.position[0] && poi.position[1]); // Filter out invalid positions

      setPois(processedPois);
    } catch (error) {
      console.error("Error fetching POIs:", error);
    }
  };

  // Effect to fetch POIs when map bounds change
  useEffect(() => {
    if (!mapRef.current || !showPoiLayer) return;

    const handleMapMove = () => {
      const bounds = mapRef.current.getBounds();
      fetchPois(bounds);
    };

    // Fetch POIs initially and when map moves
    const map = mapRef.current;
    if (map) {
      handleMapMove();
      map.on("moveend", handleMapMove);
    }

    // Cleanup event listener
    return () => {
      if (map) {
        map.off("moveend", handleMapMove);
      }
    };
  }, [showPoiLayer, mapRef.current]);

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
          const transformedPosts = result.data
            .filter((post) => {
              // Check if the post has valid location data
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
              title: post.title,
              description: post.description,
              image: post.image,
              postedBy:
                post.postedBy && typeof post.postedBy === "object"
                  ? post.postedBy.name
                  : post.postedBy,
              category: post.category || "general",
              datePosted: post.datePosted,
              position: [post.location.latitude, post.location.longitude],
              type: "user-post",
            }));
          setUserPosts(transformedPosts);
        } else {
          console.error("Error fetching posts:", result.message);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false); // Hide loading state
      }
    };

    // Get user location with improved accuracy
    const watchUserLocation = () => {
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
        const watchId = navigator.geolocation.watchPosition(
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

        // Clean up the watch when component unmounts
        return () => {
          navigator.geolocation.clearWatch(watchId);
        };
      } else {
        console.log("Geolocation is not supported by this browser.");
        setHasUserLocation(false);
      }
    };

    fetchPosts();
    watchUserLocation();
  }, []);

  // Function to get directions from user's current location to a post location
  const getDirections = (destinationPosition) => {
    if (!isAuthenticated) {
      showNotification("Please login to get directions", "warning");
      return;
    }

    if (navigator.geolocation) {
      // Use high accuracy to get the most precise location for directions
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const startPosition = [latitude, longitude];
          console.log(
            `Direction start location: ${latitude}, ${longitude} with accuracy: ${accuracy} meters`
          );

          const updatedStartPosition = [latitude, longitude];

          // Clear previous routing before setting new one
          setRoutingStart(null);
          setRoutingEnd(null);
          setTimeout(() => {
            setRoutingStart(updatedStartPosition);
            setRoutingEnd(destinationPosition);
            setShowRouting(true);

            // Close any active popup
            setActivePopup(null);

            // Fly to the route area
            if (mapRef.current) {
              // Calculate center point between start and end
              const centerLat =
                (updatedStartPosition[0] + destinationPosition[0]) / 2;
              const centerLng =
                (updatedStartPosition[1] + destinationPosition[1]) / 2;
              const center = [centerLat, centerLng];

              // Determine appropriate zoom level based on distance
              const distance = calculateDistance(
                updatedStartPosition[0],
                updatedStartPosition[1],
                destinationPosition[0],
                destinationPosition[1]
              );
              const zoom =
                distance < 1 ? 14 : distance < 5 ? 12 : distance < 20 ? 10 : 8;

              mapRef.current.flyTo(center, zoom);
            }
          }, 100); // Small delay to ensure proper cleanup
        },
        (error) => {
          console.error("Error getting user location for directions:", error);
          let errorMessage =
            "Could not get your location for directions. Please enable location services and try again.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable location services in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get your location timed out.";
              break;
            default:
              errorMessage =
                "An unknown error occurred while getting your location.";
              break;
          }

          showNotification(errorMessage, "error");
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased timeout for more accurate positioning
          maximumAge: 0,
        }
      );
    } else {
      showNotification(
        "Geolocation is not supported by this browser. Please use a different browser to get directions.",
        "error"
      );
    }
  };

  // Helper function to calculate distance between two points (in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // All locations are now from the database
  const allLocations = userPosts;

  // Filter posts based on search query and user's posts if applicable
  const filteredLocations = allLocations.filter(
    (location) =>
      (searchQuery === "" ||
        location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        location.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterMine || location.postedBy === user?.name)
  );

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

  const hideNotification = () => {
    setNotification({
      show: false,
      message: "",
      type: "info",
    });
  };

  const handleMapClick = (e) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setClickPosition([e.latlng.lat, e.latlng.lng]);
    setShowPostForm(true);

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

  // Image helpers for multi-file upload in the map modal
  const validateAndAddImage = (file) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select a valid image file" }));
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "File size must be less than 5MB" }));
      return false;
    }
    if (images.length >= 10) {
      setErrors((prev) => ({ ...prev, image: "You can only upload up to 10 images" }));
      return false;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = { id: Date.now() + Math.random(), file, preview: reader.result };
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
      setErrors((prev) => ({ ...prev, image: `You can only upload up to 10 images. You can add ${remaining} more.` }));
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

      // Check if we have a valid token
      let token = localStorage.getItem("token");

      if (!token) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const freshToken = await currentUser.getIdToken(true); // Force refresh
            localStorage.setItem("token", freshToken);
            token = freshToken;
          } catch (error) {
            console.error("Error getting token:", error);
          }
        }
      }

      if (!token) {
        showNotification("Authentication required. Please login.", "error");
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
            latitude: parseFloat(clickPosition[0]),
            longitude: parseFloat(clickPosition[1]),
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
            latitude: parseFloat(clickPosition[0]),
            longitude: parseFloat(clickPosition[1]),
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
            latitude: parseFloat(clickPosition[0]),
            longitude: parseFloat(clickPosition[1]),
          },
        };

        // Include image URL if it exists
        if (formData.image && typeof formData.image === "string") {
          postData.image = formData.image;
        }
      }

      // Prepare headers
      const headers = {
        Authorization: `Bearer ${token.trim()}`,
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

        let parsed = null;
  try { parsed = JSON.parse(errorText); } catch { parsed = null; }

        let errorMessage = `HTTP ${response.status}`;
        if (parsed) {
          if (typeof parsed.message === "string") errorMessage = parsed.message;
          else if (parsed.message && typeof parsed.message === "object") errorMessage = JSON.stringify(parsed.message);
          else if (parsed.error) errorMessage = parsed.error;
          else errorMessage = JSON.stringify(parsed).slice(0, 500);
        } else if (errorText) {
          const snippet = errorText.replace(/\s+/g, " ").trim().slice(0, 800);
          errorMessage = snippet + (snippet.length >= 800 ? "..." : "");
        }

        console.error("Create post failed:", { status: response.status, text: errorText, parsed });
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

      if (result.status === "success") {
        // Add the new post to the local state
        const newPost = {
          id: result.data._id, // Use the ID from the database
          position: [
            parseFloat(result.data.location.latitude),
            parseFloat(result.data.location.longitude),
          ],
          title: formData.title,
          description: formData.description,
          image: result.data.image, // This could be a string URL or an object with a url property
          images: result.data.images && result.data.images.length > 0 ? result.data.images : (result.data.image ? [result.data.image] : []),
          postedBy:
            result.data.postedBy && typeof result.data.postedBy === "object"
              ? result.data.postedBy.name
              : result.data.postedBy,
          category: result.data.category || formData.category,
          datePosted: result.data.datePosted,
          type: "user-post",
        };

        setUserPosts((prevPosts) => [...prevPosts, newPost]);

        showNotification("Post created successfully!", "success");
        setShowPostForm(false);
        setClickPosition(null);
        setFormData({
          title: "",
          description: "",
          image: null,
          category: "general",
        });
        setImages([]);
      } else {
        console.error("Error creating post:", result.message);
        showNotification("Error creating post: " + result.message, "error");
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
    }
  };

  const closeForm = () => {
    setShowPostForm(false);
    setClickPosition(null);
  };

  // getMarkerByCategory is now imported from CustomMapMarkers

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const flyToLocation = (position) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 15);
    }
  };

  const handleSidebarItemClick = (locationId) => {
    const location = allLocations.find((loc) => loc.id === locationId);
    if (location) {
      setActivePopup(locationId);
      flyToLocation(location.position);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {" "}
      {/* pt-16 accounts for header height */}
      <Header isDiscoverPage={true} />
      {/* Full-Screen Map Container */}
      <div className="relative w-full h-[calc(100vh-4rem)]">
        {" "}
        {/* 4rem = 64px which is header height */}
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1001] flex items-center justify-center">
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
          center={userLocation || [20, 0]} // Default to world view until location is acquired
          zoom={userLocation ? 15 : 2}
          style={{ height: "100%", width: "100%" }}
          className="absolute inset-0"
        >
          <TileLayer
            key={mapLayout} // This ensures the TileLayer re-renders when layout changes
            attribution={mapLayouts[mapLayout].attribution}
            url={mapLayouts[mapLayout].url}
          />

          <MapClickHandler onMapClick={handleMapClick} />
          <MapRefHandler mapRef={mapRef} />

          {/* Routing Machine Component */}
          {showRouting && routingStart && routingEnd && (
            <RoutingMachine
              start={routingStart}
              end={routingEnd}
              isVisible={showRouting}
              travelMode={travelMode}
            />
          )}

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
              <Marker
                key={location.id}
                position={location.position}
                icon={getMarkerByCategory(location.category)}
                eventHandlers={{
                  click: () => handleSidebarItemClick(location.id),
                }}
              >
                <Popup
                  className="custom-popup"
                  onOpen={() => {
                    setActivePopup(location.id);
                    addRecentLocation(location);
                  }}
                  onClose={() => {
                    setActivePopup(null);
                  }}
                >
                  <div className="p-6 min-w-[400px] max-w-[500px] relative">
                    {(location.image && typeof location.image === "string") ||
                    (location.image && location.image.url) ? (
                      <div className="relative">
                        <div className="w-full h-48 rounded-lg mb-4">
                          <OptimizedImage
                            src={getImageUrl(location.image)}
                            alt={location.title}
                            priority={activePopup === location.id} // Prioritize loading the image in the active popup
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <button
                          className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close popup
                            if (mapRef.current) {
                              mapRef.current.closePopup();
                            }
                            // Clear routing if it's showing directions to the current location
                            if (showRouting) {
                              setShowRouting(false);
                              setRoutingStart(null);
                              setRoutingEnd(null);
                            }
                          }}
                          title={showRouting ? "Close Direction" : "Close"}
                        >
                          <svg
                            className="w-6 h-6"
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
                    ) : null}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-2xl text-gray-800">
                          {location.title}
                        </h3>
                        <p className="text-gray-600 text-base mt-1">
                          {location.description}
                        </p>
                      </div>
                      {!location.image && (
                        <button
                          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Close popup
                            if (mapRef.current) {
                              mapRef.current.closePopup();
                            }
                            // Clear routing if it's showing directions to the current location
                            if (showRouting) {
                              setShowRouting(false);
                              setRoutingStart(null);
                              setRoutingEnd(null);
                            }
                          }}
                          title={showRouting ? "Close Direction" : "Close"}
                        >
                          <svg
                            className="w-6 h-6"
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
                      )}
                    </div>
                    <div className="space-y-2 text-base text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>Posted by:</span>
                        <span className="font-medium">{location.postedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium capitalize">
                          {location.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">
                          {formatDate(location.datePosted)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {isAuthenticated ? (
                        <div className="space-y-3">
                          <div className="flex space-x-1">
                            <button
                              className={`p-2 rounded-lg transition-colors duration-300 ${
                                travelMode === "driving"
                                  ? "bg-blue-100 text-blue-600"
                                  : "hover:bg-gray-200"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTravelMode("driving");
                              }}
                              title="Driving directions"
                            >
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
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                              </svg>
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors duration-300 ${
                                travelMode === "walking"
                                  ? "bg-blue-100 text-blue-600"
                                  : "hover:bg-gray-200"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTravelMode("walking");
                              }}
                              title="Walking directions"
                            >
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
                                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                                />
                              </svg>
                            </button>
                            <button
                              className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent popup from closing
                                getDirections(location.position);
                              }}
                              title="Get Directions"
                            >
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276a1 1 0 001.447-.894V5.618a1 1 0 00-1.447-.894L15 7m0 13v-3m0-4H9m4 0V9m0 0H9m4 0v4m0 4h.01"
                                />
                              </svg>
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors duration-300 ${
                                savedLocations.some(
                                  (saved) => saved.id === location.id
                                )
                                  ? "bg-green-100 text-green-600"
                                  : "hover:bg-gray-200"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent popup from closing
                                // Check if location is already saved
                                const isAlreadySaved = savedLocations.some(
                                  (saved) => saved.id === location.id
                                );
                                if (!isAlreadySaved) {
                                  saveLocation(location);
                                } else {
                                  // If already saved, we could potentially remove it
                                  // For now, just show notification that it's already saved
                                  showNotification(
                                    "Location already saved!",
                                    "info"
                                  );
                                }
                              }}
                              title={
                                savedLocations.some(
                                  (saved) => saved.id === location.id
                                )
                                  ? "Saved"
                                  : "Save"
                              }
                            >
                              <svg
                                className="w-6 h-6"
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
                          </div>
                        </div>
                      ) : (
                        <button className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium">
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User Location Marker */}
          {hasUserLocation && userLocation && (
            <Marker
              key="user-location"
              position={userLocation}
              icon={createUserLocationMarker()}
            >
              <Popup className="custom-popup">
                <div className="p-4">
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    Your Location
                  </h3>
                  <p className="text-gray-600 mb-3">
                    This is your current location.
                  </p>
                  <div className="text-sm text-gray-500">
                    <div>Latitude: {userLocation[0].toFixed(6)}</div>
                    <div>Longitude: {userLocation[1].toFixed(6)}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Points of Interest Layer */}
          {showPoiLayer &&
            pois.map((poi) => (
              <Marker
                key={`poi-${poi.id}`}
                position={poi.position}
                icon={createPOIMarker(poi.type, poi.name)}
                eventHandlers={{
                  click: () => {
                    addRecentLocation(poi); // Add POI to recents when popup opens
                    setActivePopup(`poi-${poi.id}`);
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-6 min-w-[400px] max-w-[500px]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-2xl text-gray-800">
                          {poi.name}
                        </h3>
                        <p className="text-gray-600 text-base mt-1">
                          {poi.type.replace("_", " ")}
                        </p>
                      </div>
                      <button
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
                        onClick={() => {
                          // Close popup
                          if (mapRef.current) {
                            mapRef.current.closePopup();
                          }
                        }}
                        title="Close"
                      >
                        <svg
                          className="w-6 h-6"
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
                    <div className="space-y-2 text-base text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium capitalize">
                          {poi.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium">
                          {poi.position[0].toFixed(4)},{" "}
                          {poi.position[1].toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          savedLocations.some(
                            (saved) => saved.id === `poi-${poi.id}`
                          )
                            ? "bg-green-100 text-green-600"
                            : "hover:bg-gray-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent popup from closing

                          // Convert POI to location format for saving
                          const poiLocation = {
                            id: `poi-${poi.id}`,
                            title: poi.name,
                            description: `${poi.type.replace(
                              "_",
                              " "
                            )} at this location`,
                            position: poi.position,
                            postedBy: "OpenStreetMap",
                            category: "poi",
                            datePosted: new Date().toISOString(),
                            type: "poi",
                          };

                          // Check if location is already saved
                          const isAlreadySaved = savedLocations.some(
                            (saved) => saved.id === `poi-${poi.id}`
                          );
                          if (!isAlreadySaved) {
                            saveLocation(poiLocation);
                          } else {
                            showNotification("POI already saved!", "info");
                          }
                        }}
                        title={
                          savedLocations.some(
                            (saved) => saved.id === `poi-${poi.id}`
                          )
                            ? "Saved"
                            : "Save"
                        }
                      >
                        <svg
                          className="w-6 h-6"
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
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
        {/* Floating UI Elements */}
        {/* Add Post Button - Bottom Center */}
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg text-center transition-colors duration-200 ease-in-out">
            <p className="font-semibold text-lg">
              {isAuthenticated
                ? "💡 Click anywhere on the map to add a post!"
                : "💡 Login to add a post to the map!"}
            </p>
          </div>
        </motion.div>
        {/* Static Icon Sidebar */}
        <div className="absolute left-0 top-0 h-full w-20 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[1000] flex flex-col items-center py-4 space-y-3">
          <button
            className={`p-3 rounded-xl transition-all duration-200 ${
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
              className="w-6 h-6"
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
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "map-settings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(
                activeSidebarTab === "map-settings" ? "" : "map-settings"
              )
            }
            title="Map Settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276a1 1 0 001.447-.894V5.618a1 1 0 00-1.447-.894L15 7m0 13v-3m0-4H9m4 0V9m0 0H9m4 0v4m0 4h.01"
              />
            </svg>
          </button>

          <button
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeSidebarTab === "pois"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() =>
              setActiveSidebarTab(activeSidebarTab === "pois" ? "" : "pois")
            }
            title="Points of Interest"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            className={`p-3 rounded-xl transition-all duration-200 ${
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
              className="w-6 h-6"
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
            className={`p-3 rounded-xl transition-all duration-200 ${
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
              className="w-6 h-6"
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
            className={`p-3 rounded-xl transition-all duration-200 ${
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
              className="w-6 h-6"
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
          {activeSidebarTab === "explore" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Explore</h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
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
                      <span>Show Only My Posts</span>
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

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Posts & Locations
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      <AnimatePresence>
                        {filteredLocations.length > 0 ? (
                          filteredLocations.map((location, index) => (
                            <motion.div
                              key={location.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
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
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full mt-2 ${
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
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">
                                    {location.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {location.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
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
                          <div className="text-center py-8">
                            {filterMine && isAuthenticated ? (
                              <div className="text-gray-500">
                                <p className="text-lg">
                                  You haven't posted anything yet
                                </p>
                                <p className="text-sm mt-2 text-gray-400">
                                  Start by clicking anywhere on the map to
                                  create your first post!
                                </p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <p>No matching posts found</p>
                                <p className="text-sm mt-2">
                                  Try a different search term
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeSidebarTab === "map-settings" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Map Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Map Layout
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(mapLayouts).map(([key, layout]) => (
                        <button
                          key={key}
                          className={`text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                            mapLayout === key
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => {
                            setMapLayout(key);
                            // Save preference to localStorage
                            localStorage.setItem("mapLayout", key);
                          }}
                        >
                          {layout.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeSidebarTab === "pois" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Points of Interest
                </h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <span>Show POIs</span>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          showPoiLayer ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        onClick={() => setShowPoiLayer(!showPoiLayer)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            showPoiLayer ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Nearby POIs
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pois.slice(0, 20).map((poi) => (
                        <div
                          key={`poi-${poi.id}`}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          onClick={() => {
                            if (mapRef.current) {
                              mapRef.current.flyTo(poi.position, 15);
                              setActivePopup(`poi-${poi.id}`);
                            }
                          }}
                        >
                          <h4 className="font-medium text-gray-800">
                            {poi.name}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {poi.type.replace("_", " ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeSidebarTab === "stats" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Statistics</h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
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
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeSidebarTab === "saved" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Saved Locations
                </h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {savedLocations.length > 0 ? (
                    <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                      {savedLocations.map((location, index) => (
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
                                          ? location.postedBy.name ||
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
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="Remove from saved"
                            >
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
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
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
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeSidebarTab === "recents" && (
            <motion.div
              className="absolute left-20 top-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/30 z-[999] flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Recent Locations
                </h2>
                <button
                  onClick={() => setActiveSidebarTab("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
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
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {recentLocations.length > 0 ? (
                    <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                      {recentLocations.map((location, index) => (
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
                                      ? location.postedBy.name ||
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
                    </div>
                  )}
                </div>
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4">
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl sm:max-w-3xl max-h-[90vh] overflow-y-auto transition-transform duration-300 ease-in-out"
                initial={{ scale: 0.98, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 20 }}
              >
                {/* Submitting overlay */}
                {submitting && (
                  <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <div className="text-gray-700 font-medium">Creating post — please wait...</div>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Create new post
                    </h2>
                    <button
                      onClick={closeForm}
                      className="text-gray-500 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
                      aria-label="Close create post"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-gray-700 mb-2 font-medium"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out outline-none"
                          placeholder="Enter a descriptive title"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 mb-2 font-medium"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out outline-none"
                        >
                          <option value="general">General</option>
                          <option value="nature">Nature</option>
                          <option value="culture">Culture</option>
                          <option value="shopping">Shopping</option>
                          <option value="food">Food & Drinks</option>
                          <option value="event">Event</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-gray-700 mb-2 font-medium"
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
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out outline-none resize-none"
                          placeholder="Describe this location..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 mb-2 font-medium">
                          Images (optional — up to 10)
                        </label>

                        {/* URL input (optional) */}
                        <div className="mb-3">
                          <input
                            type="text"
                            id="image"
                            name="image"
                            value={typeof formData.image === "string" ? formData.image : ""}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out outline-none"
                            placeholder="Or paste an image URL (optional)"
                          />
                          <p className="text-xs text-gray-500 mt-1">You can either paste a URL or upload images below.</p>
                        </div>

                        {/* Upload area */}
                        <div className="flex items-start gap-4">
                          <div
                            className="flex-1 border-2 border-dashed rounded-2xl p-4 flex items-center justify-center cursor-pointer hover:border-blue-300 transition"
                            onClick={handleAddButtonClick}
                          >
                            <div className="text-center">
                              <svg className="mx-auto mb-2 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 014-4h10a4 4 0 110 8H7a4 4 0 01-4-4zM7 11V7m0 0L5 9m2-2l2 2" />
                              </svg>
                              <div className="text-sm text-gray-700 font-medium">Click to add images</div>
                              <div className="text-xs text-gray-400">JPG, PNG, GIF — up to 5MB each</div>
                            </div>
                          </div>

                          <div className="w-28">
                            <button
                              type="button"
                              onClick={handleAddButtonClick}
                              disabled={images.length >= 10}
                              className={`w-full px-3 py-2 rounded-xl text-white font-medium ${images.length >= 10 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              Add
                            </button>
                          </div>

                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        </div>

                        {errors.image && <p className="text-red-500 text-sm mt-2">{errors.image}</p>}

                        <div className="mt-3 mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Selected</span>
                            <span>{images.length}/10</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(images.length / 10) * 100}%` }} />
                          </div>
                        </div>

                        {images.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {images.map((image, idx) => (
                              <div key={image.id} className="relative rounded-lg overflow-hidden h-24 bg-gray-100">
                                <img src={image.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(image.id)}
                                  className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-600 hover:bg-white"
                                  aria-label={`Remove image ${idx + 1}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
                        <p>
                          ℹ️ Your post will be automatically associated with
                          your account. No need to enter your name.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <p className="text-sm text-blue-800 font-medium">
                            📍 Selected Location
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            {clickPosition
                              ? `Latitude: ${clickPosition[0].toFixed(
                                  6
                                )}, Longitude: ${clickPosition[1].toFixed(6)}`
                              : "No location selected"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="flex-1 bg-gray-100 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-200 transition transform duration-150 hover:scale-105 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 py-3 px-4 rounded-xl transition transform duration-150 hover:scale-105 active:scale-95 font-medium shadow-md ${submitting ? 'bg-blue-400 text-white cursor-wait opacity-80' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Creating...
                          </div>
                        ) : (
                          'Create Post'
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
              className="fixed inset-0 bg-gradient-to-br from-blue-400/40 via-purple-500/40 to-indigo-600/40 backdrop-blur-md z-[2000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4">
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
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          max-width: 500px;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          width: auto !important;
          min-width: 400px;
          max-width: 500px;
        }

        .leaflet-container {
          font-family: "Inter", sans-serif;
        }

        .leaflet-popup-tip {
          box-shadow: none;
        }

        .leaflet-popup-close-button {
          display: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Ensure the map controls are above the floating UI */
        .leaflet-control-container {
          z-index: 999;
        }

        /* Custom POI marker styles */
        .custom-poi-marker {
          text-align: center;
          font-weight: bold;
          cursor: pointer;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .custom-popup .leaflet-popup-content-wrapper {
            max-width: 350px;
          }
          .custom-popup .leaflet-popup-content {
            min-width: 300px;
            max-width: 350px;
          }
        }
      `}</style>
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
