import React, { useState, useEffect } from 'react';
import usePageTitle from '../../services/usePageTitle';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';
import { 
  Users, 
  MapPin, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock recent activity since we don't have a real endpoint for this yet
  const [recentActivity] = useState([
    { id: 1, action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
    { id: 2, action: 'New post created', user: 'Jane Smith', time: '5 minutes ago', type: 'post' },
    { id: 3, action: 'User reported', user: 'Bob Johnson', time: '10 minutes ago', type: 'report' },
    { id: 4, action: 'System maintenance', user: 'System', time: '15 minutes ago', type: 'system' },
    { id: 5, action: 'Post approved', user: 'Admin', time: '20 minutes ago', type: 'moderation' }
  ]);

  // Mock alerts
  const [alerts] = useState([
    { id: 1, message: 'High server load detected', type: 'warning', time: '1 hour ago' },
    { id: 2, message: 'New user registrations: 15 today', type: 'info', time: '2 hours ago' },
    { id: 3, message: 'Pending moderation: 8 posts', type: 'info', time: '3 hours ago' }
  ]);

  // Fetch platform stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getPlatformStats();
        
        if (data.status === 'success') {
          setStats({
            totalUsers: data.data.totalUsers || 0,
            totalPosts: data.data.totalPosts || 0,
            totalMessages: data.data.totalMessages || 0,
            totalReports: data.data.totalReports || 0
          });
        } else {
          throw new Error(data.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12.5%',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Total Posts',
      value: stats.totalPosts.toLocaleString(),
      change: '+8.2%',
      icon: MapPin,
      color: 'green'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      change: '+15.3%',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      title: 'Total Reports',
      value: stats.totalReports.toLocaleString(),
      change: '+5.7%',
      icon: AlertTriangle,
      color: 'orange'
    }
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100'
    };
    return colors[color] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600 mb-2">Error loading dashboard</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h2 className="admin-dashboard-title">Welcome back, Admin</h2>
        <p className="admin-dashboard-subtitle">Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="admin-stat-card">
              <div className="admin-stat-icon-container">
                <div className={`admin-stat-icon ${getIconColor(stat.color)}`}>
                  <Icon className="admin-stat-icon-svg" />
                </div>
              </div>
              <div className="admin-stat-content">
                <h3 className="admin-stat-title">{stat.title}</h3>
                <p className="admin-stat-value">{stat.value}</p>
                <p className={`admin-stat-change ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last week
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity Section */}
      <div className="admin-dashboard-grid">
        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Activity</h3>
            <button className="admin-card-action-btn">View All</button>
          </div>
          <div className="admin-activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="admin-activity-item">
                <div className="admin-activity-icon">
                  {activity.type === 'user' && <Users className="admin-activity-icon-svg" />}
                  {activity.type === 'post' && <MapPin className="admin-activity-icon-svg" />}
                  {activity.type === 'report' && <AlertTriangle className="admin-activity-icon-svg" />}
                  {activity.type === 'system' && <Activity className="admin-activity-icon-svg" />}
                  {activity.type === 'moderation' && <BarChart3 className="admin-activity-icon-svg" />}
                </div>
                <div className="admin-activity-content">
                  <p className="admin-activity-text">{activity.action} by <strong>{activity.user}</strong></p>
                  <span className="admin-activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Alerts & Notifications</h3>
          </div>
          <div className="admin-alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`admin-alert-item admin-alert-${alert.type}`}>
                <AlertTriangle className="admin-alert-icon" />
                <div className="admin-alert-content">
                  <p className="admin-alert-text">{alert.message}</p>
                  <span className="admin-alert-time">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card admin-quick-actions">
          <h3 className="admin-card-title">Quick Actions</h3>
          <div className="admin-quick-actions-grid">
            <a href="/admin/users" className="admin-quick-action-btn">
              <Users className="admin-quick-action-icon" />
              <span>Manage Users</span>
            </a>
            <a href="/admin/posts" className="admin-quick-action-btn">
              <MapPin className="admin-quick-action-icon" />
              <span>View Posts</span>
            </a>
            <a href="/admin/posts" className="admin-quick-action-btn">
              <MessageSquare className="admin-quick-action-icon" />
              <span>Moderation</span>
            </a>
            <a href="/admin/analytics" className="admin-quick-action-btn">
              <TrendingUp className="admin-quick-action-icon" />
              <span>Analytics</span>
            </a>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="admin-card admin-chart-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Growth</h3>
          <div className="admin-card-actions">
            <select className="admin-card-select">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="admin-chart-placeholder">
          <p className="admin-chart-placeholder-text">Chart visualization would appear here</p>
          <div className="admin-chart-placeholder-graph">
            {/* Simplified graph representation */}
            <div className="admin-chart-bars">
              <div className="admin-chart-bar" style={{ height: '30%' }}></div>
              <div className="admin-chart-bar" style={{ height: '60%' }}></div>
              <div className="admin-chart-bar" style={{ height: '80%' }}></div>
              <div className="admin-chart-bar" style={{ height: '70%' }}></div>
              <div className="admin-chart-bar" style={{ height: '40%' }}></div>
              <div className="admin-chart-bar" style={{ height: '90%' }}></div>
              <div className="admin-chart-bar" style={{ height: '50%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;