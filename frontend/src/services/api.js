// Centralized API service for admin panel
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Generic API call function with error handling
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle different response status codes
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      } else if (response.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      } else if (response.status >= 500) {
        throw new Error('Server error: Please try again later');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors or other fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Please check your connection');
    }
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Admin API functions
export const adminAPI = {
  // User management
  getUsers: () => apiCall('/admin/users', { method: 'GET' }),
  getUserById: (id) => apiCall(`/admin/users/${id}`, { method: 'GET' }),
  deleteUser: (id) => apiCall(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserRole: (userId, role) => apiCall(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  }),
  
  // Post management
  getPosts: () => apiCall('/admin/posts', { method: 'GET' }),
  deletePost: (id) => apiCall(`/admin/posts/${id}`, { method: 'DELETE' }),
  
  // Admin verification
  verifyAdmin: () => apiCall('/admin/verify', { method: 'GET' }),
  
  // Analytics
  getPlatformStats: () => apiCall('/analytics/platform', { method: 'GET' }),
  getTopPosts: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiCall(`/analytics/top-posts?${queryParams}`, { method: 'GET' });
  },
  getActivityTimeline: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiCall(`/analytics/activity-timeline?${queryParams}`, { method: 'GET' });
  },
  getRecentActivity: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiCall(`/analytics/activity-timeline?${queryParams}`, { method: 'GET' });
  },
  getUserGrowth: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiCall(`/analytics/user-growth?${queryParams}`, { method: 'GET' });
  },
  getPlatformGrowth: (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiCall(`/analytics/platform-growth?${queryParams}`, { method: 'GET' });
  },
  
  // Password update
  updatePassword: (currentPassword, newPassword) => apiCall('/auth/update-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
};

export default apiCall;