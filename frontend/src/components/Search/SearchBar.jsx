import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Star, Compass } from 'lucide-react';
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
      <div className="relative group">
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-14 pr-12 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 font-bold text-sm tracking-tight placeholder:text-slate-400 placeholder:font-medium shadow-sm transition-all duration-300"
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400 hover:text-slate-900" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown - Structural Style */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 z-[9999] max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {searchQuery ? (
            <div className="flex flex-col">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Intelligence</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-6 py-3 border-b border-slate-50">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Results ({searchResults.length})</span>
                  </div>
                  {searchResults.map((post, index) => (
                    <div
                      key={post._id || post.id || index}
                      className={`px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0 group ${post.isGlobalLocation ? 'bg-slate-50/50' : ''}`}
                      onClick={() => handleResultClick(post)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:border-slate-300 transition-colors">
                          <MapPin size={18} className={`${post.isGlobalLocation ? 'text-indigo-500' : 'text-slate-900'}`} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-black text-slate-900 text-[13px] truncate tracking-tight">{post.title}</h3>
                            {post.isGlobalLocation && (
                              <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Global
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">{post.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-400 fill-current" />
                              <span className="text-[11px] font-black text-slate-900">
                                {post.averageRating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center flex flex-col items-center">
                  <Search size={32} className="text-slate-100 mb-4" />
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No matching results</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Check your filters or location</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Compass size={24} className="mx-auto text-slate-200 mb-3 animate-pulse" />
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Intelligence Search</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Ready for input...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;