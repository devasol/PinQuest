import React, { useState, useEffect, useCallback, memo } from 'react';
import { MapPin, Grid3X3, Bookmark, Navigation, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './MapSidebar.css';

// Memoized button component to prevent unnecessary re-renders
const SidebarButton = memo(({ id, icon: Icon, label, onClick, isActive, showText, disabled, isLoading, className = "" }) => {
  const handleClick = useCallback(() => {
    if (!disabled && !isLoading) onClick(id);
  }, [id, onClick, disabled, isLoading]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`sidebar-button border-b border-gray-200 dark:border-slate-800 ${isActive ? 'active-sidebar-btn' : ''} ${className}`}
      title={label}
    >
      <div className={`sidebar-button-icon-wrapper ${
        isActive 
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
      }`}>
        {isLoading ? (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <Icon className={`sidebar-button-icon ${isActive && id === 'saved-locations-window' ? 'fill-current' : ''}`} />
        )}
      </div>
      {showText && <span className="sidebar-button-text dark:text-gray-200">{label}</span>}
    </motion.button>
  );
});

SidebarButton.displayName = 'SidebarButton';

const MapSidebar = memo(({ 
  toggleWindow,
  showSavedLocationsOnMap,
  followUser,
  locationLoading,
  updateUserLocation,
  setFollowUser
}) => {
  const [showText, setShowText] = useState(false); // Start with sidebar collapsed by default (icon only)

  const toggleTextDisplay = useCallback(() => {
    setShowText(prev => !prev);
  }, []);

  // Initialize CSS variable when component mounts and update based on showText state
  useEffect(() => {
    const updateSidebarWidth = (expanding) => {
      if (expanding) {
        document.documentElement.style.setProperty('--sidebar-width', '256px'); // w-64 = 16rem = 256px
        document.body.classList.add('sidebar-expanded-windows');
        document.body.classList.remove('sidebar-collapsed');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '80px'); // w-20 = 5rem = 80px
        document.body.classList.add('sidebar-collapsed');
        document.body.classList.remove('sidebar-expanded-windows');
      }
    };
    
    updateSidebarWidth(showText);
  }, []); // Run once on mount to set initial state

  // Update CSS variable and body class based on showText state after mount
  useEffect(() => {
    if (showText) {
      document.documentElement.style.setProperty('--sidebar-width', '256px'); 
      document.body.classList.add('sidebar-expanded-windows');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '80px'); 
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded-windows');
    }
  }, [showText]);

  const handleCurrentLocationClick = useCallback(() => {
    if (followUser) {
      updateUserLocation();
      setFollowUser(false);
    } else {
      updateUserLocation().then(() => {
        setFollowUser(true);
      });
    }
  }, [followUser, updateUserLocation, setFollowUser]);

  return (
    <div className={`z-[1000] h-screen ${showText ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <div className="h-full flex flex-col justify-start">
        <div className="sidebar-container flex-grow">
          <div className="flex flex-col">
            {/* Menu toggle button */}
            <SidebarButton 
              id="toggle-menu"
              icon={showText ? X : Menu}
              label={showText ? "Close sidebar" : "Open sidebar"}
              onClick={toggleTextDisplay}
              showText={showText}
            />
            
            <SidebarButton 
              id="category-window"
              icon={MapPin}
              label="Categories"
              onClick={toggleWindow}
              showText={showText}
            />
            
            <SidebarButton 
              id="view-mode-window"
              icon={Grid3X3}
              label="View Mode"
              onClick={toggleWindow}
              showText={showText}
            />
            
            <SidebarButton 
              id="map-type-window"
              icon={MapPin}
              label="Map Type"
              onClick={toggleWindow}
              showText={showText}
            />
            
            <SidebarButton 
              id="saved-locations-window"
              icon={Bookmark}
              label="Saved"
              isActive={showSavedLocationsOnMap}
              onClick={toggleWindow}
              showText={showText}
              className={showSavedLocationsOnMap ? 'saved-locations' : ''}
            />
            
            <SidebarButton 
              id="my-location"
              icon={Navigation}
              label="My Location"
              isActive={followUser}
              onClick={handleCurrentLocationClick}
              showText={showText}
              isLoading={locationLoading}
              className={followUser ? 'following-location' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

MapSidebar.displayName = 'MapSidebar';

export default MapSidebar;