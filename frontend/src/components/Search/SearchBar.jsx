import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin, Star, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { postApi } from '../../services/api';
import { useModal } from '../../contexts/ModalContext';

const SearchBar = React.memo(({
  placeholder = "Search locations, pins, users...",
  onSearchResults = null,
  onLocationSelect = null,
  autoFocus = false,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [userHasClicked, setUserHasClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  
  // Use a stable ref for callbacks to avoid re-triggering effects unnecessarily
  const onSearchResultsRef = useRef(onSearchResults);
  const onLocationSelectRef = useRef(onLocationSelect);

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
  }, [searchQuery, showModal]);

  const handleInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    if (onSearchResultsRef.current) {
      onSearchResultsRef.current([]);
    }
  }, []);

  const handleResultClick = useCallback((item) => {
    if (onLocationSelectRef.current) {
      onLocationSelectRef.current(item);
    }
    // Clear the search results and close the dropdown after selecting a location
    setSearchResults([]);
    setIsFocused(false);
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        setUserHasClicked(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className={`relative ${className} font-jakarta`} 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        <motion.div 
          animate={{ 
            scale: isFocused ? 1.01 : 1,
            boxShadow: isFocused 
              ? '0 20px 40px -15px rgba(0,0,0,0.1)' 
              : '0 4px 12px -2px rgba(0,0,0,0.02)'
          }}
          className={`relative flex items-center transition-all duration-500 rounded-[4px] overflow-hidden border-2 
            ${isFocused 
              ? 'border-slate-900 dark:border-indigo-500 bg-white dark:bg-slate-900 shadow-xl' 
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'}`}
        >
          <div className={`pl-5 text-slate-400 transition-colors duration-300 ${isFocused ? 'text-slate-900 dark:text-indigo-400' : ''}`}>
            <Search size={18} strokeWidth={isFocused ? 3 : 2.5} className="transition-all duration-500" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onClick={() => setUserHasClicked(true)}
            className="w-full pl-4 pr-12 py-4 bg-transparent outline-none font-black text-sm tracking-tighter text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-bold transition-all"
            autoFocus={autoFocus}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClearSearch}
                className="absolute right-4 p-1.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              >
                <X size={14} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Modern Focus Glow */}
        <AnimatePresence>
          {isFocused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-[8px] blur-xl -z-10 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Search Results Dropdown - Structural Style */}
      <AnimatePresence>
        {isFocused && (searchQuery.trim() !== '' || userHasClicked) && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[4px] shadow-[0_30px_70px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 z-[9999] max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
          >
            {searchQuery ? (
              <div className="flex flex-col">
                {isLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-900 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">Syncing Intelligence</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Results Distribution</span>
                       <span className="text-[10px] font-black text-teal-600 dark:text-indigo-400">{searchResults.length} Match Found</span>
                    </div>
                    {searchResults.map((post, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={post._id || post.id || index}
                        className={`px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all border-b border-slate-50 dark:border-slate-800 last:border-b-0 group ${post.isGlobalLocation ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}
                        onClick={() => handleResultClick(post)}
                      >
                        <div className="flex items-start gap-5">
                          <div className="w-11 h-11 rounded-[4px] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
                            {post.isGlobalLocation ? (
                              <Compass size={20} className="text-teal-500 dark:text-teal-400" strokeWidth={2.5} />
                            ) : (
                              <MapPin size={20} className="text-slate-900 dark:text-white" strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-slate-900 dark:text-white text-[14px] truncate tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic">{post.title}</h3>
                              {post.isGlobalLocation && (
                                <span className="text-[9px] font-black bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-[2px] uppercase tracking-wider border border-teal-100 dark:border-teal-800">
                                  Global
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-outfit uppercase tracking-tight">{post.description}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-[2px] border border-slate-100 dark:border-slate-800">
                                <Star size={10} className="text-yellow-400 fill-current" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                  {post.averageRating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                • {post.category || 'POI'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center px-10">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                      <Search size={32} className="text-slate-200 dark:text-slate-800" />
                    </div>
                    <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 italic">Intelligence Null</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-relaxed">No matching nodes found in this sector. Try refining your parameters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="relative mb-8">
                  <Compass size={40} className="text-slate-200 dark:text-slate-800 animate-spin-slow" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl -z-10"
                  />
                </div>
                <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 italic">Navigation Ready</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Sector Search / Global Map / Users</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SearchBar;