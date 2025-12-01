import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../Landing/Header/Header';
import CustomMarker from './CustomMarker';
import PostWindow from '../PostWindow/PostWindow';
import CurrentLocationMarker from './CurrentLocationMarker';
import { Search, Filter, MapPin, Heart, Star, Grid3X3, ThumbsUp, X, SlidersHorizontal, Navigation, Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Custom hook for map events
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng);
      
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
  const [savedLocations, setSavedLocations] = useState([]);
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
  }, [selectedPost, user]);

  const handlePostSave = useCallback((postId, isSaved) => {
    // Update saved locations when a post is bookmarked/unbookmarked
    if (isSaved) {
      // Add to saved locations if not already there
      setSavedLocations(prev => {
        if (!prev.some(loc => loc.id === postId)) {
          // Create a proper saved location object
          const postToAdd = posts.find(p => p._id === postId);
          if (postToAdd) {
            return [...prev, {
              id: postId,
              name: postToAdd.title,
              description: postToAdd.description,
              position: postToAdd.position,
              category: postToAdd.category,
              datePosted: postToAdd.datePosted,
              postedBy: postToAdd.postedBy
            }];
          } else {
            return [...prev, { id: postId }];
          }
        }
        return prev;
      });
    } else {
      // Remove from saved locations
      setSavedLocations(prev => prev.filter(loc => loc.id !== postId));
    }
  }, [posts]);

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
              location: post.location || {}, // Preserve full location object
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
    // Fetch saved locations in background (not blocking)
    if (isAuthenticated) {
      setTimeout(() => {
        fetchSavedLocations(); // Run in background to avoid blocking
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
    let watchId;
    
    if (navigator.geolocation) {
      // Try to get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
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
      
      // Watch for position updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
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
    }
    
    // Cleanup function to stop watching position
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
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
      // Check if the post is already saved
      const isAlreadySaved = savedLocations.some(loc => loc.id === post.id);
      
      if (isAlreadySaved) {
        // If already saved, remove it
        const response = await fetch(`${API_BASE_URL}/users/saved-locations/${post.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update local state
          setSavedLocations(prev => prev.filter(loc => loc.id !== post.id));
          // Call onSave callback to update parent component
          onSave && onSave(post.id, false);
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
            // Update local state
            setSavedLocations(prev => [
              ...prev,
              {
                id: post.id,
                name: post.title,
                description: post.description,
                position: post.position,
                category: post.category,
                datePosted: post.datePosted,
                postedBy: post.postedBy
              }
            ]);
            // Call onSave callback to update parent component
            onSave && onSave(post.id, true);
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
      alert('You have no saved locations yet!');
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
        
        // Optionally animate to the new location
        if (mapRef.current) {
          mapRef.current.flyTo(userPos, 15);
        }
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        alert('Could not get your current location. Make sure location services are enabled.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

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
          
          {/* Render custom markers for each post */}
          {filteredPosts.map((post) => {
            // Determine if the current user has liked this post based on the likes array
            const userHasLiked = post.likes?.some(like => 
              like.user && 
              (like.user._id === user?._id || 
               (typeof like.user === 'string' && like.user === user?._id) ||
               (typeof like.user === 'object' && like.user._id === user?._id))
            );
            
            // Check if this post is also in the saved locations to avoid duplicate markers
            const isSaved = savedLocations.some(loc => loc.id === post.id);
            
            return (
              <CustomMarker 
                key={`post-${post.id}`} 
                post={post}
                isLiked={userHasLiked}
                onSave={saveLocation}
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
        </MapContainer>
        
        {/* Top Banner - Shown when saved locations are displayed */}
        {isAuthenticated && showSavedLocationsOnMap && (
          <div className="absolute top-16 left-0 right-0 z-[999] mx-auto max-w-md">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-center py-2 px-4 rounded-lg shadow-lg mx-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 fill-current" />
                <span className="font-semibold">Showing Saved Locations</span>
              </div>
              <button 
                onClick={() => setShowSavedLocationsOnMap(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
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
        
        {/* Sidebar with icons */}
        <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
          {/* Main control icons */}
          <button
            onClick={() => document.getElementById('filter-window')?.classList.toggle('hidden')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors flex items-center justify-center"
            title="Filters"
          >
            <SlidersHorizontal className="h-6 w-6 text-gray-700" />
          </button>
          
          <button
            onClick={() => {
              setViewMode(viewMode === 'grid' ? 'list' : 'grid');
              document.getElementById('view-mode-window')?.classList.toggle('hidden');
            }}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors flex items-center justify-center"
            title="View Mode"
          >
            {viewMode === 'grid' ? <Grid3X3 className="h-6 w-6 text-gray-700" /> : <ThumbsUp className="h-6 w-6 text-gray-700" />}
          </button>
          
          <button
            onClick={() => document.getElementById('map-type-window')?.classList.toggle('hidden')}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:bg-white transition-colors flex items-center justify-center"
            title="Map Type"
          >
            <MapPin className="h-6 w-6 text-gray-700" />
          </button>
          
          <button
            onClick={() => document.getElementById('saved-locations-window')?.classList.toggle('hidden')}
            className={`w-14 h-14 rounded-xl shadow-lg border transition-colors flex items-center justify-center ${
              showSavedLocationsOnMap 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-500' 
                : 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white'
            }`}
            title={isAuthenticated ? `${showSavedLocationsOnMap ? 'Hide' : 'Show'} saved locations` : 'Login to view saved locations'}
          >
            <Bookmark className={`h-6 w-6 ${showSavedLocationsOnMap ? 'fill-current' : ''}`} />
          </button>
          
          {userLocation && (
            <button
              onClick={updateUserLocation}
              className="w-14 h-14 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              title="My Location"
            >
              <Navigation className="h-6 w-6" />
            </button>
          )}
        </div>
        
        {/* Control Windows - Positioned next to sidebar */}
        {/* Filter Window */}
        <div id="filter-window" className="hidden absolute top-20 right-20 z-[999] w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Filters</h3>
            <button 
              onClick={() => document.getElementById('filter-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
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
              onClick={() => document.getElementById('filter-window')?.classList.add('hidden')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* View Mode Window */}
        <div id="view-mode-window" className="hidden absolute top-20 right-20 z-[999] w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">View Mode</h3>
            <button 
              onClick={() => document.getElementById('view-mode-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => {
                setViewMode('grid');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 ${
                viewMode === 'grid' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Grid3X3 className="h-6 w-6 text-gray-700" />
              <div className="text-left">
                <div className="font-semibold text-gray-800">Grid View</div>
                <div className="text-sm text-gray-600">Display posts in a grid layout</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setViewMode('list');
                document.getElementById('view-mode-window')?.classList.add('hidden');
              }}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 ${
                viewMode === 'list' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsUp className="h-6 w-6 text-gray-700" />
              <div className="text-left">
                <div className="font-semibold text-gray-800">List View</div>
                <div className="text-sm text-gray-600">Display posts in a list layout</div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Map Type Window */}
        <div id="map-type-window" className="hidden absolute top-20 right-20 z-[999] w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Map Type</h3>
            <button 
              onClick={() => document.getElementById('map-type-window')?.classList.add('hidden')}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => {
                setMapType('street');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              className={`w-full p-4 rounded-xl border-2 ${
                mapType === 'street' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">Street Map</div>
              <div className="text-sm text-gray-600">Standard road map view</div>
            </button>
            
            <button
              onClick={() => {
                setMapType('satellite');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              className={`w-full p-4 rounded-xl border-2 ${
                mapType === 'satellite' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">Satellite View</div>
              <div className="text-sm text-gray-600">Satellite imagery view</div>
            </button>
            
            <button
              onClick={() => {
                setMapType('terrain');
                document.getElementById('map-type-window')?.classList.add('hidden');
              }}
              className={`w-full p-4 rounded-xl border-2 ${
                mapType === 'terrain' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">Terrain View</div>
              <div className="text-sm text-gray-600">Topographical view</div>
            </button>
          </div>
        </div>
        
        {/* Saved Locations Window */}
        <div id="saved-locations-window" className="hidden absolute top-20 right-20 z-[999] w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Saved Locations</h3>
            <button 
              onClick={() => {
                document.getElementById('saved-locations-window')?.classList.add('hidden');
                setShowSavedLocationsOnMap(false);
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="space-y-3">
            {savedLocations.length > 0 ? (
              savedLocations.map((location) => (
                <div 
                  key={location.id} 
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      if (location.position) {
                        flyToSavedLocation(location.position);
                        document.getElementById('saved-locations-window')?.classList.add('hidden');
                      }
                    }}
                  >
                    <div className="font-semibold text-gray-800 truncate">{location.name || "Saved Location"}</div>
                    <div className="text-sm text-gray-600 truncate">{location.description || "No description"}</div>
                    <div className="text-xs text-gray-500 mt-1">{location.category || "general"}</div>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation(); // Prevent the click from triggering the location navigation
                      if (window.confirm(`Are you sure you want to remove "${location.name || "this location"}" from your saved locations?`)) {
                        try {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            alert('Please login to manage saved locations');
                            return;
                          }
                          
                          const response = await fetch(`${API_BASE_URL}/users/saved-locations/${location.id}`, {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (response.ok) {
                            // Update the saved locations state
                            setSavedLocations(prev => prev.filter(loc => loc.id !== location.id));
                            
                            // Hide the current post if it's the one being removed
                            if (selectedPost && selectedPost._id === location.id) {
                              setSelectedPost(null);
                            }
                          } else {
                            alert('Failed to remove location');
                          }
                        } catch (err) {
                          console.error('Error removing location:', err);
                          alert('Error removing location');
                        }
                      }
                    }}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    title="Remove from saved locations"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bookmark className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No saved locations</h3>
                <p className="mt-1 text-sm text-gray-500">Save locations to see them here.</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={showSavedLocations}
              className={`flex-1 px-4 py-2 rounded-lg ${
                showSavedLocationsOnMap 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showSavedLocationsOnMap ? 'Hide on Map' : 'Show on Map'}
            </button>
          </div>
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
        isAuthenticated={isAuthenticated}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={handlePostLike}
        onSave={handlePostSave}
        onRate={handlePostRate}
        onComment={(postId) => {
          console.log('Comment clicked for post:', postId);
          // Handle comment click if needed
        }}
      />
    </div>
  );
};

export default DiscoverMain;