import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../Landing/Header/Header';
import CustomMarker from './CustomMarker';
import PostWindow from '../PostWindow';
import { Search, Filter, MapPin, Heart, Star, Grid3X3, ThumbsUp, X, SlidersHorizontal, Navigation } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Custom hook for map events
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
    }
  });
  return null;
};

const DiscoverMain = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('street'); // street, satellite, terrain
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [rating, setRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showListings, setShowListings] = useState(false);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [mobileView, setMobileView] = useState('map'); // 'map' or 'list' for mobile
  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch posts from the backend API
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the API data to match the format expected by the frontend
        // Handle both location formats: coordinates array and latitude/longitude fields
        const transformedPosts = result.data
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
              id: post._id,
              title: post.title || "Untitled",
              description: post.description || "No description provided",
              image: post.image,
              images: post.images || [],
              averageRating: post.averageRating || 0,
              totalRatings: post.totalRatings || 0,
              postedBy: post.postedBy?.name || post.postedBy || "Unknown",
              category: post.category || "general",
              datePosted: post.datePosted || new Date().toISOString(),
              position: position, // [lat, lng] format for Leaflet
              price: post.price || 0,
              tags: post.tags || [],
              comments: post.comments || [],
            };
          });
        
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
    if (isAuthenticated && user) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.data?.savedLocations)) {
            setSavedLocations(result.data.savedLocations);
          }
        }
      } catch (err) {
        console.error("Error fetching saved locations:", err);
      }
    }
  }, [isAuthenticated, user, API_BASE_URL]);

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchSavedLocations()]);
      setLoading(false);
    };
    
    initialFetch();

    // Set up periodic refresh every 30 seconds
    fetchIntervalRef.current = setInterval(() => {
      fetchPosts();
      if (isAuthenticated) {
        fetchSavedLocations();
      }
    }, 30000);
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchPosts, fetchSavedLocations, isAuthenticated]);

  // Apply filters when search query, category, or other filters change
  useEffect(() => {
    let result = [...posts];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.description.toLowerCase().includes(query) ||
        post.postedBy.toLowerCase().includes(query) ||
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Default to world view if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    }
  }, []);

  // Fly to a post's location on the map
  const flyToPost = useCallback((position) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 15);
    }
  }, []);

  // Save a location
  const saveLocation = async (post) => {
    if (!isAuthenticated) {
      alert('Please login to save locations');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/saved-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: post.id,
          name: post.title,
          description: post.description,
          position: post.position,
          category: post.category,
          datePosted: post.datePosted,
          postedBy: post.postedBy
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          fetchSavedLocations(); // Refresh saved locations
          // Show success feedback
        }
      } else {
        alert('Failed to save location');
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

  // Get directions to a location
  const getDirections = useCallback((position) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Try to get user's current location for directions
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Using Google Maps for directions (fallback to a simple approach if needed)
        // You could also use other routing options like Mapbox or OpenStreetMap routing
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${position[0]},${position[1]}`;
        window.open(directionsUrl, '_blank');
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        // Fallback: just center the map on the destination
        flyToPost(position);
        alert('Could not get your location. Centering map on destination instead.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [flyToPost]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl font-medium text-gray-700">Discovering amazing places...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Discover Page</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
      
      {/* Full Screen Map Container - Positioned below header */}
      <div className="relative w-full h-[100vh] pt-16"> {/* pt-16 adds padding equal to header height */}
        {/* Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={getTileLayerUrl()}
          />
          
          <MapClickHandler onMapClick={(latlng) => {
            // Handle map click
          }} />
          
          {/* Render custom markers for each post */}
          {filteredPosts.map((post) => (
            <CustomMarker 
              key={post.id} 
              post={post}
              onSave={saveLocation}
              isSaved={savedLocations.some(loc => loc.id === post.id)}
              onGetDirections={getDirections}
              onClick={(post) => {
                setSelectedPost(post);
                // Handle click on marker
                console.log('Marker clicked for post:', post.title);
              }}
            />
          ))}
        </MapContainer>
        
        {/* Top Controls Overlay - Positioned below header */}
        <div className="absolute top-20 left-4 right-4 z-[1000] max-w-4xl mx-auto flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for locations, categories, or keywords..."
                className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Mobile View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowListings(!showListings)}
                className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors sm:hidden"
              >
                <MapPin className="h-4 w-4" />
                {showListings ? 'Map' : 'List'}
              </button>
            </div>
          </div>
          
          {/* Category Filter Bar */}
          <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Map Controls Overlay - Top Right */}
        <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors"
          >
            {viewMode === 'grid' ? <Grid3X3 className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors"
          >
            {mapType === 'street' ? 'Satellite' : 'Street'}
          </button>
        </div>
        
        {/* Listing Panel - Side Panel on Desktop, Bottom Panel on Mobile */}
        {showListings && (
          <div className="absolute top-16 right-0 h-[calc(100vh-4rem)] w-full sm:w-96 bg-white/95 backdrop-blur-sm shadow-2xl z-[999] transform transition-transform duration-300 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white/90 backdrop-blur-sm z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Discoveries ({filteredPosts.length})</h2>
              <button 
                onClick={() => setShowListings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
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
                  
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
            
            {/* Listings */}
            <div className="p-4 space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                  onClick={() => {
                    setSelectedPost(post);
                    flyToPost(post.position);
                    setShowListings(false); // Close the panel after selection
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(post.averageRating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-sm text-gray-600">
                              {post.averageRating.toFixed(1)} ({post.totalRatings})
                            </span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-500">by {post.postedBy}</span>
                          {isAuthenticated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveLocation(post);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Heart className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No places found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Post Window Modal */}
      <PostWindow
        post={selectedPost}
        currentUser={isAuthenticated ? user : null}
        authToken={isAuthenticated ? localStorage.getItem('token') : null}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={(postId, isLiked) => {
          // Update the posts state in DiscoverMain if needed
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => ({
              ...prev,
              likes: isLiked 
                ? [...(prev.likes || []), { user: user?._id }] 
                : (prev.likes || []).filter(like => like.user !== user?._id),
              likesCount: isLiked ? (prev.likesCount || 0) + 1 : (prev.likesCount || 0) - 1
            }));
          }
        }}
        onComment={(postId) => {
          console.log('Comment clicked for post:', postId);
          // Handle comment click if needed
        }}
      />
    </div>
  );
};

export default DiscoverMain;