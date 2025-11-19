import { firebaseAuthService } from './firebaseAuth.js';
import { directAuthApi } from './authApi.js';
import { auth } from '../config/firebase'; // Import auth for current user access

// API service for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Helper function to get a fresh Firebase token
const getFreshToken = async () => {
  try {
    // Get the current Firebase user from localStorage
    const firebaseUserStr = localStorage.getItem('firebaseUser');
    if (!firebaseUserStr) {
      return null;
    }
    
    const firebaseUser = JSON.parse(firebaseUserStr);
    const userId = firebaseUser.uid;
    
    // Get the current user from Firebase auth to ensure we have an up-to-date token
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      // Get a fresh token (this refreshes if needed)
      const freshToken = await currentUser.getIdToken(true); // Force refresh
      localStorage.setItem('token', freshToken);
      return freshToken;
    } else {
      // If current user doesn't match stored user, use the stored token
      return localStorage.getItem('token');
    }
  } catch (error) {
    console.error('Error refreshing Firebase token:', error);
    return localStorage.getItem('token'); // Fallback to stored token
  }
};

// Create a base configuration for fetch requests
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add token to headers if available (ensure it's properly trimmed)
  let token = localStorage.getItem('token');
  if (token && !options.skipAuth) {
    // Try to get a fresh token if authentication is required
    const freshToken = await getFreshToken();
    token = freshToken || token; // Use fresh token if available, otherwise use stored
  }

  if (token && !options.skipAuth) {
    const trimmedToken = token.trim();
    config.headers['Authorization'] = `Bearer ${trimmedToken}`;
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
  // Direct signup with backend
  signup: async (email, password, name) => {
    return directAuthApi.signup({ email, password, name });
  },

  // Direct login with backend
  login: async (email, password) => {
    return directAuthApi.login(email, password);
  },

  // Google login with Firebase (must continue to use Firebase for OAuth)
  googleLogin: async () => {
    return firebaseAuthService.googleLogin();
  },

  // Get current user profile from your backend
  getProfile: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    return directAuthApi.logout();
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

// Export the apiRequest function so it can be imported by other modules
export { apiRequest };