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
  AlertTriangle,
  Bell,
  Settings,
  BarChart2,
  Shield,
  User,
  Home,
  CheckCircle
} from 'lucide-react';
import AdminNotifications from '../../components/AdminNotifications';
import Notifications from './Notifications';

const AdminDashboard = () => {
  usePageTitle("Admin Dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalReports: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [platformGrowthData, setPlatformGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard'); // Add active section state

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel for better performance
        const [statsData, activityData, growthData] = await Promise.all([
          adminAPI.getPlatformStats().catch(err => {
            console.error('Error fetching stats:', err);
            return { status: 'error', message: err.message };
          }),
          adminAPI.getActivityTimeline({ days: 7 }).catch(err => {
            console.error('Error fetching activity:', err);
            return { status: 'error', message: err.message, data: [] };
          }),
          adminAPI.getPlatformGrowth({ days: 7, type: 'all' }).catch(err => {
            console.error('Error fetching growth data:', err);
            return { status: 'error', message: err.message, data: [] };
          })
        ]);

        // Handle platform stats
        if (statsData.status === 'success') {
          setStats({
            totalUsers: statsData.data.totalUsers || 0,
            totalPosts: statsData.data.totalPosts || 0,
            totalMessages: statsData.data.totalMessages || 0,
            totalReports: statsData.data.totalReports || 0
          });
        } else {
          throw new Error(statsData.message || 'Failed to fetch platform statistics');
        }

        // Handle recent activity
        if (activityData.status === 'success' && Array.isArray(activityData.data)) {
          // Transform activity timeline data to match dashboard format
          const transformedActivity = activityData.data.slice(0, 5).map((activity, index) => ({
            id: index + 1,
            action: activity.action || 'Activity occurred',
            user: activity.title || 'User',
            time: activity.date ? new Date(activity.date).toLocaleString() : 'Just now',
            type: activity.type || 'general'
          }));
          setRecentActivity(transformedActivity);
        } else {
          // Fallback to empty array if API call fails
          setRecentActivity([]);
        }

        // Handle platform growth data
        if (growthData.status === 'success' && Array.isArray(growthData.data)) {
          setPlatformGrowthData(growthData.data);
        } else {
          setPlatformGrowthData([]);
        }

        // Create alerts based on the stats
        const generatedAlerts = [];
        if (stats.totalReports > 5) {
          generatedAlerts.push({
            id: 1,
            message: `Pending moderation: ${stats.totalReports} reports`,
            type: 'warning',
            time: 'Just now'
          });
        }
        if (stats.totalUsers > 0) {
          generatedAlerts.push({
            id: 2,
            message: `New user registrations: ${stats.totalUsers} total users`,
            type: 'info',
            time: 'Today'
          });
        }
        if (stats.totalPosts > 0) {
          generatedAlerts.push({
            id: 3,
            message: `Total posts: ${stats.totalPosts}`,
            type: 'info',
            time: 'Today'
          });
        }
        
        setAlerts(generatedAlerts);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
        
        // Even if there's an error, we'll set empty arrays to avoid breaking the UI
        setRecentActivity([]);
        setAlerts([]);
        setPlatformGrowthData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      {/* Admin Dashboard Header with Navigation */}
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-header-content">
          <h2 className="admin-dashboard-title">Admin Dashboard</h2>
          <div className="admin-dashboard-nav">
            <button 
              className={`admin-nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button 
              className={`admin-nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </button>
            <button 
              className={`admin-nav-btn ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            <button 
              className={`admin-nav-btn ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </button>
            <button 
              className={`admin-nav-btn ${activeSection === 'content' ? 'active' : ''}`}
              onClick={() => setActiveSection('content')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Content
            </button>
            <button 
              className={`admin-nav-btn ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content based on active section */}
      {activeSection === 'dashboard' && (
        <div className="admin-dashboard-content">
          <div className="admin-dashboard-welcome">
            <h3 className="admin-dashboard-welcome-title">Welcome back, Admin</h3>
            <p className="admin-dashboard-welcome-subtitle">Here's what's happening with your platform today.</p>
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
              <div className="admin-card-header">
                <h3 className="admin-card-title">Quick Actions</h3>
              </div>
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

          {/* Chart with Real Data */}
          <div className="admin-card">
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
            <div className="analytics-chart-placeholder">
              <div className="analytics-chart-container">
                {platformGrowthData.length > 0 ? (
                  <>
                    <div className="analytics-chart-y-axis">
                      {(() => {
                        const dataValues = platformGrowthData.map(d => {
                          if (d.total !== undefined && d.total !== null) return d.total;
                          if (d.userCount !== undefined && d.userCount !== null && d.postCount !== undefined && d.postCount !== null) {
                            return d.userCount + d.postCount;
                          }
                          if (d.count !== undefined && d.count !== null) return d.count;
                          return 0; // Default to 0 if none of the above are valid
                        });
                        const maxValue = Math.max(...dataValues) || 1;
                        return (
                          <>
                            <span>{maxValue}</span>
                            <span>{Math.floor(maxValue / 2)}</span>
                            <span>0</span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="analytics-chart-content">
                      <svg className="analytics-line-chart" viewBox={`0 0 600 ${200}`} preserveAspectRatio="none">
                        {platformGrowthData.length > 1 && 
                          (() => {
                            const dataValues = platformGrowthData.map(d => {
                              if (d.total !== undefined && d.total !== null) return d.total;
                              if (d.userCount !== undefined && d.userCount !== null && d.postCount !== undefined && d.postCount !== null) {
                                return d.userCount + d.postCount;
                              }
                              if (d.count !== undefined && d.count !== null) return d.count;
                              return 0; // Default to 0 if none of the above are valid
                            });
                            const maxValue = Math.max(...dataValues) || 1;
                            const points = platformGrowthData.slice(0, 7).map((dataPoint, i) => {
                              const x = (i * 600) / Math.max(platformGrowthData.slice(0, 7).length - 1, 1);
                              const value = dataPoint.total !== undefined && dataPoint.total !== null ? dataPoint.total :
                                         (dataPoint.userCount !== undefined && dataPoint.userCount !== null && 
                                          dataPoint.postCount !== undefined && dataPoint.postCount !== null) ? 
                                         (dataPoint.userCount + dataPoint.postCount) :
                                         (dataPoint.count !== undefined && dataPoint.count !== null) ? dataPoint.count : 0;
                              const y = 200 - value * 200 / maxValue;
                              return `${x},${y}`;
                            }).join(' ');
                            
                            return (
                              <polyline
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="3"
                                points={points}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            );
                          })()
                        }
                        {platformGrowthData.slice(0, 7).map((dataPoint, i) => {
                          const dataValues = platformGrowthData.map(d => {
                            if (d.total !== undefined && d.total !== null) return d.total;
                            if (d.userCount !== undefined && d.userCount !== null && d.postCount !== undefined && d.postCount !== null) {
                              return d.userCount + d.postCount;
                            }
                            if (d.count !== undefined && d.count !== null) return d.count;
                            return 0; // Default to 0 if none of the above are valid
                          });
                          const maxValue = Math.max(...dataValues) || 1;
                          const x = (i * 600) / Math.max(platformGrowthData.slice(0, 7).length - 1, 1);
                          const value = dataPoint.total !== undefined && dataPoint.total !== null ? dataPoint.total :
                                     (dataPoint.userCount !== undefined && dataPoint.userCount !== null && 
                                      dataPoint.postCount !== undefined && dataPoint.postCount !== null) ? 
                                     (dataPoint.userCount + dataPoint.postCount) :
                                     (dataPoint.count !== undefined && dataPoint.count !== null) ? dataPoint.count : 0;
                          const y = 200 - value * 200 / maxValue;
                          
                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#4f46e5"
                                stroke="white"
                                strokeWidth="2"
                              />
                              <title>{new Date(dataPoint.date).toLocaleDateString()} - {value}</title>
                            </g>
                          );
                        })}
                      </svg>
                      <div className="analytics-chart-dates">
                        {platformGrowthData.slice(0, 7).map((dataPoint, i) => (
                          <span key={i} className="analytics-chart-date" style={{ minWidth: `${100 / Math.min(platformGrowthData.length, 7)}%` }}>
                            {new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="analytics-chart-container">
                    <div className="analytics-chart-y-axis">
                      <span>100</span>
                      <span>75</span>
                      <span>0</span>
                    </div>
                    <div className="analytics-chart-content">
                      <svg className="analytics-line-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="3"
                          points="0,150 100,120 200,140 300,100 400,80 500,110 600,90"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {[0, 100, 200, 300, 400, 500, 600].map((x, i) => (
                          <circle
                            key={i}
                            cx={x}
                            cy={[150, 120, 140, 100, 80, 110, 90][i]}
                            r="4"
                            fill="#9ca3af"
                            stroke="white"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                      <div className="analytics-chart-dates">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <span key={i} className="analytics-chart-date" style={{ minWidth: `${100 / 7}%` }}>{day}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="admin-notifications-section">
          <Notifications />
        </div>
      )}

      {error && activeSection === 'dashboard' && (
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
      )}
    </div>
  );
};

export default AdminDashboard;