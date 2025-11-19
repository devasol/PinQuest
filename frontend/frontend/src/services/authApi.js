// Direct backend authentication API service (without Firebase)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
      data = await response.text();
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
    
    if (error instanceof TypeError) {
      throw new Error(`Network error: Unable to connect to server. Please check your connection.`);
    }
    
    throw error;
  }
};

export const directAuthApi = {
  // Direct signup with backend
  signup: async (userData) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        skipAuth: true,
      });

      if (response.status === 'success' && response.data) {
        return {
          success: true,
          user: response.data,
          token: response.data.token
        };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Direct login with backend
  login: async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      if (response.status === 'success' && response.data) {
        return {
          success: true,
          user: response.data,
          token: response.data.token
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Logout
  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        skipAuth: false,
      });

      // Remove tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('firebaseUser');
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};