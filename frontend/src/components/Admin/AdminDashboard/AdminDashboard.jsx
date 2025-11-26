import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MapPin, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  BarChart3,
  Shield,
  Bell,
  User
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
        // If parsing fails, redirect to login
        navigate('/admin/login');
      }
    } else {
      // If no user data, redirect to admin login
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  const sidebarItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/admin/analytics'
    },
    {
      icon: Users,
      label: 'Users',
      path: '/admin/users'
    },
    {
      icon: MapPin,
      label: 'Posts',
      path: '/admin/posts'
    },
    {
      icon: Shield,
      label: 'Security',
      path: '/admin/security'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings'
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon">
              <Shield className="admin-logo-icon-svg" />
            </div>
            <span className="admin-logo-text">Admin Panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <ul className="admin-sidebar-menu">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={index} className="admin-sidebar-menu-item">
                  <Link 
                    to={item.path} 
                    className={`admin-sidebar-menu-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="admin-sidebar-menu-icon" />
                    <span className="admin-sidebar-menu-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            onClick={handleLogout}
            className="admin-sidebar-logout"
          >
            <LogOut className="admin-sidebar-menu-icon" />
            <span className="admin-sidebar-menu-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button 
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="admin-menu-icon" /> : <Menu className="admin-menu-icon" />}
          </button>

          <div className="admin-header-content">
            <h1 className="admin-header-title">
              {location.pathname.includes('/users') ? 'User Management' :
               location.pathname.includes('/posts') ? 'Content Management' :
               location.pathname.includes('/security') ? 'Security Settings' :
               location.pathname.includes('/analytics') ? 'Analytics Dashboard' :
               'Dashboard'}
            </h1>
            <div className="admin-header-user">
              <div className="admin-user-avatar">
                <User className="admin-user-icon" />
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{user.name || user.email || 'Admin User'}</span>
                <span className="admin-user-role">{user.role || 'Administrator'}</span>
              </div>
              <button className="admin-notifications-btn">
                <Bell className="admin-notifications-icon" />
                <span className="admin-notifications-badge">3</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="admin-dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;