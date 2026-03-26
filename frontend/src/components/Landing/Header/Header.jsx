import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Bell, User, MapPin, ChevronDown, Check, Trash2, Sun, Moon } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { connectSocket, getSocket, disconnectSocket } from "../../../services/socketService";
import { API_BASE_URL } from "../../../utils/config";
import SearchBar from "../../Search/SearchBar";

const Header = ({ isDiscoverPage = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef();

  const handleLogout = () => {
    logout(); // Clear authentication state
    navigate("/"); // Redirect to home page after logout
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch notifications when user is authenticated and set up socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to socket
    const socket = connectSocket(token);

    // Fetch notifications on mount and periodically
    const fetchNotifications = async () => {
      try {
        // Fetch unread count
        const countResponse = await fetch(
          `${API_BASE_URL}/notifications/unread-count`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setUnreadCount(countData.data?.count || 0);
        } else {
          console.error('Failed to fetch unread count:', countResponse.status, countResponse.statusText);
        }

        // Fetch recent notifications to display in dropdown
        const notifResponse = await fetch(
          `${API_BASE_URL}/notifications?page=1&limit=5`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          setNotifications(notifData.data?.notifications || []);
        } else {
          console.error('Failed to fetch notifications:', notifResponse.status, notifResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up socket listeners for real-time notifications
    socket.on('newNotification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Add new notification, keep only 5 most recent
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notificationRead', (data) => {
      // Update local state when a notification is marked as read from elsewhere
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === data.notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Set up polling as backup if socket fails
    const interval = setInterval(fetchNotifications, 30000);

    // Cleanup function
    return () => {
      socket.off('newNotification');
      socket.off('notificationRead');
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);


  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        const notificationButton = event.target.closest('button[aria-label="Notifications"]');
        
        if (isNotificationOpen && !notificationButton) {
          setIsNotificationOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  const navigationItems = [
    { name: "Discover", to: "/" },
  ];

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close mobile search when opening menu
    if (!isMenuOpen) setIsMobileSearchOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[7000] transition-all duration-300 ${
        isDiscoverPage
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-slate-800"
          : isScrolled
          ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-slate-800"
          : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={() => {
              if (isMenuOpen) setIsMenuOpen(false);
              if (isMobileSearchOpen) setIsMobileSearchOpen(false);
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shrink-0">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              PinQuest
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 ml-8 z-50">
            {navigationItems.map((item) => {
              const isInternalLink = item.to && item.to.startsWith("/");
              return isInternalLink ? (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `font-medium transition-all duration-300 ${
                      isActive || (item.to === "/" && (window.location.pathname === "/" || window.location.pathname === "/discover"))
                        ? "text-blue-600 pb-1 border-b-2 border-blue-600"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`
                  }
                  onClick={() => {
                    if (isMenuOpen) setIsMenuOpen(false);
                  }}
                >
                  {item.name}
                </NavLink>
              ) : (
                <a
                  key={item.name}
                  href={item.href || item.to}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
                  onClick={() => {
                    if (isMenuOpen) setIsMenuOpen(false);
                  }}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Search Bar - Visible from lg screens up */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4 lg:mx-8">
            <SearchBar
              placeholder="Search locations..."
              className="w-full"
              onLocationSelect={(location) => {
                navigate('/discover');
              }}
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-4 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Mobile/Tablet Search Button */}
            <button
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsMenuOpen(false); // Close menu when opening search
              }}
              aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && isAuthenticated && (
                <div 
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 z-[7001]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div 
                            key={notification._id} 
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                            onClick={() => {
                              markNotificationAsRead(notification._id);
                              // Navigate to the relevant post
                              if (notification.post) {
                                navigate(`/discover#${notification.post}`);
                              }
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"} text-gray-800`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatNotificationDate(notification.date)}
                                </p>
                              </div>
                              {!notification.read && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification._id);
                                  }}
                                  className="ml-2 text-gray-400 hover:text-blue-600"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <Bell className="mx-auto h-10 w-10 text-gray-300" />
                        <h3 className="mt-2 font-medium text-gray-900">No notifications</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          You'll see notifications here when they arrive.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Login button for unauthenticated users or Profile/Logout button for authenticated users */}
            {isAuthenticated ? (
              // Profile and Logout buttons for logged in users
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to={user?.role === "admin" ? "/admin/dashboard" : "/profile"}
                  className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="hidden lg:block font-medium max-w-[80px] truncate text-sm">
                    {user?.name ||
                      (user?.role === "admin" ? "Admin" : "Profile")}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Login button for unauthenticated users
              <Link
                to="/login"
                className="hidden md:flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                <span className="font-medium">Login</span>
                <User className="h-4 w-4" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Search Bar - Only shown when search is toggled */}
        {isMobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3">
            <SearchBar
              placeholder="Search locations..."
              autoFocus={false}
              onLocationSelect={(location) => {
                // Navigate to discover page and show the selected location
                navigate('/discover');
                setIsMobileSearchOpen(false);
                // In a real implementation, you might want to pass the location data to the discover page
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-lg z-[7002]">
          <div className="px-4 py-2 space-y-1">
            {/* Mobile navigation items */}
            {navigationItems.map((item) => {
              const isInternalLink = item.to && item.to.startsWith("/");
              return isInternalLink ? (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-3 font-medium transition-all duration-300 ${
                      isActive || (item.to === "/" && (window.location.pathname === "/" || window.location.pathname === "/discover"))
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              ) : (
                <a
                  key={item.name}
                  href={item.href || item.to}
                  className="block px-3 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              );
            })}

            {/* Auth section for mobile */}
            {isAuthenticated ? (
              <>
                <Link
                  to={user?.role === "admin" ? "/admin/dashboard" : "/profile"}
                  className="block px-3 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors duration-200 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {user?.name ||
                    (user?.role === "admin" ? "Admin Dashboard" : "Profile")}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-center font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
