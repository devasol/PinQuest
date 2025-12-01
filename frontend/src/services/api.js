// frontend/src/services/api.js
import { toast } from 'react-toastify';

// API base URL - should be consistent across the application
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create a base API service with common functionality
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.commonHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get authorization headers if token is available
  getAuthHeaders = (authToken) => {
    const headers = { ...this.commonHeaders };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Handle API response
  handleResponse = async (response) => {
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP error ${response.status}`;
      
      // Show toast notification for errors except 404 for user not found (which is common in comments)
      if (response.status !== 404 || !response.url.includes('/users/')) {
        toast.error(errorMessage);
      }
      
      return { 
        success: false, 
        error: errorMessage,
        status: response.status,
        errorData 
      };
    }
  };

  // GET request
  get = async (endpoint, authToken = null) => {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(authToken),
      });
      return await this.handleResponse(response);
    } catch (error) {
      // Show toast notification for network errors except when fetching user data for comments
      if (!endpoint.includes('/users/')) {
        toast.error('Network error occurred');
      }
      return { success: false, error: error.message };
    }
  };

  // POST request
  post = async (endpoint, data, authToken = null) => {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(authToken),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // PUT request
  put = async (endpoint, data, authToken = null) => {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(authToken),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // PATCH request
  patch = async (endpoint, data, authToken = null) => {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(authToken),
        body: JSON.stringify(data),
      });
      return await this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // DELETE request
  delete = async (endpoint, authToken = null) => {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(authToken),
      });
      return await this.handleResponse(response);
    } catch (error) {
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // Upload files
  upload = async (endpoint, formData, authToken = null) => {
    try {
      // For file uploads, we need to let the browser set the Content-Type header to include boundary
      const headers = this.getAuthHeaders(authToken);
      delete headers['Content-Type']; // Let browser set content-type for multipart/form-data
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      toast.error('Upload error occurred');
      return { success: false, error: error.message };
    }
  };
}

// Create singleton instance
const apiService = new ApiService();

// Specific API endpoints
export const postApi = {
  // Get all posts
  getAllPosts: (authToken) => apiService.get('/posts', authToken),
  
  // Get post by ID
  getPostById: (postId, authToken) => apiService.get(`/posts/${postId}`, authToken),
  
  // Create new post
  createPost: (postData, authToken) => {
    const formData = new FormData();
    
    // Add text fields
    Object.keys(postData).forEach(key => {
      if (key !== 'images' && key !== 'image' && key !== 'location') {
        if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      }
    });
    
    // Add location as JSON string if provided
    if (postData.location) {
      formData.append('location', JSON.stringify(postData.location));
    }
    
    // Add image files
    if (postData.images && Array.isArray(postData.images)) {
      postData.images.forEach(image => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }
    
    return apiService.upload('/posts', formData, authToken);
  },
  
  // Update post
  updatePost: (postId, postData, authToken) => {
    const formData = new FormData();
    
    // Add text fields
    Object.keys(postData).forEach(key => {
      if (key !== 'images' && key !== 'image') {
        if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      }
    });
    
    // Add image files if provided
    if (postData.images && Array.isArray(postData.images)) {
      postData.images.forEach(image => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }
    
    return apiService.upload(`/posts/${postId}`, formData, authToken);
  },
  
  // Delete post
  deletePost: (postId, authToken) => apiService.delete(`/posts/${postId}`, authToken),
  
  // Like a post
  likePost: (postId, authToken) => apiService.put(`/posts/${postId}/like`, {}, authToken),
  
  // Unlike a post
  unlikePost: (postId, authToken) => apiService.put(`/posts/${postId}/unlike`, {}, authToken),
  
  // Add or update rating
  addRating: (postId, ratingData, authToken) => apiService.post(`/posts/${postId}/ratings`, ratingData, authToken),
  
  // Get ratings for a post
  getRatings: (postId, authToken) => apiService.get(`/posts/${postId}/ratings`, authToken),
  
  // Add comment
  addComment: (postId, commentData, authToken) => 
    apiService.post(`/posts/${postId}/comments`, commentData, authToken),
  
  // Search posts
  searchPosts: (query, category, limit = 10, page = 1) => 
    apiService.get(`/posts/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&limit=${limit}&page=${page}`),
  
  // Get posts by location
  getPostsByLocation: (latitude, longitude, radius = 50) => 
    apiService.get(`/posts/by-location?latitude=${latitude}&longitude=${longitude}&radius=${radius}`),
  
  // Get nearby posts
  getNearbyPosts: (latitude, longitude, radius = 10, limit = 20) => 
    apiService.get(`/posts/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}`),
};

export const userApi = {
  // User profile operations
  getProfile: (authToken) => apiService.get('/users/profile', authToken),
  updateProfile: (userData, authToken) => apiService.put('/users/profile', userData, authToken),
  // Get user by ID
  getUserById: (userId, authToken) => {
    // For user lookups specifically, we handle 404s more gracefully without showing toast
    return apiService.get(`/users/${userId}`, authToken);
  },
  
  // User authentication
  login: (credentials) => apiService.post('/auth/login', credentials),
  register: (userData) => apiService.post('/auth/register', userData),
  logout: (authToken) => apiService.post('/auth/logout', {}, authToken),
  forgotPassword: (email) => apiService.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiService.post('/auth/reset-password', { token, newPassword }),
  
  // User favorites
  getFavorites: (authToken) => apiService.get('/users/favorites', authToken),
  addFavorite: (postId, authToken) => apiService.post('/users/favorites', { postId }, authToken),
  removeFavorite: (postId, authToken) => apiService.delete(`/users/favorites/${postId}`, authToken),
};

export const authApi = {
  // Authentication related operations
  getCurrentUser: (authToken) => apiService.get('/auth/me', authToken),
  verifyToken: (authToken) => apiService.get('/auth/verify', authToken),
};

// Admin-specific API endpoints
export const adminAPI = {
  // Helper function to get token if not provided
  getToken: (authToken) => {
    if (authToken) return authToken;
    return localStorage.getItem('token');
  },
  
  // Analytics functions
  getPlatformStats: async (authToken) => {
    try {
      const response = await apiService.get('/analytics/platform', adminAPI.getToken(authToken));
      
      // The ApiService returns { success: true, data: backendResponse } when HTTP is successful
      // The backendResponse is { status: 'success', data: actualData }
      if (response.success) {
        // Return the backend's response as-is, which has the format { status: ..., data: ... }
        return response.data;
      } else {
        // If HTTP request failed, return error format
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch platform statistics'
        };
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return { status: 'error', message: error.message || 'Failed to fetch platform statistics' };
    }
  },
  getTopPosts: async (params, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/analytics/top-posts?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch top posts'
        };
      }
    } catch (error) {
      console.error('Error fetching top posts:', error);
      return { status: 'error', message: error.message || 'Failed to fetch top posts' };
    }
  },
  getPlatformGrowth: async (params, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/analytics/platform-growth?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch platform growth data'
        };
      }
    } catch (error) {
      console.error('Error fetching platform growth:', error);
      return { status: 'error', message: error.message || 'Failed to fetch platform growth data' };
    }
  },
  getUserGrowth: async (params, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/analytics/user-growth?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch user growth data'
        };
      }
    } catch (error) {
      console.error('Error fetching user growth:', error);
      return { status: 'error', message: error.message || 'Failed to fetch user growth data' };
    }
  },
  getActivityTimeline: async (params, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/analytics/activity-timeline?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch activity timeline'
        };
      }
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      return { status: 'error', message: error.message || 'Failed to fetch activity timeline' };
    }
  },
  
  // User management functions
  getUsers: async (authToken) => {
    try {
      const response = await apiService.get('/admin/users', adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch users'
        };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return { status: 'error', message: error.message || 'Failed to fetch users' };
    }
  },
  getUserById: async (userId, authToken) => {
    try {
      const response = await apiService.get(`/admin/users/${userId}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch user'
        };
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { status: 'error', message: error.message || 'Failed to fetch user' };
    }
  },
  createUser: async (userData, authToken) => {
    try {
      const response = await apiService.post('/admin/users', userData, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to create user'
        };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return { status: 'error', message: error.message || 'Failed to create user' };
    }
  },
  deleteUser: async (userId, authToken) => {
    try {
      const response = await apiService.delete(`/admin/users/${userId}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to delete user'
        };
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return { status: 'error', message: error.message || 'Failed to delete user' };
    }
  },
  updateUserRole: async (userId, role, authToken) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/role`, { role }, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update user role'
        };
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      return { status: 'error', message: error.message || 'Failed to update user role' };
    }
  },
  updateUserBanStatus: async (userId, ban, authToken) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/ban`, { ban }, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update user ban status'
        };
      }
    } catch (error) {
      console.error('Error updating user ban status:', error);
      return { status: 'error', message: error.message || 'Failed to update user ban status' };
    }
  },
  updateUserPassword: async (userId, passwordData, authToken) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}/password`, passwordData, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update user password'
        };
      }
    } catch (error) {
      console.error('Error updating user password:', error);
      return { status: 'error', message: error.message || 'Failed to update user password' };
    }
  },
  
  // Content management functions
  getPosts: async (authToken) => {
    try {
      const response = await apiService.get('/admin/posts', adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch posts'
        };
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { status: 'error', message: error.message || 'Failed to fetch posts' };
    }
  },
  deletePost: async (postId, authToken) => {
    try {
      const response = await apiService.delete(`/admin/posts/${postId}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to delete post'
        };
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      return { status: 'error', message: error.message || 'Failed to delete post' };
    }
  },
  updatePost: async (postId, postData, authToken) => {
    try {
      const response = await apiService.put(`/admin/posts/${postId}`, postData, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update post'
        };
      }
    } catch (error) {
      console.error('Error updating post:', error);
      return { status: 'error', message: error.message || 'Failed to update post' };
    }
  },
  approvePost: async (postId, authToken) => {
    try {
      const response = await apiService.put(`/admin/posts/${postId}/approve`, {}, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to approve post'
        };
      }
    } catch (error) {
      console.error('Error approving post:', error);
      return { status: 'error', message: error.message || 'Failed to approve post' };
    }
  },
  rejectPost: async (postId, authToken) => {
    try {
      const response = await apiService.put(`/admin/posts/${postId}/reject`, {}, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to reject post'
        };
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      return { status: 'error', message: error.message || 'Failed to reject post' };
    }
  },
  
  // Security settings functions
  getSecuritySettings: async (authToken) => {
    try {
      const response = await apiService.get('/admin/security-settings', adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch security settings'
        };
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return { status: 'error', message: error.message || 'Failed to fetch security settings' };
    }
  },
  updateSecuritySetting: async (settingName, value, authToken) => {
    try {
      const settings = {};
      settings[settingName] = value;
      const response = await apiService.put('/admin/security-settings', settings, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update security setting'
        };
      }
    } catch (error) {
      console.error('Error updating security setting:', error);
      return { status: 'error', message: error.message || 'Failed to update security setting' };
    }
  },
  updatePassword: async (currentPassword, newPassword, authToken) => {
    try {
      const response = await apiService.put('/auth/update-password', { currentPassword, newPassword }, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to update password'
        };
      }
    } catch (error) {
      console.error('Error updating password:', error);
      return { status: 'error', message: error.message || 'Failed to update password' };
    }
  },
  getActivityLog: async (params, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/admin/activity-log?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch activity log'
        };
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
      return { status: 'error', message: error.message || 'Failed to fetch activity log' };
    }
  },
  
  // Notification functions
  getAdminNotificationCount: async (authToken) => {
    try {
      const response = await apiService.get('/admin/notifications/count', adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch notification count'
        };
      }
    } catch (error) {
      console.error('Error fetching admin notification count:', error);
      return { status: 'error', message: error.message || 'Failed to fetch notification count' };
    }
  },
  getAdminNotifications: async (params = {}, authToken) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.get(`/admin/notifications?${queryString}`, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to fetch notifications'
        };
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return { status: 'error', message: error.message || 'Failed to fetch notifications' };
    }
  },
  markAllAdminNotificationsAsRead: async (authToken) => {
    try {
      const response = await apiService.put('/admin/notifications/read-all', {}, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to mark notifications as read'
        };
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { status: 'error', message: error.message || 'Failed to mark notifications as read' };
    }
  },
  markAsRead: async (notificationId, authToken) => {
    try {
      const response = await apiService.put(`/notifications/${notificationId}/read`, {}, adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to mark notification as read'
        };
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { status: 'error', message: error.message || 'Failed to mark notification as read' };
    }
  },
  
  // Verification functions
  verifyAdmin: async (authToken) => {
    try {
      const response = await apiService.get('/admin/verify', adminAPI.getToken(authToken));
      
      if (response.success) {
        return response.data;
      } else {
        return { 
          status: 'error', 
          message: response.error || 'Failed to verify admin access'
        };
      }
    } catch (error) {
      console.error('Error verifying admin:', error);
      return { status: 'error', message: error.message || 'Failed to verify admin access' };
    }
  },
};

// Authentication service
export const authService = {
  // Login
  login: (email, password) => apiService.post('/auth/login', { email, password }),
  
  // Signup
  signup: (email, password, name) => apiService.post('/auth/register', { email, password, name }),
  
  // Google login (this would typically open a popup/window for OAuth)
  // For now, this is just an indicator that Google login is available
  // The actual OAuth flow will redirect the browser in the calling component
  googleLogin: () => Promise.resolve({ 
    success: true, 
    message: 'Initiating Google login',
    redirectUrl: `${apiService.baseURL}/auth/google` 
  }),
  
  // Logout
  logout: (authToken) => apiService.post('/auth/logout', {}, authToken),
};

// Export the main service if needed
export default apiService;