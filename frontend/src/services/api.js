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
      
      // Show toast notification for errors
      toast.error(errorMessage);
      
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
      toast.error('Network error occurred');
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
  // Get admin notification count
  getAdminNotificationCount: (authToken) => apiService.get('/admin/notifications/count', authToken),
  
  // Get admin notifications
  getAdminNotifications: (params = {}, authToken) => {
    const queryString = new URLSearchParams(params).toString();
    return apiService.get(`/admin/notifications?${queryString}`, authToken);
  },
  
  // Mark all admin notifications as read
  markAllAdminNotificationsAsRead: (authToken) => apiService.put('/admin/notifications/mark-all-read', {}, authToken),
  
  // Mark a specific notification as read (reusing general endpoint)
  markAsRead: (notificationId, authToken) => apiService.put(`/notifications/${notificationId}/read`, {}, authToken),
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