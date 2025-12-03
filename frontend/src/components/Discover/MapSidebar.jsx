import React, { useState, useEffect } from 'react';
import { Search, MapPin, Grid3X3, Bookmark, Navigation, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './MapSidebar.css';

const MapSidebar = ({ 
  toggleWindow,
  showSavedLocationsOnMap,
  followUser,
  locationLoading,
  updateUserLocation,
  setFollowUser
}) => {
  const [showText, setShowText] = useState(false); // Start with sidebar collapsed by default (icon only)

  const toggleTextDisplay = () => {
    setShowText(!showText);
  };

  // Initialize CSS variable when component mounts and update based on showText state
  useEffect(() => {
    // Set initial state based on default showText value
    if (showText) {
      document.documentElement.style.setProperty('--sidebar-width', '256px'); // w-64 = 16rem = 256px
      document.body.classList.add('sidebar-expanded-windows');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '80px'); // w-20 = 5rem = 80px
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded-windows');
    }
  }, []); // Run once on mount to set initial state

  // Update CSS variable and body class based on showText state after mount
  useEffect(() => {
    if (showText) {
      document.documentElement.style.setProperty('--sidebar-width', '256px'); // w-64 = 16rem = 256px
      document.body.classList.add('sidebar-expanded-windows');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '80px'); // w-20 = 5rem = 80px
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded-windows');
    }
  }, [showText]);

  return (
    <div className={`z-[1000] h-screen ${showText ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Full-height container with scroll for overflow */}
      <div className="h-full flex flex-col justify-start">
        <div className="sidebar-container flex-grow">
          <div className="flex flex-col">
            {/* Menu toggle button - always visible at the top */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTextDisplay}
              className="sidebar-button border-b border-gray-200"
              title={showText ? "Close sidebar" : "Open sidebar"}
            >
              <div className="sidebar-button-icon-wrapper bg-gray-100">
                {showText ? <X className="sidebar-button-icon" /> : <Menu className="sidebar-button-icon" />}
              </div>
              {showText && <span className="sidebar-button-text">Menu</span>}
            </motion.button>
            
            {/* Search button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWindow('search-window')}
              className="sidebar-button border-b border-gray-200"
              title="Search"
            >
              <div className="sidebar-button-icon-wrapper bg-gray-100">
                <Search className="sidebar-button-icon" />
              </div>
              {showText && <span className="sidebar-button-text">Search</span>}
            </motion.button>
            
            {/* Categories button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWindow('category-window')}
              className="sidebar-button border-b border-gray-200"
              title="Categories"
            >
              <div className="sidebar-button-icon-wrapper bg-gray-100">
                <MapPin className="sidebar-button-icon" />
              </div>
              {showText && <span className="sidebar-button-text">Categories</span>}
            </motion.button>
            
            {/* View mode button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWindow('view-mode-window')}
              className="sidebar-button border-b border-gray-200"
              title="View Mode"
            >
              <div className="sidebar-button-icon-wrapper bg-gray-100">
                <Grid3X3 className="sidebar-button-icon" />
              </div>
              {showText && <span className="sidebar-button-text">View Mode</span>}
            </motion.button>
            
            {/* Map type button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWindow('map-type-window')}
              className="sidebar-button border-b border-gray-200"
              title="Map Type"
            >
              <div className="sidebar-button-icon-wrapper bg-gray-100">
                <MapPin className="sidebar-button-icon" />
              </div>
              {showText && <span className="sidebar-button-text">Map Type</span>}
            </motion.button>
            
            {/* Saved locations button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWindow('saved-locations-window')}
              className={`sidebar-button ${showSavedLocationsOnMap ? 'saved-locations' : ''}`}
              title={showSavedLocationsOnMap ? 'Hide saved locations' : 'Show saved locations'}
            >
              <div className={`sidebar-button-icon-wrapper ${showSavedLocationsOnMap ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <Bookmark className={`sidebar-button-icon ${showSavedLocationsOnMap ? 'text-yellow-600 fill-current' : ''}`} />
              </div>
              {showText && <span className="sidebar-button-text">Saved</span>}
            </motion.button>
            
            {/* Current location button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (followUser) {
                  // If currently following, just update location without zooming
                  updateUserLocation();
                  setFollowUser(false); // Turn off follow mode
                } else {
                  // If not following, update and enable follow mode
                  updateUserLocation().then(() => {
                    setFollowUser(true); // Turn on follow mode after getting location
                  });
                }
              }}
              className={`sidebar-button ${followUser ? 'following-location' : ''}`}
              title={followUser ? "Stop Following Location" : "Show My Location"}
              disabled={locationLoading}
            >
              <div className={`sidebar-button-icon-wrapper ${followUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {locationLoading ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <Navigation className={`sidebar-button-icon ${followUser ? 'text-blue-600' : ''}`} />
                )}
              </div>
              {showText && <span className="sidebar-button-text">My Location</span>}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSidebar;