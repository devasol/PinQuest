// API service for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create a base configuration for fetch requests
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add token to headers if available
  const token = localStorage.getItem('token');
  if (token && !options.skipAuth) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle different response types appropriately
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For non-JSON responses, try to get text or return status
      data = await response.text();
      // If it's successful but not JSON, return basic success info
      if (response.ok && !data) {
        return { status: 'success', message: 'Request completed' };
      }
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data.message 
        ? data.message 
        : `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error.message);
    
    // If it's a network error, provide more context
    if (error instanceof TypeError) {
      throw new Error(`Network error: Unable to connect to server. Please check your connection.`);
    }
    
    throw error;
  }
};

export const authService = {
  // Signup user - Backend route is /auth/register
  signup: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Google login redirect
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/profile', {
      skipAuth: false, // We want to include the auth token for this request
    });
  },

  // Health check to see if API is accessible
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },
};