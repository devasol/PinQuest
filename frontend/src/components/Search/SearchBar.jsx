import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star } from 'lucide-react';
import { postApi } from '../../services/api';
import { useModal } from '../../contexts/ModalContext';

const SearchBar = ({
  placeholder = "Search locations, pins, users...",
  onSearchResults = null,
  onLocationSelect = null,
  autoFocus = false,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const onSearchResultsRef = useRef(onSearchResults);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Update refs when props change
  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
    onLocationSelectRef.current = onLocationSelect;
  }, [onSearchResults, onLocationSelect]);

  const { showModal } = useModal();

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      if (onSearchResultsRef.current) {
        onSearchResultsRef.current([]);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await postApi.globalSearch(
          searchQuery,
          null, // category
          10, // limit
          1, // page
          'relevance' // sortBy
        );

        if (response.success && response.data) {
          const validPosts = (response.data.data?.posts || []).filter(post => post._id || post.id);

          // Get global locations from external services
          const globalLocations = response.data.data?.globalLocations || [];

          // Convert global locations to a similar format as posts for consistent display
          const formattedGlobalLocations = globalLocations.map((location, index) => ({
            _id: `global-${index}-${Date.now()}`, // Create a unique ID
            id: `global-${index}-${Date.now()}`,
            title: location.name || 'Location',
            description: location.address ?
              (location.address.road || location.address.city || location.address.country || location.name)
              : 'Location found via external search',
            category: location.category || 'global',
            location: {
              type: "Point",
              coordinates: [location.coordinates.longitude, location.coordinates.latitude],
              latitude: location.coordinates.latitude,
              longitude: location.coordinates.longitude
            },
            averageRating: 0,
            totalRatings: 0,
            datePosted: new Date().toISOString(),
            postedBy: { name: 'External Search' },
            isGlobalLocation: true, // Flag to distinguish from regular posts
            globalLocationData: location // Include the original global location data
          }));

          // Combine posts and global locations
          const allResults = [...validPosts, ...formattedGlobalLocations];
          setSearchResults(allResults);

          if (onSearchResultsRef.current) {
            onSearchResultsRef.current(allResults);
          }
        } else {
          setSearchResults([]);
          if (onSearchResultsRef.current) {
            onSearchResultsRef.current([]);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message || 'An error occurred during search');

        if (err.response?.status === 429) {
          showModal({
            title: "Rate Limit Exceeded",
            message: "You're searching too frequently. Please slow down your search requests.",
            type: "warning",
            confirmText: "OK"
          });
        } else {
          showModal({
            title: "Search Error",
            message: "An error occurred while searching. Please try again.",
            type: "error",
            confirmText: "OK"
          });
        }

        setSearchResults([]);
        if (onSearchResultsRef.current) {
          onSearchResultsRef.current([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isFocused]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (onSearchResults) {
      onSearchResults([]);
    }
  };

  const handleResultClick = (item) => {
    if (onLocationSelectRef.current) {
      onLocationSelectRef.current(item);
    }
    // Clear the search results and close the dropdown after selecting a location
    setSearchResults([]);
    setIsFocused(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {searchQuery ? (
            <>
              {isLoading ? (
                <div className="py-4 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">Searching...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((post, index) => (
                    <div
                      key={post._id || post.id || index}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${post.isGlobalLocation ? 'bg-blue-50' : ''}`}
                      onClick={() => handleResultClick(post)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                          <MapPin className={`h-4 w-4 ${post.isGlobalLocation ? 'text-green-500' : 'text-blue-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{post.title}</h3>
                            {post.isGlobalLocation && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                External
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 ml-1">
                                {post.averageRating?.toFixed(1) || '0.0'} ({post.totalRatings || 0})
                              </span>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-600">No results found for "{searchQuery}"</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600">Start typing to search for locations</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;