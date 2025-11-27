import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  UserPlus, 
  Activity, 
  Eye, 
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminNotifications({ 
        page,
        limit: 10,
        type: selectedType === 'all' ? undefined : selectedType,
        read: 'all' // Show all notifications in admin panel
      });
      
      if (response.status === 'success') {
        setNotifications(response.data.notifications || []);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalNotifications(response.data.pagination.totalNotifications || 0);
      } else {
        setError(response.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount and when filters change
  useEffect(() => {
    fetchNotifications(currentPage);
  }, [selectedType, currentPage]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await adminAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await adminAPI.markAllAdminNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'report':
        return <MessageSquare className="w-5 h-5" />;
      case 'new_user':
        return <UserPlus className="w-5 h-5" />;
      case 'moderation':
        return <Activity className="w-5 h-5" />;
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'admin_notification':
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Get text color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'report':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'new_user':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderation':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'system_alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'admin_notification':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format notification date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      const diffInHoursRounded = Math.floor(diffInHours);
      return `${diffInHoursRounded}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get notification title
  const getNotificationTitle = (type) => {
    switch (type) {
      case 'report':
        return 'New Report';
      case 'new_user':
        return 'New User';
      case 'moderation':
        return 'Moderation';
      case 'system_alert':
        return 'System Alert';
      case 'admin_notification':
        return 'Admin Notification';
      default:
        return 'Notification';
    }
  };

  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Notification types for filter
  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'report', label: 'Reports' },
    { value: 'new_user', label: 'New Users' },
    { value: 'moderation', label: 'Moderation' },
    { value: 'system_alert', label: 'System Alerts' },
    { value: 'admin_notification', label: 'Admin Notifications' }
  ];

  return (
    <div className="admin-notifications-panel">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Admin Notifications</h3>
          <div className="admin-card-actions">
            <button 
              onClick={markAllAsRead}
              className="admin-card-action-btn flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Mark all as read
            </button>
          </div>
        </div>
        
        <div className="admin-notifications-controls">
          <div className="admin-notifications-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="admin-notifications-filters">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1); // Reset to first page when changing filter
                }}
                className="admin-input pl-10 w-full"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="admin-alert admin-alert-error p-4">
            <p className="admin-alert-text">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="admin-loading-container">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading notifications...</p>
          </div>
        ) : (
          <div className="admin-notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="admin-no-notifications">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-center">No notifications found</p>
              </div>
            ) : (
              <>
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`admin-notification-item p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {getNotificationTitle(notification.type)}
                          </h4>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatDate(notification.date)}
                          </p>
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            Mark as read
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalNotifications)} of {totalNotifications} notifications
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="admin-pagination-btn"
                >
                  Previous
                </button>
                <span className="admin-pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="admin-pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;