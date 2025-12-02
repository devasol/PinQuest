import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import CustomMarker from './CustomMarker';
import Header from '../Landing/Header/Header';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const MapView = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapType, setMapType] = useState('street'); // street, satellite, terrain
  const [savedLocations, setSavedLocations] = useState([]);
  const [activePanel, setActivePanel] = useState(null); // null, 'posts', 'search', 'filters', 'map', 'saved'
  const [selectedPost, setSelectedPost] = useState(null);
  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

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
              id: post._id,
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
              ...updatedSelectedPost, // Get updated basic fields from fresh data
              // Preserve the detailed data that was originally loaded
              ...prev
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

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      
      // Fetch saved locations in background (not blocking)
      if (isAuthenticated) {
        setTimeout(() => {
          fetchSavedLocations(); // Run in background to avoid blocking
        }, 0);
      }
      
      // Fetch posts with a timeout mechanism
      const postsPromise = fetchPosts(null, 50); // Fetch limited posts initially
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000) // 8 second timeout for posts
      );
      
      try {
        await Promise.race([postsPromise, timeoutPromise]);
      } catch (error) {
        if (error.message === 'Timeout') {
          console.warn('Posts fetch timed out, showing interface while loading continues');
        } else {
          console.error('Error fetching posts:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    initialFetch();

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
  }, [fetchPosts, fetchSavedLocations, isAuthenticated, selectedPost]);

  // Apply filters when search query or category changes
  useEffect(() => {
    let result = posts;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.description.toLowerCase().includes(query) ||
        post.postedBy.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    setFilteredPosts(result);
  }, [searchQuery, selectedCategory, posts]);

  // Get user location for initial centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Update map center if we have a reference to it
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
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
    if (mapRef.current && position && Array.isArray(position) && position.length >= 2) {
      mapRef.current.flyTo(position, 15);
    }
  }, []);

  // Toggle panel visibility
  const togglePanel = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
      // Fetch saved locations when the saved panel is opened to ensure fresh data
      if (panelName === 'saved' && isAuthenticated) {
        fetchSavedLocations();
      }
    }
  };

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
          alert('Location saved successfully!');
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
        alert('Location removed successfully!');
      } else {
        alert('Failed to remove location');
      }
    } catch (err) {
      console.error('Error removing location:', err);
      alert('Error removing location');
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

  const categories = ['all', 'nature', 'culture', 'shopping', 'food', 'event', 'general'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl font-medium text-white">Loading map data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Map</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header isDiscoverPage={true} />
      
      <div className="flex pt-32">
        {/* Icon-only Sidebar */}
        <div className="w-20 bg-white/90 backdrop-blur-lg shadow-xl border-r border-gray-200 z-0 flex flex-col items-center py-6 pt-16">
        <button
          className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
            activePanel === 'posts' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => togglePanel('posts')}
          title="Posts"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
            activePanel === 'search' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => togglePanel('search')}
          title="Search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
            activePanel === 'filters' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => togglePanel('filters')}
          title="Filters"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
            activePanel === 'map' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => togglePanel('map')}
          title="Map Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
        
        {isAuthenticated && (
          <button
            className={`p-3 rounded-xl mb-2 transition-all duration-200 ${
              activePanel === 'saved' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => togglePanel('saved')}
            title="Saved Locations"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Panel Content - Appears beside the sidebar when active */}
      {activePanel && (
        <div className="w-80 bg-white/90 backdrop-blur-lg shadow-xl border-r border-gray-200 z-0 flex flex-col h-full max-h-screen overflow-hidden fixed top-32">
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold capitalize">
              {activePanel === 'posts' && 'All Posts'}
              {activePanel === 'search' && 'Search Posts'}
              {activePanel === 'filters' && 'Filter Posts'}
              {activePanel === 'map' && 'Map Settings'}
              {activePanel === 'saved' && 'Saved Locations'}
            </h2>
            <button 
              onClick={() => setActivePanel(null)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'posts' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">All Posts ({filteredPosts.length})</h3>
                <div className="space-y-3">
                  {filteredPosts.map(post => (
                    <div 
                      key={`panel-post-${post.id}`} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedPost(post);
                        flyToPost(post.position);
                      }}
                    >
                      <h4 className="font-medium text-gray-800 truncate">{post.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 truncate">{post.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{post.category}</span>
                        <span className="text-xs text-gray-500">{post.postedBy}</span>
                      </div>
                    </div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No posts found</p>
                  )}
                </div>
              </div>
            )}
            
            {activePanel === 'search' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Search Posts</h3>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search posts, locations, users..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  {filteredPosts.slice(0, 10).map(post => (
                    <div 
                      key={`search-post-${post.id}`} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedPost(post);
                        flyToPost(post.position);
                      }}
                    >
                      <h4 className="font-medium text-gray-800 truncate">{post.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 truncate">{post.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{post.category}</span>
                        <span className="text-xs text-gray-500">{post.postedBy}</span>
                      </div>
                    </div>
                  ))}
                  {filteredPosts.length === 0 && searchQuery && (
                    <p className="text-gray-500 text-center py-4">No posts match your search</p>
                  )}
                </div>
              </div>
            )}
            
            {activePanel === 'filters' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Filter Posts</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Ratings</option>
                    <option value="4">4 Stars & Up</option>
                    <option value="3">3 Stars & Up</option>
                    <option value="2">2 Stars & Up</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
            )}
            
            {activePanel === 'map' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Map Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Map Type</label>
                  <div className="space-y-2">
                    {[
                      { id: 'street', label: 'Street Map' },
                      { id: 'satellite', label: 'Satellite View' },
                      { id: 'terrain', label: 'Terrain View' }
                    ].map(option => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          id={option.id}
                          name="mapType"
                          checked={mapType === option.id}
                          onChange={() => setMapType(option.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Map Controls</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Show Labels</span>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" name="showLabels" id="showLabels" className="sr-only" defaultChecked />
                        <label htmlFor="showLabels" className="block h-6 w-10 rounded-full bg-gray-300 cursor-pointer"></label>
                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform"></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Show Traffic</span>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" name="showTraffic" id="showTraffic" className="sr-only" />
                        <label htmlFor="showTraffic" className="block h-6 w-10 rounded-full bg-gray-300 cursor-pointer"></label>
                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activePanel === 'saved' && isAuthenticated && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Saved Locations ({savedLocations.length})</h3>
                <div className="space-y-3">
                  {savedLocations.map(location => (
                    <div key={`saved-${location.id}`} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-800 truncate">{location.name || location.title}</h4>
                        <button 
                          onClick={() => removeSavedLocation(location.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">{location.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{location.category || 'general'}</span>
                        <span className="text-xs text-gray-500">{location.postedBy || 'User'}</span>
                      </div>
                    </div>
                  ))}
                  {savedLocations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No saved locations yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main Map Area */}
      <div className={`${activePanel ? 'w-1/2' : 'w-full'} flex-1 relative z-0`}>
        <MapContainer
          center={[20, 0]} // Default to world view
          zoom={2}
          minZoom={2}
          maxZoom={18}
          style={{ height: 'calc(100vh - 8rem)', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={getTileLayerUrl()}
          />
          
          {/* Render custom markers for each post */}
          {filteredPosts.map((post) => (
            <CustomMarker 
              key={`post-${post.id}`} 
              post={post}
              onClick={(post) => {
                setSelectedPost(post);
                // Handle click on marker
                console.log('Marker clicked for post:', post.title);
              }}
              onSave={saveLocation}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;