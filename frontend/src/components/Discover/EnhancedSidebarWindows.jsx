import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Grid3X3, Bookmark, Navigation, Home, 
  User, Settings, LogOut, Heart, Star, Bell, 
  TrendingUp, Award, Globe, Users, Check, SlidersHorizontal
} from 'lucide-react';

const EnhancedSidebarWindows = ({ 
  showWindows = {},
  setShowWindows = () => {},
  selectedCategory = 'all',
  setSelectedCategory = () => {},
  viewMode = 'grid',
  setViewMode = () => {},
  mapType = 'google',
  setMapType = () => {},
  favoritePosts = new Set(),
  posts = [],
  togglePostBookmark = () => {},
  bookmarkLoading = null,
  showSavedLocationsOnMap = false,
  setShowSavedLocationsOnMap = () => {},
  user = null,
  updateUserLocation = () => {},
  followUser = false,
  isSidebarExpanded = false
}) => {
  const categories = [
    { id: 'all', name: 'All', icon: MapPin, description: 'Show all locations' },
    { id: 'nature', name: 'Nature', icon: MapPin, description: 'Natural locations' },
    { id: 'culture', name: 'Culture', icon: MapPin, description: 'Cultural sites' },
    { id: 'shopping', name: 'Shopping', icon: MapPin, description: 'Shopping areas' },
    { id: 'food', name: 'Food', icon: MapPin, description: 'Restaurants & cafes' },
    { id: 'event', name: 'Events', icon: MapPin, description: 'Events & happenings' },
    { id: 'general', name: 'General', icon: MapPin, description: 'General locations' }
  ];

  const mapTypes = [
    { id: 'google', name: 'Google Maps', description: 'Classic Google Maps style', icon: Globe },
    { id: 'street', name: 'Street Map', description: 'Standard road map view', icon: MapPin },
    { id: 'satellite', name: 'Satellite View', description: 'Satellite imagery', icon: Globe },
    { id: 'terrain', name: 'Terrain View', description: 'Topographical view', icon: MapPin },
    { id: 'dark', name: 'Dark Theme', description: 'High contrast dark map', icon: Globe },
    { id: 'light', name: 'Light Theme', description: 'Clean light map style', icon: Globe },
    { id: 'topographic', name: 'Topographic', description: 'Detailed topographical map', icon: MapPin },
    { id: 'navigation', name: 'Navigation', description: 'Navigation-focused map', icon: Navigation },
    { id: 'cycle', name: 'Cycle Map', description: 'Cycling-specific features', icon: MapPin }
  ];

  const viewModes = [
    { id: 'grid', name: 'Grid View', description: 'Display posts in grid layout', icon: Grid3X3 },
    { id: 'list', name: 'List View', description: 'Display posts in list layout', icon: SlidersHorizontal }
  ];

  // Function to close a specific window
  const closeWindow = (windowId) => {
    setShowWindows(prev => ({
      ...prev,
      [windowId]: false
    }));
  };

  // Function to close all windows
  const closeAllWindows = () => {
    setShowWindows({
      'category-window': false,
      'view-mode-window': false,
      'map-type-window': false,
      'saved-locations-window': false
    });
  };

  // Function to open a specific window
  const openWindow = (windowId) => {
    closeAllWindows();
    setShowWindows(prev => ({
      ...prev,
      [windowId]: true
    }));
  };

  return (
    <div className="z-[6000]">
      {/* Category Window */}
      <AnimatePresence>
        {showWindows['category-window'] && (
          <motion.div 
            className={`fixed top-0 bottom-0 z-[6000] sidebar-window h-full ${
              isSidebarExpanded && window.innerWidth >= 768 
                ? 'left-[16rem] xl:left-[16rem] lg:left-[16rem] md:left-[16rem] w-[380px]' 
                : 'left-[5rem] w-[380px]'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.4 
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-window-title"
            tabIndex={-1}
          >
            <div className="sidebar-window-header">
              <h2 id="category-window-title">Select Category</h2>
              <button 
                onClick={() => closeWindow('category-window')}
                aria-label="Close category window"
                ref={el => el && el.focus()}
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="sidebar-window-content">
              {categories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      closeWindow('category-window');
                    }}
                    className={`sidebar-window-button ${selectedCategory === category.id ? 'active' : ''}`}
                    aria-pressed={selectedCategory === category.id}
                  >
                    <div className="sidebar-window-button-icon">
                      <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="sidebar-window-button-content">
                      <div className="sidebar-window-button-title">{category.name}</div>
                      <div className="sidebar-window-button-description">{category.description}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Mode Window */}
      <AnimatePresence>
        {showWindows['view-mode-window'] && (
          <motion.div 
            className={`fixed top-0 bottom-0 z-[5998] sidebar-window h-full ${
              isSidebarExpanded && window.innerWidth >= 768 
                ? 'left-[16rem] xl:left-[16rem] lg:left-[16rem] md:left-[16rem] w-[380px]' 
                : 'left-[5rem] w-[380px]'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.4 
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-mode-window-title"
            tabIndex={-1}
          >
            <div className="sidebar-window-header">
              <h2 id="view-mode-window-title">View Mode</h2>
              <button 
                onClick={() => closeWindow('view-mode-window')}
                aria-label="Close view mode window"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="sidebar-window-content">
              {viewModes.map((mode, index) => {
                const IconComponent = mode.icon;
                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setViewMode(mode.id);
                      closeWindow('view-mode-window');
                    }}
                    className={`sidebar-window-button ${viewMode === mode.id ? 'active' : ''}`}
                    aria-pressed={viewMode === mode.id}
                  >
                    <div className="sidebar-window-button-icon">
                      <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="sidebar-window-button-content">
                      <div className="sidebar-window-button-title">{mode.name}</div>
                      <div className="sidebar-window-button-description">{mode.description}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Type Window */}
      <AnimatePresence>
        {showWindows['map-type-window'] && (
          <motion.div 
            className={`fixed top-0 bottom-0 z-[5997] sidebar-window h-full ${
              isSidebarExpanded && window.innerWidth >= 768 
                ? 'left-[16rem] xl:left-[16rem] lg:left-[16rem] md:left-[16rem] w-[380px]' 
                : 'left-[5rem] w-[380px]'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.4 
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-type-window-title"
            tabIndex={-1}
          >
            <div className="sidebar-window-header">
              <h2 id="map-type-window-title">Map Type</h2>
              <button 
                onClick={() => closeWindow('map-type-window')}
                aria-label="Close map type window"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="sidebar-window-content">
              {mapTypes.map((mapTypeOption, index) => {
                const IconComponent = mapTypeOption.icon;
                return (
                  <motion.button
                    key={mapTypeOption.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMapType(mapTypeOption.id);
                      closeWindow('map-type-window');
                    }}
                    className={`sidebar-window-button ${mapType === mapTypeOption.id ? 'active' : ''}`}
                    aria-pressed={mapType === mapTypeOption.id}
                  >
                    <div className="sidebar-window-button-icon">
                      <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="sidebar-window-button-content">
                      <div className="sidebar-window-button-title">{mapTypeOption.name}</div>
                      <div className="sidebar-window-button-description">{mapTypeOption.description}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Posts Window */}
      <AnimatePresence>
        {showWindows['saved-locations-window'] && (
          <motion.div 
            className={`fixed top-0 bottom-0 z-[5996] sidebar-window h-full ${
              isSidebarExpanded && window.innerWidth >= 768 
                ? 'left-[16rem] xl:left-[16rem] lg:left-[16rem] md:left-[16rem] w-[380px]' 
                : 'left-[5rem] w-[380px]'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.4 
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-locations-window-title"
            tabIndex={-1}
          >
            <div className="sidebar-window-header">
              <h2 id="saved-locations-window-title">Saved Locations</h2>
              <button 
                onClick={() => closeWindow('saved-locations-window')}
                aria-label="Close saved locations window"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="sidebar-window-content">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center text-base">
                  <Bookmark className="h-5 w-5 mr-2.5" aria-hidden="true" />
                  Saved Posts ({favoritePosts.size})
                </h4>
                {posts.filter(post => post.id && favoritePosts.has(post.id)).length > 0 ? (
                  <div className="space-y-2">
                    {posts.filter(post => post.id && favoritePosts.has(post.id)).map((post, index) => (
                      <motion.div 
                        key={`fav-${post.id}`} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-white rounded-lg flex justify-between items-start cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            closeWindow('saved-locations-window');
                          }}
                        >
                          <div className="font-bold text-gray-800 mb-1.5">{post.title}</div>
                          <div className="text-sm text-gray-600 line-clamp-2 mb-2">{post.description?.substring(0, 60)}{post.description?.length > 60 ? '...' : ''}</div>
                          <div className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {post.category || "general"}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePostBookmark(post);
                          }}
                          className="ml-2 p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                          disabled={bookmarkLoading === post.id}
                          aria-label={`Remove ${post.title} from saved posts`}
                        >
                          {bookmarkLoading === post.id ? (
                            <div className="h-4 w-4 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            </div>
                          ) : (
                            <X className="h-4 w-4" aria-hidden="true" />
                          )}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 text-center py-6 text-base"
                  >
                    No saved posts yet
                  </motion.p>
                )}
              </div>
              
              {/* Follow User Location Toggle */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center text-base">
                  <Navigation className="h-5 w-5 mr-2.5" aria-hidden="true" />
                  Location Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-gray-800">Follow My Location</div>
                      <div className="text-sm text-gray-600">Map updates to show your current position</div>
                    </div>
                    <button
                      onClick={() => {
                        if (followUser) {
                          updateUserLocation();
                        } else {
                          updateUserLocation();
                        }
                        closeWindow('saved-locations-window');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        followUser ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={followUser}
                      aria-label="Toggle location following"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          followUser ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      updateUserLocation();
                      closeWindow('saved-locations-window');
                    }}
                    className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-5 w-5" aria-hidden="true" />
                    Update Current Location
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSavedLocationsOnMap(!showSavedLocationsOnMap);
                    }}
                    className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      showSavedLocationsOnMap 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Bookmark className="h-5 w-5" aria-hidden="true" />
                    {showSavedLocationsOnMap ? 'Hide Saved Locations' : 'Show Saved Locations'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSidebarWindows;