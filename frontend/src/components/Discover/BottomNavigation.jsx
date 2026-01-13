import React from 'react';
import { Home, MapPin, Grid3X3, Bookmark, Navigation, User } from 'lucide-react';

const BottomNavigation = ({ 
  isAuthenticated, 
  toggleWindow = () => {}, 
  updateUserLocation = () => {},
  className = ""
}) => {
  return (
    <div className={`bottom-nav ${className}`}>
      <button className="bottom-nav-item" onClick={() => window.location.href = '/'}>
        <Home className="bottom-nav-icon" />
        <span className="bottom-nav-label">Home</span>
      </button>
      <button className="bottom-nav-item" onClick={() => toggleWindow('category-window')}>
        <MapPin className="bottom-nav-icon" />
        <span className="bottom-nav-label">Explore</span>
      </button>
      <button className="bottom-nav-item" onClick={() => toggleWindow('map-type-window')}>
        <Grid3X3 className="bottom-nav-icon" />
        <span className="bottom-nav-label">Map</span>
      </button>
      {isAuthenticated && (
        <button className="bottom-nav-item" onClick={() => toggleWindow('saved-locations-window')}>
          <Bookmark className="bottom-nav-icon" />
          <span className="bottom-nav-label">Saved</span>
        </button>
      )}
      <button className="bottom-nav-item" onClick={updateUserLocation}>
        <Navigation className="bottom-nav-icon" />
        <span className="bottom-nav-label">Location</span>
      </button>
    </div>
  );
};

export default BottomNavigation;