import { firebaseAuthService } from './firebaseAuth.js';

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

  // Add token to headers if available (ensure it's properly trimmed)
  const token = localStorage.getItem('token');
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
  // Signup user with Firebase
  signup: async (userData) => {
    // Normalize the userData to make sure it has the expected structure
    const email = userData.email;
    const password = userData.password;
    const name = userData.name || userData.displayName;
    
    return firebaseAuthService.signup(email, password, name);
  },

  // Login user with Firebase
  login: async (email, password) => {
    // Handle both single object parameter and separate email/password parameters
    let emailParam, passwordParam;
    if (typeof email === 'object' && email.email && email.password) {
      // If email is an object with email and password properties
      emailParam = email.email;
      passwordParam = email.password;
    } else {
      // If email and password are separate parameters
      emailParam = email;
      passwordParam = password;
    }
    
    return firebaseAuthService.login(emailParam, passwordParam);
  },

  // Google login with Firebase
  googleLogin: async () => {
    return firebaseAuthService.googleLogin();
  },

  // Get current user profile from your backend (you may need to implement this endpoint)
  getProfile: async () => {
    // This would typically call your backend API to get user profile
    // For now, we'll return the Firebase user data that's stored
    const token = localStorage.getItem('token');
    if (token) {
      // In a real backend scenario, you'd make an API call to your backend
      // that verifies the Firebase token and returns user profile data
      return { 
        user: JSON.parse(localStorage.getItem('firebaseUser') || '{}') 
      };
    } else {
      throw new Error('No authentication token found');
    }
  },

  // Logout user
  logout: async () => {
    return firebaseAuthService.logout();
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