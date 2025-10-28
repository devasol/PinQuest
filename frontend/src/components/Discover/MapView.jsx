import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "../Landing/Header/Header";

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
    iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
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

const MapView = () => {
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
  const [userLocation, setUserLocation] = useState([51.505, -0.09]); // Default location
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const mapRef = useRef();

  // Sample initial locations data
  const initialLocations = [
    {
      id: 1,
      position: [51.505, -0.09],
      title: "Central Park",
      description: "Beautiful urban park with walking trails and scenic views",
      type: "park",
      category: "nature",
      postedBy: "System",
      datePosted: new Date().toISOString(),
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    },
    {
      id: 2,
      position: [51.51, -0.08],
      title: "City Museum",
      description: "Historical artifacts and cultural exhibitions",
      type: "museum",
      category: "culture",
      postedBy: "System",
      datePosted: new Date().toISOString(),
      image:
        "https://images.unsplash.com/photo-1596383513331-ec1d8e97a5b5?w=400",
    },
    {
      id: 3,
      position: [51.5, -0.1],
      title: "Shopping District",
      description: "Modern shopping center with various brands",
      type: "shopping",
      category: "shopping",
      postedBy: "System",
      datePosted: new Date().toISOString(),
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    },
  ];

  useEffect(() => {
    // Function to get user's location
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            setHasUserLocation(true);
            
            // Fly to user location when map is loaded and location is available
            if (mapRef.current) {
              mapRef.current.flyTo([latitude, longitude], 15);
            }
          },
          (error) => {
            console.error("Error getting user location:", error);
            // Use default location if geolocation fails
            setHasUserLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0, // Do not use cached position
          }
        );
      } else {
        console.log("Geolocation is not supported by this browser.");
        setHasUserLocation(false);
      }
    };

    // Load posts from localStorage on component mount
    const savedPosts = localStorage.getItem("userPosts");
    if (savedPosts) {
      setUserPosts(JSON.parse(savedPosts));
    }

    // Get user location
    getUserLocation();
  }, []);

  // Combine initial locations with user posts
  const allLocations = [...initialLocations, ...userPosts];

  const filteredLocations = allLocations.filter(
    (location) =>
      location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMapClick = (e) => {
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

    const newPost = {
      id: Date.now(), // Simple ID generation
      position: clickPosition,
      title: formData.title,
      description: formData.description,
      image: formData.image,
      postedBy: formData.postedBy,
      category: formData.category,
      datePosted: new Date().toISOString(),
      type: "user-post",
    };

    try {
      // For demo purposes, we'll use localStorage
      // In a real app, you would send this to your backend
      const updatedPosts = [...userPosts, newPost];
      setUserPosts(updatedPosts);
      localStorage.setItem("userPosts", JSON.stringify(updatedPosts));

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
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating post");
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
      mapRef.current.flyTo(position, 15); // Zoom level 15 for better focus
    }
  };

  const handleSidebarItemClick = (locationId) => {
    const location = allLocations.find(loc => loc.id === locationId);
    if (location) {
      setActivePopup(locationId);
      flyToLocation(location.position);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-8 mt-12">
            <motion.h1
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Community Map
            </motion.h1>
            <motion.p
              className="text-lg text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Discover amazing places and share your own discoveries with the
              community
            </motion.p>
          </div>

        {/* Search Bar */}
        <motion.div
          className="max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
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
              placeholder="Search locations, descriptions, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-2xl bg-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Locations List */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Community Posts
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {allLocations.length} locations
                </span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {filteredLocations.map((location, index) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        activePopup === location.id
                          ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
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
                          <p className="text-sm text-gray-600 mt-1">
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
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Map Container */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500">
                <div className="bg-white rounded-xl overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <p className="text-sm text-gray-700 font-medium">
                      💡 Click anywhere on the map to add a post!
                    </p>
                  </div>
                  <MapContainer
                    center={userLocation}
                    zoom={13}
                    style={{ height: "600px", width: "100%" }}
                    className="rounded-xl"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler onMapClick={handleMapClick} />
                    <MapRefHandler mapRef={mapRef} />

                    {filteredLocations.map((location) => (
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
                                <span className="font-medium">
                                  {location.postedBy}
                                </span>
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
                    ))}
                    
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
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {allLocations.length}
            </div>
            <div className="text-gray-600">Total Locations</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {userPosts.length}
            </div>
            <div className="text-gray-600">User Posts</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {new Set(allLocations.map((l) => l.category)).size}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-gray-600">Live Updates</div>
          </div>
        </motion.div>

        {/* Post Creation Form Modal */}
        <AnimatePresence>
          {showPostForm && (
            <>
              {/* Backdrop - amazing gradient background */}
              <motion.div
                className="fixed inset-0 bg-gradient-to-br from-blue-400/40 via-purple-500/40 to-indigo-600/40 backdrop-blur-md z-[1000]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeForm}
              />

              {/* Modal Content */}
              <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
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

        {/* Footer */}
        <motion.div
          className="text-center mt-12 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <p>
            Click anywhere on the map to add a post • Drag to explore • Click
            markers for details
          </p>
        </motion.div>
        </motion.div>
      </div>

      {/* Custom CSS for additional styling */}
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

        /* Ensure the map controls are above the modal */
        .leaflet-control-container {
          z-index: 999;
        }
        
        /* Responsive adjustments for popups */
        @media (max-width: 768px) {
          .custom-popup .leaflet-popup-content-wrapper {
            max-width: 350px;
          }
          .custom-popup .leaflet-popup-content {
            min-width: 300px;
            max-width: 350px;
          }
        }
        
        /* Adjust header for mobile */
        @media (max-width: 768px) {
          nav .hidden.md\\:block {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
