import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, Star, Heart, Bookmark, Navigation, X, Filter, SlidersHorizontal, TrendingUp, Award, Users, Globe } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { postApi } from '../../services/api';

const EnhancedSearchComponent = ({ 
  onSearchResults, 
  onLocationSelect, 
  currentLocation = null,
  placeholder = "Search the world for places, locations, categories...",
  showFilters = true,
  limit = 20,
  searchQuery,
  onSearchQueryChange
}) => {
 
  const [searchResults, setSearchResults] = useState([]);
  const [globalLocations, setGlobalLocations] = useState([]); // For global search results
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    sortBy: 'relevance',
    radius: 50,
    showSaved: false
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, popular, nearby
  const { showModal } = useModal();
  
  // Get user location for nearby searches
  const [userLocation, setUserLocation] = useState(currentLocation);

  // Get user's location
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      // First attempt with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error on first attempt:", error.message);
          
          // If first attempt fails due to timeout, try with fallback settings
          if (error.code === error.TIMEOUT) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                });
              },
              (fallbackError) => {
                console.log("Geolocation fallback also failed:", fallbackError.message);
              },
              {
                enableHighAccuracy: false, // Use less accuracy to get faster response
                timeout: 10000, // 10 seconds timeout
                maximumAge: 300000, // Allow cached location up to 5 minutes old
              }
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased to 15 seconds for better GPS acquisition
          maximumAge: 0
        }
      );
    }
  }, [userLocation]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setGlobalLocations([]);
      if (onSearchResults) {
          onSearchResults([]);
      }
      return;
    }

    setLoading(true);
    try {
      // Determine search parameters based on active tab
      let latitude = null;
      let longitude = null;
      
      if (activeTab === 'nearby' && userLocation && userLocation.latitude && userLocation.longitude) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
      }

      let response;
      if (latitude && longitude) {
        // Use advanced search for location-based searches
        response = await postApi.advancedSearch(
          searchQuery,
          activeFilters.category !== 'all' ? activeFilters.category : null,
          limit,
          1, // page
          activeFilters.sortBy,
          latitude && !isNaN(latitude) ? latitude : null,
          longitude && !isNaN(longitude) ? longitude : null,
          activeFilters.radius
        );
      } else {
        // Use global search for worldwide searches
        response = await postApi.globalSearch(
          searchQuery,
          activeFilters.category !== 'all' ? activeFilters.category : null,
          limit,
          1, // page
          activeFilters.sortBy
        );
      }

      if (response.success && response.data) {
        // Filter out posts without valid IDs to prevent key duplication issues
        const validPosts = (response.data.data.posts || []).filter(post => post._id || post.id);
        setSearchResults(validPosts);
        
        // Set global locations if available
        if (response.data.data.globalLocations) {
          setGlobalLocations(response.data.data.globalLocations);
        } else {
          setGlobalLocations([]);
        }
        
        if (onSearchResults) {
          onSearchResults(validPosts);
        }
      } else {
        setSearchResults([]);
        setGlobalLocations([]);
        if (onSearchResults) {
          onSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      showModal({
        title: "Search Error",
        message: "An error occurred while searching. Please try again.",
        type: "error",
        confirmText: "OK"
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilters, activeTab, userLocation, limit, onSearchResults, showModal]);

  // Debounced search function
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [performSearch]);

  // Filter results based on active filters
  const filteredResults = useMemo(() => {
    let results = [...searchResults];

    // Apply category filter
    if (activeFilters.category !== 'all') {
      results = results.filter(post => 
        post.category.toLowerCase().includes(activeFilters.category.toLowerCase())
      );
    }

    // Apply saved filter if enabled
    if (activeFilters.showSaved) {
      results = results.filter(post => post.bookmarked || post.saved);
    }

    // Apply sort
    results.sort((a, b) => {
      switch (activeFilters.sortBy) {
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'newest':
          return new Date(b.datePosted) - new Date(a.datePosted);
        case 'popular':
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        default:
          return 0;
      }
    });

    return results;
  }, [searchResults, activeFilters]);

  const handleResultClick = (post) => {
    if (onLocationSelect) {
      onLocationSelect(post);
    }
    onSearchQueryChange('');
    setSearchResults([]);
    setGlobalLocations([]);
  };

  const getDistanceText = (post) => {
    if (post.distance !== undefined && post.distance !== null) {
      return `${post.distance} km away`;
    }
    return 'Location';
  };

  const getRelevanceBadge = (score) => {
    if (score > 15) return { text: 'TOP MATCH', color: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    if (score > 10) return { text: 'HIGH', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' };
    if (score > 5) return { text: 'GOOD', color: 'bg-gradient-to-r from-green-500 to-teal-500' };
    return { text: 'RELEVANT', color: 'bg-gradient-to-r from-gray-500 to-gray-600' };
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-base bg-white"  // Changed to solid white background from bg-white/80 backdrop-blur-sm
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchQueryChange('');
              setSearchResults([]);
              setGlobalLocations([]);
              if (onSearchResults) {
                onSearchResults([]);
              }
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {showFilters && (
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All Locations', icon: Globe },
            { id: 'popular', label: 'Popular', icon: TrendingUp },
            { id: 'nearby', label: 'Nearby', icon: MapPin }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          
          <select
            value={activeFilters.sortBy}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="rating">Rating</option>
            <option value="popular">Popular</option>
            {userLocation && <option value="distance">Distance</option>}
          </select>
        </div>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={activeFilters.category}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="nature">Nature</option>
                  <option value="culture">Culture</option>
                  <option value="shopping">Shopping</option>
                  <option value="food">Food</option>
                  <option value="event">Events</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius (km)</label>
                <select
                  value={activeFilters.radius}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={activeTab !== 'nearby'}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.showSaved}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, showSaved: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show only saved locations</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Searching the entire world...</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {filteredResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 max-h-96 overflow-y-auto pr-2"
          >
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">{filteredResults.length} locations found</span>
              {activeTab === 'nearby' && userLocation && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Near you
                </span>
              )}
            </div>
            
            {filteredResults.map((post, index) => {
              const relevanceInfo = getRelevanceBadge(post.relevanceScore || 0);
              return (
                <motion.div
                  key={post._id || post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleResultClick(post)}
                >
                  <div className="flex items-start gap-3">
                    {/* Relevance Badge */}
                    <div className={`${relevanceInfo.color} text-white text-xs px-2 py-1 rounded-full font-medium min-w-16 text-center`}>
                      {relevanceInfo.text}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                        {post.bookmarked || post.saved ? (
                          <Bookmark className="w-4 h-4 text-red-500 ml-2 flex-shrink-0" />
                        ) : null}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {post.averageRating?.toFixed(1) || '0.0'} ({post.totalRatings || 0})
                          </span>
                        </div>
                        
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {post.category}
                        </span>
                        
                        {post.distance !== undefined && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {getDistanceText(post)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>by {post.postedBy?.name || post.postedBy || 'Unknown'}</span>
                        <span>{new Date(post.datePosted).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Locations Results - Shown when no posts match but global locations exist */}
      {!loading && filteredResults.length === 0 && searchQuery && globalLocations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3 max-h-96 overflow-y-auto pr-2"
        >
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">{globalLocations.length} global locations found</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Worldwide
            </span>
          </div>
          
          {globalLocations.map((location, index) => (
            <motion.div
              key={`global-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100 cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                // Handle global location selection
                // For now we'll just show an alert, but in the future you could
                // create a post at this location or show location details
                showModal({
                  title: "Location Found",
                  message: `Location: ${location.name}\nType: ${location.type || 'N/A'}\nCategory: ${location.category || 'N/A'}`,
                  type: "info",
                  confirmText: "OK"
                });
              }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium min-w-16 text-center flex items-center justify-center">
                  <Globe className="w-3 h-3 mr-1" />
                  Global
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{location.name}</h3>
                  
                  {location.address && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {location.address.country || location.address.state || location.address.county || 'Location details'}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2">
                    {location.type && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {location.type}
                      </span>
                    )}
                    
                    {location.category && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {location.category}
                      </span>
                    )}
                    
                    {location.relevance && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Relevance: {Math.round(location.relevance * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Combined Results - When both posts and global locations exist */}
      {!loading && (filteredResults.length > 0 || globalLocations.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3 max-h-96 overflow-y-auto pr-2"
        >
          {/* Posts Results */}
          {filteredResults.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">{filteredResults.length} locations found</span>
                {activeTab === 'nearby' && userLocation && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Near you
                  </span>
                )}
              </div>
              
              {filteredResults.map((post, index) => {
                const relevanceInfo = getRelevanceBadge(post.relevanceScore || 0);
                return (
                  <motion.div
                    key={post._id || post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleResultClick(post)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Relevance Badge */}
                      <div className={`${relevanceInfo.color} text-white text-xs px-2 py-1 rounded-full font-medium min-w-16 text-center`}>
                        {relevanceInfo.text}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                          {post.bookmarked || post.saved ? (
                            <Bookmark className="w-4 h-4 text-red-500 ml-2 flex-shrink-0" />
                          ) : null}
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {post.averageRating?.toFixed(1) || '0.0'} ({post.totalRatings || 0})
                            </span>
                          </div>
                          
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {post.category}
                          </span>
                          
                          {post.distance !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              {getDistanceText(post)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>by {post.postedBy?.name || post.postedBy || 'Unknown'}</span>
                          <span>{new Date(post.datePosted).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}

          {/* Global Locations Results */}
          {globalLocations.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-4 mb-2">
                <span className="font-medium text-blue-600">Global Locations</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Worldwide
                </span>
              </div>
              
              {globalLocations.map((location, index) => (
                <motion.div
                  key={`global-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + filteredResults.length) * 0.05 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    // Handle global location selection by creating a synthetic post object
                    const syntheticPost = {
                      _id: `global-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
                      title: location.name || 'Global Location',
                      description: location.address ? 
                        `${location.address.country || location.address.state || 'World Location'}` : 
                        'Global location found via external search',
                      category: location.category || 'global',
                      location: {
                        type: "Point",
                        coordinates: [location.coordinates.longitude, location.coordinates.latitude]
                      },
                      averageRating: 0,
                      totalRatings: 0,
                      datePosted: new Date().toISOString(),
                      postedBy: { name: 'Global Search' },
                      isGlobalLocation: true, // Flag to indicate this is a global location result
                      globalLocationData: location // Include the original global location data
                    };
                    
                    if (onLocationSelect) {
                      onLocationSelect(syntheticPost);
                    }
                    onSearchQueryChange('');
                    setSearchResults([]);
                    setGlobalLocations([]);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium min-w-16 text-center flex items-center justify-center">
                      <Globe className="w-3 h-3 mr-1" />
                      Global
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{location.name}</h3>
                      
                      {location.address && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {location.address.country || location.address.state || location.address.county || 'Location details'}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2">
                        {location.type && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {location.type}
                          </span>
                        )}
                        
                        {location.category && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {location.category}
                          </span>
                        )}
                        
                        {location.relevance !== undefined && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Relevance: {Math.round(location.relevance * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}

      {/* No Results */}
      {!loading && filteredResults.length === 0 && searchQuery && globalLocations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-medium">No locations found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </motion.div>
      )}

      {/* Popular Suggestions when no search query */}
      {!searchQuery && activeTab !== 'popular' && (
        <div className="text-center py-4 text-gray-500">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-medium">Search for locations</p>
          <p className="text-sm">Enter a location name to find all available locations</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchComponent;