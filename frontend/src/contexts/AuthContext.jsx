import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.jsx';
import { directAuthApi } from '../services/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Get user from localStorage if available
      const storedUser = localStorage.getItem('firebaseUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        // Store user info in a simpler format
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified
        };
        localStorage.setItem('firebaseUser', JSON.stringify(userInfo));
        setUser(userInfo);
        setIsAuthenticated(true);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const data = await authService.signup(userData.email, userData.password, userData.name);
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        // Store user info in a simpler format
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified
        };
        localStorage.setItem('firebaseUser', JSON.stringify(userInfo));
        setUser(userInfo);
        setIsAuthenticated(true);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signupWithVerification = async (userData) => {
    try {
      const data = await directAuthApi.signupWithVerification(userData);
      if (data.success) {
        // Store email for verification in localStorage
        localStorage.setItem('verificationEmail', userData.email);
        return { success: true, data, email: userData.email };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('firebaseUser');
      // Clear all user-specific data that might persist
      localStorage.removeItem('savedLocations');
      localStorage.removeItem('mapLayout');
      // Note: We no longer clear recentLocations here as they should persist for device-specific usage
      // when not authenticated, but we'll clear them in the MapView component when the user logs out
      
      // Clear all rating-related local storage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('post_') && key.endsWith('_ratings')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if the API call fails, still clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('firebaseUser');
      // Clear all user-specific data that might persist
      localStorage.removeItem('savedLocations');
      localStorage.removeItem('mapLayout');
      // Note: We no longer clear recentLocations here as they should persist for device-specific usage
      // when not authenticated, but we'll clear them in the MapView component when the user logs out
      
      // Clear all rating-related local storage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('post_') && key.endsWith('_ratings')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Google login must continue to use Firebase OAuth
      const data = await authService.googleLogin();
      if (data.success) {
        // Store token and user data after successful Google login
        localStorage.setItem('token', data.token);
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified
        };
        localStorage.setItem('firebaseUser', JSON.stringify(userInfo));
        setUser(userInfo);
        setIsAuthenticated(true);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    signupWithVerification,
    logout,
    googleLogin: handleGoogleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};