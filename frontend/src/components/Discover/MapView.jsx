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
import Header from "../Landing/Header/Header";
import { useAuth } from "../../contexts/AuthContext.jsx";

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different types
const createCustomIcon = (color = "blue") => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Custom icon for user location
const createUserLocationIcon = () => {
  return new L.Icon({
    iconUrl:
      "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    popupAnchor: [0, -46],
    shadowSize: [41, 41],
  });
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
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  return null;
}

// Component to handle geocoding (search) events
function Geocoder({ searchQuery, setSearchQuery, mapRef, setSuggestions, suggestions, setIsSearching }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (searchQuery.trim().length > 2) {
      timeoutId = setTimeout(async () => {
        setIsSearching(true); // Indicate that we're searching globally
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
          );
          const results = await response.json();
          setSuggestions(results.map(result => ({
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
          })));
          setIsOpen(true);
        } catch (error) {
          console.error('Geocoding error:', error);
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
              <div className="font-medium text-gray-800">{suggestion.display_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MapView = () => {
  const { isAuthenticated } = useAuth();
  const [activePopup, setActivePopup] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    postedBy: "",
    category: "general",
  });
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef();



  // Fetch posts from the backend API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/posts`, {
          headers
        });
        const result = await response.json();
        
        if (result.status === "success") {
          // Transform the API data to match the format expected by the frontend
          // and filter out posts with invalid location data
          const transformedPosts = result.data
            .filter(post => {
              // Check if the post has valid location data
              return post.location && 
                     typeof post.location.latitude === 'number' && 
                     typeof post.location.longitude === 'number' &&
                     !isNaN(post.location.latitude) && 
                     !isNaN(post.location.longitude);
            })
            .map(post => ({
              id: post._id,
              title: post.title,
              description: post.description,
              image: post.image,
              postedBy: post.postedBy,
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
      }
    };

    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            setHasUserLocation(true);

            if (mapRef.current) {
              mapRef.current.flyTo([latitude, longitude], 15);
            }
          },
          (error) => {
            console.error("Error getting user location:", error);
            setHasUserLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
        setHasUserLocation(false);
      }
    };

    fetchPosts();
    getUserLocation();
  }, []);

  // All locations are now from the database
  const allLocations = userPosts;

  // Filter posts based on search query
  const filteredLocations = allLocations.filter(
    (location) =>
      location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleMapClick = (e) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setClickPosition([e.latlng.lat, e.latlng.lng]);
    setShowPostForm(true);
    setFormData({
      title: "",
      description: "",
      image: "",
      postedBy: "",
      category: "general",
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare the post data with location
      const postData = {
        title: formData.title,
        description: formData.description,
        image: formData.image,
        postedBy: formData.postedBy,
        category: formData.category,
        location: {
          latitude: parseFloat(clickPosition[0]),
          longitude: parseFloat(clickPosition[1])
        }
      };

      // Prepare headers with auth token
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Send the post to the backend
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (result.status === "success") {
        // Add the new post to the local state
        const newPost = {
          id: result.data._id, // Use the ID from the database
          position: [parseFloat(result.data.location.latitude), parseFloat(result.data.location.longitude)],
          title: formData.title,
          description: formData.description,
          image: formData.image,
          postedBy: formData.postedBy,
          category: result.data.category || formData.category,
          datePosted: result.data.datePosted,
          type: "user-post",
        };
        
        setUserPosts(prevPosts => [...prevPosts, newPost]);
        
        alert("Post created successfully!");
        setShowPostForm(false);
        setClickPosition(null);
        setFormData({
          title: "",
          description: "",
          image: "",
          postedBy: "",
          category: "general",
        });
      } else {
        console.error("Error creating post:", result.message);
        alert("Error creating post: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating post. Please try again.");
    }
  };

  const closeForm = () => {
    setShowPostForm(false);
    setClickPosition(null);
  };

  const getIconByCategory = (category) => {
    const iconColors = {
      nature: "green",
      culture: "orange",
      shopping: "purple",
      food: "red",
      event: "pink",
      general: "blue",
    };
    return createCustomIcon(iconColors[category] || "blue");
  };

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
        {/* Map */}
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="absolute inset-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />
          <MapRefHandler mapRef={mapRef} />

          {filteredLocations.map((location) => {
            // Check if location.position is valid before creating the marker
            if (!location.position || !Array.isArray(location.position) || 
                location.position.length !== 2 || 
                typeof location.position[0] !== 'number' || 
                typeof location.position[1] !== 'number' ||
                isNaN(location.position[0]) || isNaN(location.position[1])) {
              console.warn(`Invalid location position for post ${location.id}:`, location.position);
              return null; // Skip rendering this marker if location is invalid
            }
            
            return (
              <Marker
                key={location.id}
                position={location.position}
                icon={getIconByCategory(location.category)}
                eventHandlers={{
                  click: () => handleSidebarItemClick(location.id),
                }}
              >
                <Popup
                  className="custom-popup"
                  onOpen={() => setActivePopup(location.id)}
                  onClose={() => setActivePopup(null)}
                >
                  <div className="p-6 min-w-[400px] max-w-[500px]">
                    {location.image && (
                      <img
                        src={location.image}
                        alt={location.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <h3 className="font-bold text-2xl text-gray-800 mb-3">
                      {location.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-base">
                      {location.description}
                    </p>
                    <div className="space-y-2 text-base text-gray-500">
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
                    <button className="mt-6 w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium">
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User Location Marker */}
          {hasUserLocation && (
            <Marker
              key="user-location"
              position={userLocation}
              icon={createUserLocationIcon()}
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
        </MapContainer>
        {/* Floating UI Elements */}
        {/* Search Bar - Top Center */}
        {/* Floating UI Elements */}
        {/* Search Bar - Top Center */}
        <motion.div
          className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-2xl px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Geocoder
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            mapRef={mapRef}
            setSuggestions={setSuggestions}
            suggestions={suggestions}
            setIsSearching={setIsSearching}
          />
        </motion.div>
        {/* Toggle Sidebar Button */}
        <motion.button
          className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-2xl hover:bg-white transition-all duration-300"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </motion.button>
        {/* Collapsible Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              className="absolute top-20 left-6 z-[1000] w-80 max-h-[70vh] overflow-hidden"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Community Posts
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {allLocations.length} locations
                    </span>
                  </div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
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
                            onClick={() => handleSidebarItemClick(location.id)}
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
                        <div className="text-center py-8 text-gray-500">
                          <p>No matching posts found</p>
                          <p className="text-sm mt-2">Try a different search term</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Stats Panel - Top Right */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              className="absolute top-20 right-6 z-[1000]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 1 }}
            >
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {allLocations.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {userPosts.length}
                    </div>
                    <div className="text-sm text-gray-600">User Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {new Set(allLocations.map((l) => l.category)).size}
                    </div>
                    <div className="text-sm text-gray-600">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      24/7
                    </div>
                    <div className="text-sm text-gray-600">Live Updates</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Add Post Button - Bottom Center */}
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-center backdrop-blur-sm">
            <p className="font-semibold text-lg">
              {isAuthenticated 
                ? "💡 Click anywhere on the map to add a post!"
                : "💡 Login to add a post to the map!"}
            </p>
          </div>
        </motion.div>
        {/* Toggle Stats Button */}
        <motion.button
          className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-2xl hover:bg-white transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          onClick={() => setShowStats(!showStats)}
        >
          <svg
            className="w-6 h-6 text-gray-700"
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
        </motion.button>
      </div>
      {/* Post Creation Form Modal */}
      <AnimatePresence>
        {showPostForm && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-gradient-to-br from-blue-400/40 via-purple-500/40 to-indigo-600/40 backdrop-blur-md z-[2000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4">
              <motion.div
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-full max-w-md max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Create New Post
                    </h2>
                    <button
                      onClick={closeForm}
                      className="text-gray-500 hover:text-gray-700 text-2xl transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      &times;
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          placeholder="Describe this location..."
                        />
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 mb-2 font-medium"
                          htmlFor="image"
                        >
                          Image URL
                        </label>
                        <input
                          type="url"
                          id="image"
                          name="image"
                          value={formData.image}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-gray-700 mb-2 font-medium"
                          htmlFor="postedBy"
                        >
                          Your Name *
                        </label>
                        <input
                          type="text"
                          id="postedBy"
                          name="postedBy"
                          value={formData.postedBy}
                          onChange={handleFormChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          placeholder="Enter your name"
                        />
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
                        className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-400 transition-all duration-300 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                      >
                        Create Post
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
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Authentication Required
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    You need to be logged in to add pins to the map. Please login to continue.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowLoginModal(false);
                        window.location.href = '/login';
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
      <style jsx global>{`
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
    </div>
  );
};

export default MapView;
