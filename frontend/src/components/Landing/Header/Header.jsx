import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Bell, User, MapPin } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";

const Header = ({ isDiscoverPage = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");



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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
      // Add your search logic here
    }
  };

  const navigationItems = [
    { name: "Discover", to: "/discover" },
    { name: "Categories", to: "/categories" },
    { name: "Maps", to: "/maps" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDiscoverPage
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PinQuest
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-8">
            {navigationItems.map((item) => {
              const isInternalLink = item.to && item.to.startsWith("/");
              return isInternalLink ? (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-gray-700 font-medium transition-all duration-300 transform hover:scale-105 ${
                      isActive 
                        ? 'text-blue-600 pb-1 border-b-2 border-blue-600' 
                        : 'hover:text-blue-600'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ) : (
                <a
                  key={item.name}
                  href={item.href || item.to}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                >
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search locations, pins, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Button */}
            <button className="lg:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Login button for unauthenticated users or Profile/Logout button for authenticated users */}
            {isAuthenticated ? (
              // Profile and Logout buttons for logged in users
              <div className="flex items-center space-x-2">
                <Link
                  to={user?.role === 'admin' ? "/admin/dashboard" : "/profile"}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block font-medium">
                    {user?.name || (user?.role === 'admin' ? "Admin Dashboard" : "Profile")}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Login button for unauthenticated users
              <Link
                to="/login"
                className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                <span className="hidden sm:block font-medium">Login</span>
                <User className="h-4 w-4" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search locations, pins, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => {
              const isInternalLink = item.to && item.to.startsWith("/");
              return isInternalLink ? (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-3 py-2 font-medium transition-all duration-300 ${
                      isActive 
                        ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
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
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              );
            })}
            <Link
              to={isAuthenticated && user?.role === 'admin' ? "/admin/dashboard" : "/profile"}
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              {isAuthenticated && user?.role === 'admin' ? "Admin Dashboard" : "Profile"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
