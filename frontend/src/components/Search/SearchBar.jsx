import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, MapPin, Star, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postApi } from "../../services/api";
import { useModal } from "../../contexts/ModalContext";

const SearchBar = React.memo(
  ({
    placeholder = "Search locations, pins, users...",
    onSearchResults = null,
    onLocationSelect = null,
    autoFocus = false,
    className = "",
  }) => {
    const [searchQuery, setSearchQuery] = useState("");
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
            "relevance", // sortBy
          );

          if (response.success && response.data) {
            const validPosts = (response.data.data?.posts || []).filter(
              (post) => post._id || post.id,
            );

            // Get global locations from external services
            const globalLocations = response.data.data?.globalLocations || [];

            // Convert global locations to a similar format as posts for consistent display
            const formattedGlobalLocations = globalLocations.map(
              (location, index) => ({
                _id: `global-${index}-${Date.now()}`, // Create a unique ID
                id: `global-${index}-${Date.now()}`,
                title: location.name || "Location",
                description: location.address
                  ? location.address.road ||
                    location.address.city ||
                    location.address.country ||
                    location.name
                  : "Location found via external search",
                category: location.category || "global",
                location: {
                  type: "Point",
                  coordinates: [
                    location.coordinates.longitude,
                    location.coordinates.latitude,
                  ],
                  latitude: location.coordinates.latitude,
                  longitude: location.coordinates.longitude,
                },
                averageRating: 0,
                totalRatings: 0,
                datePosted: new Date().toISOString(),
                postedBy: { name: "External Search" },
                isGlobalLocation: true, // Flag to distinguish from regular posts
                globalLocationData: location, // Include the original global location data
              }),
            );

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
          console.error("Search error:", err);
          setError(err.message || "An error occurred during search");

          if (err.response?.status === 429) {
            showModal({
              title: "Rate Limit Exceeded",
              message:
                "You're searching too frequently. Please slow down your search requests.",
              type: "warning",
              confirmText: "OK",
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
      setSearchQuery("");
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
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target)
        ) {
          setIsFocused(false);
          setUserHasClicked(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div
        className={`relative ${className} font-jakarta`}
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
            boxShadow: isFocused
              ? "0 18px 35px rgba(15, 23, 42, 0.12)"
              : "0 8px 20px rgba(15, 23, 42, 0.05)",
          }}
          className={`relative flex items-center transition-all duration-300 rounded-3xl border ${isFocused ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"} overflow-hidden`}
        >
          <div
            className={`pl-5 transition-colors duration-300 ${isFocused ? "text-slate-700" : "text-slate-400"}`}
          >
            <Search
              size={18}
              strokeWidth={isFocused ? 3 : 2.5}
              className="transition-all duration-300"
            />
          </div>

          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onClick={() => setUserHasClicked(true)}
            className="w-full pl-4 pr-12 py-4 bg-transparent outline-none font-semibold text-sm tracking-tight text-slate-900 placeholder:text-slate-400 transition-all"
            autoFocus={autoFocus}
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={handleClearSearch}
                className="absolute right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all duration-200"
              >
                <X size={14} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isFocused && (searchQuery.trim() !== "" || userHasClicked) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-3 rounded-3xl border border-slate-200 bg-white shadow-xl z-[999] max-h-[70vh] overflow-hidden overflow-y-auto custom-scrollbar"
            >
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Searching...
                  </span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((post, index) => (
                    <motion.button
                      key={post._id || post.id || index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      onClick={() => handleResultClick(post)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                          {post.isGlobalLocation ? (
                            <Compass size={18} strokeWidth={2.2} />
                          ) : (
                            <MapPin size={18} strokeWidth={2.2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {post.title}
                            </p>
                            {post.isGlobalLocation && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                                Global
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {post.description}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-1">
                              {post.category || "General"}
                            </span>
                            <span>
                              • {post.averageRating?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 text-center text-slate-500">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search size={28} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    No results found
                  </p>
                  <p className="text-xs text-slate-500">
                    Try a different keyword or search area.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

export default SearchBar;
