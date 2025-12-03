import React, { useState, useEffect } from 'react';
import { Menu, X, Search, MapPin, Grid3X3, Bookmark, Navigation, Home, User, Settings, LogOut, Heart, Star, Bell } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ 
  onLogout = () => {}, 
  user = null,
  toggleWindow = () => {},
  showSavedLocationsOnMap = false,
  updateUserLocation = () => {},
  followUser = false,
  locationLoading = false,
  setFollowUser = () => {},
  isSidebarExpanded,
  toggleSidebar
}) => {

  // Define sidebar items with icons and labels
  const sidebarItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      requiresAuth: false,
      action: null,
      type: 'link'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/discover',
      requiresAuth: true,
      action: null, // Will be handled differently
      type: 'link'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: MapPin,
      path: '/discover',
      requiresAuth: false,
      action: () => toggleWindow('category-window'),
      type: 'action'
    },
    {
      id: 'view-mode',
      label: 'View Mode',
      icon: Grid3X3,
      path: '/discover',
      requiresAuth: false,
      action: () => toggleWindow('view-mode-window'),
      type: 'action'
    },
    {
      id: 'map-type',
      label: 'Map Type',
      icon: MapPin,
      path: '/discover',
      requiresAuth: false,
      action: () => toggleWindow('map-type-window'),
      type: 'action'
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: Bookmark,
      path: '/discover',
      requiresAuth: true,
      action: () => toggleWindow('saved-locations-window'),
      type: 'action'
    },
    {
      id: 'my-location',
      label: 'My Location',
      icon: Navigation,
      path: '/discover',
      requiresAuth: false,
      action: () => {
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
      },
      type: 'action'
    }
  ];

  // Filter items based on authentication status
  const filteredItems = user 
    ? sidebarItems 
    : sidebarItems.filter(item => !item.requiresAuth);

  return (
    <div className={`z-[5000] h-screen fixed left-0 top-0 ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Full-height container with scroll for overflow */}
      <div className="h-full flex flex-col justify-start">
        <div className="sidebar-container flex-grow">
          <div className="flex flex-col">
            {/* Menu toggle button - always visible at the top */}
            <button
              onClick={toggleSidebar}
              className="sidebar-button border-b border-gray-200"
              title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="sidebar-button-icon-wrapper">
                {isSidebarExpanded ? <X className="sidebar-button-icon" /> : <Menu className="sidebar-button-icon" />}
              </div>
              {isSidebarExpanded && <span className="sidebar-button-text">Menu</span>}
            </button>
            
            {/* Sidebar menu items */}
            {filteredItems.map((item) => {
              const IconComponent = item.icon;
              return item.type === 'link' ? (
                <a
                  key={item.id}
                  href={item.path}
                  className="sidebar-button border-b border-gray-200"
                  title={item.label}
                >
                  <div className="sidebar-button-icon-wrapper">
                    <IconComponent className="sidebar-button-icon" />
                  </div>
                  {isSidebarExpanded && <span className="sidebar-button-text">{item.label}</span>}
                </a>
              ) : (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`sidebar-button border-b border-gray-200 ${
                    item.id === 'saved' && showSavedLocationsOnMap 
                      ? 'saved-locations' 
                      : ''
                  } ${
                    item.id === 'my-location' && followUser 
                      ? 'following-location' 
                      : ''
                  }`}
                  title={
                    item.id === 'saved' 
                      ? user 
                        ? `${showSavedLocationsOnMap ? 'Hide' : 'Show'} saved locations` 
                        : 'Login to view saved locations'
                      : item.id === 'my-location'
                        ? followUser ? "Stop Following Location" : "Show My Location"
                        : item.label
                  }
                  disabled={item.id === 'my-location' && locationLoading}
                >
                  <div className={`sidebar-button-icon-wrapper ${
                    item.id === 'saved' && showSavedLocationsOnMap 
                      ? 'bg-yellow-100' 
                      : item.id === 'my-location' && followUser
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                  }`}>
                    {item.id === 'my-location' && locationLoading ? (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <IconComponent 
                        className={`sidebar-button-icon ${
                          item.id === 'saved' && showSavedLocationsOnMap 
                            ? 'text-yellow-600 fill-current' 
                            : item.id === 'my-location' && followUser
                              ? 'text-blue-600'
                              : ''
                        }`} 
                      />
                    )}
                  </div>
                  {isSidebarExpanded && <span className="sidebar-button-text">{item.label}</span>}
                </button>
              );
            })}
            
            {/* Profile and Logout buttons for authenticated users */}
            {user && (
              <>
                <a
                  href="/profile"
                  className="sidebar-button border-b border-gray-200"
                  title="Profile"
                >
                  <div className="sidebar-button-icon-wrapper">
                    <User className="sidebar-button-icon" />
                  </div>
                  {isSidebarExpanded && <span className="sidebar-button-text">Profile</span>}
                </a>
                
                <button
                  onClick={onLogout}
                  className="sidebar-button border-b border-gray-200"
                  title="Logout"
                >
                  <div className="sidebar-button-icon-wrapper bg-red-100">
                    <LogOut className="sidebar-button-icon text-red-600" />
                  </div>
                  {isSidebarExpanded && <span className="sidebar-button-text">Logout</span>}
                </button>
              </>
            )}
            
            {/* Login button for unauthenticated users */}
            {!user && (
              <a
                href="/login"
                className="sidebar-button border-b border-gray-200"
                title="Login"
              >
                <div className="sidebar-button-icon-wrapper bg-blue-100">
                  <User className="sidebar-button-icon text-blue-600" />
                </div>
                {isSidebarExpanded && <span className="sidebar-button-text">Login</span>}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;