import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Download
} from 'lucide-react';
import usePageTitle from '../../services/usePageTitle';
import { adminAPI } from '../../services/api';
import './Analytics.css';

const Analytics = () => {
  usePageTitle("Analytics Dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalReports: 0,
    activeUsers: 0,
    revenue: 0,
    growthRate: 0
  });

  const [topPosts, setTopPosts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch platform stats
        const statsData = await adminAPI.getPlatformStats();
        if (statsData.status === 'success') {
          setStats({
            totalUsers: statsData.data.totalUsers || 0,
            totalPosts: statsData.data.totalPosts || 0,
            totalMessages: statsData.data.totalMessages || 0,
            totalReports: statsData.data.totalReports || 0,
            activeUsers: statsData.data.activeUsers || 0, // Need to implement active users tracking
            revenue: statsData.data.revenue || 0, // Placeholder for revenue if implemented
            growthRate: statsData.data.growthRate || 0 // Placeholder for growth rate
          });
        } else {
          throw new Error(statsData.message || 'Failed to fetch platform stats');
        }

        // Fetch top posts
        const topPostsData = await adminAPI.getTopPosts({ limit: 5, days: 30 });
        if (topPostsData.status === 'success') {
          setTopPosts(topPostsData.data || []);
          
          // Create top categories from top posts
          const categoryMap = {};
          if (topPostsData.data && Array.isArray(topPostsData.data)) {
            topPostsData.data.forEach(post => {
              const category = post.category || post.title.includes('nature') ? 'Nature' : 
                               post.title.includes('food') ? 'Food & Drinks' :
                               post.title.includes('culture') ? 'Culture' :
                               post.title.includes('shop') ? 'Shopping' : 'General';
              
              if (!categoryMap[category]) {
                categoryMap[category] = 0;
              }
              categoryMap[category]++;
            });

            const categoryData = Object.entries(categoryMap).map(([name, count]) => ({
              name,
              posts: count,
              percentage: Math.floor((count / topPostsData.data.length) * 100)
            }));

            setTopCategories(categoryData);
          } else {
            setTopCategories([]);
          }
        } else {
          throw new Error(topPostsData.message || 'Failed to fetch top posts');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

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
      change: '+2.1%',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+5.7%',
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Growth Rate',
      value: `${stats.growthRate}%`,
      change: '+2.3%',
      icon: TrendingUp,
      color: 'indigo'
    }
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      red: 'text-red-600 bg-red-100',
      orange: 'text-orange-600 bg-orange-100',
      indigo: 'text-indigo-600 bg-indigo-100'
    };
    return colors[color] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-red-600 mb-2">Error loading analytics</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Analytics Dashboard</h2>
          <p className="analytics-subtitle">Track your platform performance and metrics</p>
        </div>
        <div className="analytics-actions">
          <select 
            className="analytics-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="analytics-btn analytics-btn-secondary">
            <Download className="analytics-btn-icon" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="analytics-stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="analytics-stat-card">
              <div className="analytics-stat-icon-container">
                <div className={`analytics-stat-icon ${getIconColor(stat.color)}`}>
                  <Icon className="analytics-stat-icon-svg" />
                </div>
              </div>
              <div className="analytics-stat-content">
                <h3 className="analytics-stat-title">{stat.title}</h3>
                <p className="analytics-stat-value">{stat.value}</p>
                <p className={`analytics-stat-change ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last period
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="analytics-grid">
        {/* User Growth Chart */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3 className="analytics-card-title">Platform Growth</h3>
            <div className="analytics-card-actions">
              <select className="analytics-select">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
          <div className="analytics-chart-placeholder">
            <div className="analytics-chart-container">
              <div className="analytics-chart-y-axis">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              <div className="analytics-chart-content">
                <div className="analytics-chart-grid">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="analytics-chart-grid-line"></div>
                  ))}
                </div>
                <div className="analytics-chart-bars">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div 
                      key={i} 
                      className="analytics-chart-bar" 
                      style={{ height: `${Math.random() * 80 + 10}%` }}
                    ></div>
                  ))}
                </div>
                <div className="analytics-chart-dates">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <span key={i} className="analytics-chart-date">{day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="analytics-card">
          <h3 className="analytics-card-title">Top Categories</h3>
          <div className="analytics-category-list">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <div key={index} className="analytics-category-item">
                  <div className="analytics-category-info">
                    <span className="analytics-category-name">{category.name}</span>
                    <span className="analytics-category-posts">{category.posts} posts</span>
                  </div>
                  <div className="analytics-category-progress">
                    <div 
                      className="analytics-category-progress-bar" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="analytics-category-percentage">{category.percentage}%</span>
                </div>
              ))
            ) : (
              <div className="analytics-category-item">
                <div className="analytics-category-info">
                  <span className="analytics-category-name">No data available</span>
                  <span className="analytics-category-posts">0 posts</span>
                </div>
                <div className="analytics-category-progress">
                  <div className="analytics-category-progress-bar" style={{ width: '0%' }}></div>
                </div>
                <span className="analytics-category-percentage">0%</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-card analytics-recent-activity">
          <h3 className="analytics-card-title">Top Posts</h3>
          <div className="analytics-activity-list">
            {topPosts.length > 0 ? (
              topPosts.map((post, index) => (
                <div key={post._id || index} className="analytics-activity-item">
                  <div className="analytics-activity-icon">
                    <MapPin className="analytics-activity-icon-svg" />
                  </div>
                  <div className="analytics-activity-content">
                    <div className="analytics-activity-info">
                      <p className="analytics-activity-text">{post.title || 'Untitled Post'}</p>
                      <span className="analytics-activity-time">by {post.author || 'Unknown'}</span>
                    </div>
                    <div className="analytics-activity-meta">
                      <span className="analytics-activity-posts">Engagement: {post.engagement || 0}</span>
                      <span className="analytics-activity-likes">Likes: {post.likesCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="analytics-activity-item">
                <div className="analytics-activity-content">
                  <p className="analytics-activity-text">No top posts available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;