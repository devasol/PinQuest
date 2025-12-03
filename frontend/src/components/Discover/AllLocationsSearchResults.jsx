import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Heart, Bookmark, Navigation, X, Filter, SlidersHorizontal, TrendingUp, Award, Users, Globe, Search } from 'lucide-react';
import { postApi } from '../services/api';
import { useModal } from '../../contexts/ModalContext';

const AllLocationsSearchResults = ({ 
  searchQuery, 
  userLocation = null, 
  onLocationSelect,
  onClose,
  limit = 50
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    sortBy: 'relevance',
    radius: 50,
    showSaved: false
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { showModal } = useModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(() => {
      performSearch(1); // Reset to page 1 when search query changes
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, activeFilters, activeTab, userLocation]);

  const performSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let latitude = null;
      let longitude = null;

      if (activeTab === 'nearby' && userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
      }

      const response = await postApi.advancedSearch(
        searchQuery,
        activeFilters.category !== 'all' ? activeFilters.category : null,
        limit,
        page,
        activeFilters.sortBy,
        latitude,
        longitude,
        activeFilters.radius
      );

      if (response.success && response.data) {
        if (page === 1) {
          setSearchResults(response.data.data.posts || []);
        } else {
          setSearchResults(prev => [...prev, ...(response.data.data.posts || [])]);
        }
        setHasMore(response.data.data.pagination.hasNext);
      } else {
        if (page === 1) {
          setSearchResults([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search locations');
      showModal({
        title: "Search Error",
        message: "An error occurred while searching for locations. Please try again.",
        type: "error",
        confirmText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      performSearch(nextPage);
    }
  };

  const handleResultClick = (post) => {
    if (onLocationSelect) {
      onLocationSelect(post);
    }
  };

  const getDistanceText = (post) => {
    if (post.distance !== undefined && post.distance !== null) {
      return `${post.distance.toFixed(1)} km away`;
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
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Search Results</h2>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {searchResults.length} locations
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Filters and Tabs */}
      <div className="p-4 space-y-4">
        {/* Tabs */}
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

        {/* Filter Controls */}
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
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && currentPage === 1 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">Searching all locations...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            <Search className="mx-auto h-12 w-12 text-red-300 mb-3" />
            <p className="text-lg font-medium">Error loading results</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {searchResults.map((post, index) => {
                const relevanceInfo = getRelevanceBadge(post.relevanceScore || 0);
                return (
                  <motion.div
                    key={post._id || post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
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
                          {(post.bookmarked || post.saved) && (
                            <Bookmark className="w-4 h-4 text-red-500 ml-2 flex-shrink-0" />
                          )}
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

        {/* Load More Button */}
        {hasMore && !loading && searchResults.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && searchResults.length === 0 && searchQuery && (
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

        {/* Empty State */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium">Enter a search query</p>
            <p className="text-sm">Search for locations, places, or categories</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AllLocationsSearchResults;