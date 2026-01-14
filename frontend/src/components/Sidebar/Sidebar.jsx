import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, MapPin, Grid3X3, Bookmark, Navigation, Home, User, Settings, LogOut, Heart, Star, Bell, Compass, Layers, Minus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
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
  toggleSidebar,
  isMobile = false,
  mobileBottomNavActive = '',
  setMobileBottomNavActive = () => {},
  showBottomNav = true,
  setShowBottomNav = () => {},
  activeSidebarWindow = null,
  setActiveSidebarWindow = () => {}
}) => {
  // Ref for the navigation container
  const navRef = useRef(null);

  // State for scroll indicators
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);

  // Effect to handle scroll indicators
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
        setShowLeftIndicator(scrollLeft > 0);
        setShowRightIndicator(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    const navElement = navRef.current;
    if (navElement) {
      // Initial check
      handleScroll();

      // Add scroll listener
      navElement.addEventListener('scroll', handleScroll);

      // Also listen for resize events to update indicators
      window.addEventListener('resize', handleScroll);

      // Cleanup
      return () => {
        navElement.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, []);


  // Define sidebar items with icons and labels
  const sidebarItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      requiresAuth: false,
      action: null,
      type: 'link',
      mobileOnly: false
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      path: null,
      requiresAuth: false,
      action: () => setMobileBottomNavActive('search'),
      type: 'action',
      mobileOnly: true
    },
    {
      id: 'categories',
      label: 'Explore',
      icon: MapPin,
      path: '/discover',
      requiresAuth: false,
      action: () => {
        if (isMobile) {
          setMobileBottomNavActive('explore');
          toggleWindow('category-window');
        } else {
          toggleWindow('category-window');
        }
      },
      type: 'action',
      mobileOnly: false
    },
    {
      id: 'map-type',
      label: 'Layers',
      icon: Layers,
      path: '/discover',
      requiresAuth: false,
      action: () => {
        if (isMobile) {
          setMobileBottomNavActive('layers');
          toggleWindow('map-type-window');
        } else {
          toggleWindow('map-type-window');
        }
      },
      type: 'action',
      mobileOnly: false
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: Bookmark,
      path: '/discover',
      requiresAuth: true,
      action: () => {
        if (isMobile) {
          setMobileBottomNavActive('saved');
          toggleWindow('saved-locations-window');
        } else {
          toggleWindow('saved-locations-window');
        }
      },
      type: 'action',
      mobileOnly: false
    },
    {
      id: 'my-location',
      label: 'Location',
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
      type: 'action',
      mobileOnly: false
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      path: null,
      requiresAuth: true,
      action: () => {
        if (isMobile) {
          setMobileBottomNavActive('alerts');
          toggleWindow('notifications-window');
        } else {
          toggleWindow('notifications-window');
        }
      },
      type: 'action',
      mobileOnly: false
    }
  ];

  // Filter items based on authentication status and mobile/desktop
  const filteredItems = sidebarItems.filter(item => {
    // Filter by auth status
    if (item.requiresAuth && !user) {
      return false;
    }

    // Don't show mobile-only items on desktop sidebar
    if (!isMobile && item.mobileOnly) {
      return false;
    }

    // For mobile, show all items except mobile-only items in the sidebar drawer
    // (mobile-only items are shown in the bottom nav, not in the sidebar drawer)
    if (isMobile && item.mobileOnly) {
      return false;
    }

    return true;
  });

  // Mobile bottom navigation items (for all users)
  const mobileNavItems = sidebarItems.filter(item =>
    (!item.requiresAuth || (user && user._id)) && !item.mobileOnly
  ); // Show all available items for the user

  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation */}
        {showBottomNav && (
          <div className="bottom-navigation-container relative">
            {/* Toggle arrow button in top-right corner */}
            <button
              className="toggle-arrow-button absolute -top-14 right-0 z-[5002]"
              onClick={() => setShowBottomNav(false)}
              title="Hide navigation"
            >
              <ChevronDown className="h-4 w-4 text-gray-700" />
            </button>

            {/* Left scroll indicator */}
            <div
              className={`scroll-indicator left-0 top-1/2 transform -translate-y-1/2 z-[5001] transition-opacity duration-300 pointer-events-auto ${showLeftIndicator ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => {
                if (navRef.current) {
                  navRef.current.scrollBy({ left: -100, behavior: 'smooth' });
                }
              }}
            >
              <div className="bg-white rounded-full shadow-lg p-1.5 cursor-pointer">
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </div>
            </div>

            {/* Scrollable bottom navigation */}
            <div
              className="bottom-navigation hide-scrollbar flex"
              ref={navRef}
            >
              {mobileNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = mobileBottomNavActive === item.id;

                return (
                  <button
                    key={item.id}
                    className={`bottom-nav-item flex-shrink-0 whitespace-nowrap ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setMobileBottomNavActive(item.id);
                      if (item.action) item.action();
                    }}
                    title={item.label}
                  >
                    <IconComponent className="bottom-nav-icon" />
                    <span className="bottom-nav-label">{item.label}</span>
                  </button>
                );
              })}

              {/* Login/Profile button for mobile */}
              {!user ? (
                <Link
                  to="/login"
                  className="bottom-nav-item flex-shrink-0 whitespace-nowrap"
                  title="Login"
                >
                  <User className="bottom-nav-icon" />
                  <span className="bottom-nav-label">Login</span>
                </Link>
              ) : (
                <Link
                  to={user?.role === "admin" ? "/admin/dashboard" : "/profile"}
                  className="bottom-nav-item flex-shrink-0 whitespace-nowrap"
                  title="Profile"
                >
                  <User className="bottom-nav-icon" />
                  <span className="bottom-nav-label">Profile</span>
                </Link>
              )}
            </div>

            {/* Right scroll indicator */}
            <div
              className={`scroll-indicator right-0 top-1/2 transform -translate-y-1/2 z-[5001] transition-opacity duration-300 pointer-events-auto ${showRightIndicator ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => {
                if (navRef.current) {
                  navRef.current.scrollBy({ left: 100, behavior: 'smooth' });
                }
              }}
            >
              <div className="bg-white rounded-full shadow-lg p-1.5 cursor-pointer">
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </div>
        )}
        {/* Show button when bottom navigation is minimized */}
        {!showBottomNav && (
          <div className="fixed bottom-0 left-0 right-0 z-[5000]">
            {/* Show button with reduced height */}
            <div className="flex justify-end">
              <button
                className="toggle-arrow-button absolute bottom-0 right-0 p-2"
                onClick={() => setShowBottomNav(true)}
                title="Show navigation"
              >
                <ChevronUp className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Drawer */}
        <div className={`mobile-sidebar-drawer ${isSidebarExpanded ? 'active' : ''}`}>
          <button className="close-mobile-sidebar" onClick={toggleSidebar}>
            <X size={20} />
          </button>

          <div className="h-full flex flex-col justify-start pt-12">
            <div className="sidebar-container flex-grow overflow-y-auto">
              <div className="flex flex-col">
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
                      <span className="sidebar-button-text">{item.label}</span>
                    </a>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        toggleSidebar(); // Close drawer after action
                      }}
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
                      <span className="sidebar-button-text">{item.label}</span>
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
                      <span className="sidebar-button-text">Profile</span>
                    </a>

                    <button
                      onClick={() => {
                        onLogout();
                        toggleSidebar(); // Close drawer after logout
                      }}
                      className="sidebar-button border-b border-gray-200"
                      title="Logout"
                    >
                      <div className="sidebar-button-icon-wrapper bg-red-100">
                        <LogOut className="sidebar-button-icon text-red-600" />
                      </div>
                      <span className="sidebar-button-text">Logout</span>
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
                    <span className="sidebar-button-text">Login</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarExpanded && (
          <div
            className="mobile-sidebar-overlay active"
            onClick={toggleSidebar}
          ></div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className={`z-[5000] h-screen fixed left-0 top-0 ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${window.innerWidth <= 768 && isSidebarExpanded ? 'sidebar-visible' : ''}`}
         style={window.innerWidth <= 768 ? { height: 'calc(100vh - 60px)' } : {}}>
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
              if (item.mobileOnly) return null; // Skip mobile-only items on desktop

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