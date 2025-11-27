import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCircle, AlertTriangle, MessageSquare, UserPlus, Activity, Eye } from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminNotifications = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await adminAPI.getAdminNotificationCount();
        if (response.status === 'success') {
          setNotificationCount(response.data.count || 0);
        } else {
          console.error('Error response from server:', response);
        }
      } catch (err) {
        console.error('Error fetching notification count:', err);
        setError(err.message);
      }
    };

    fetchNotificationCount();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminNotifications({ limit: 10 });
      
      if (response.status === 'success') {
        setNotifications(response.data.notifications || []);
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

  // Load notifications when dropdown is opened
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Use the regular notification endpoint since admin notifications use the same schema
      await adminAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Update notification count
      setNotificationCount(prev => Math.max(0, prev - 1));
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
      
      // Update notification count
      setNotificationCount(0);
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

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark all as read
              </button>
            )}
          </div>
          
          {error && !loading && (
            <div className="p-4 text-red-600 text-sm">
              Error: {error}
            </div>
          )}
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 text-sm">
              Error loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification._id);
                    // Navigate to the relevant page based on notification type
                    if (notification.post) {
                      window.open(`/admin/posts/${notification.post}`, '_blank');
                    }
                  }}
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
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.date)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the main click handler from firing
                        markAsRead(notification._id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminNotifications;