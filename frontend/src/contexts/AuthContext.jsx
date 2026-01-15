import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.jsx';
import { directAuthApi } from '../services/authApi';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../config/firebase';

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

  // Check if user is logged in on initial load and handle redirect results
  useEffect(() => {
    // Check for redirect result from Firebase OAuth
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User successfully authenticated via redirect
          const firebaseIdToken = await result.user.getIdToken();
          
          // Exchange Firebase token for backend JWT token
          const tokenExchangeResult = await exchangeFirebaseToken(firebaseIdToken);
          if (tokenExchangeResult.success) {
            // Store token and user data
            localStorage.setItem('token', tokenExchangeResult.token);
            const userInfo = {
              _id: tokenExchangeResult.user._id,
              email: tokenExchangeResult.user.email,
              name: tokenExchangeResult.user.name,
              isVerified: tokenExchangeResult.user.isVerified,
              role: tokenExchangeResult.user.role
            };
            localStorage.setItem('firebaseUser', JSON.stringify(userInfo));
            setUser(userInfo);
            setIsAuthenticated(true);
          }
        } else {
          // If no redirect result, check for stored token
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
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        // Fallback to checking stored token if redirect result fails
        const token = localStorage.getItem('token');
        if (token) {
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
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  // Helper function to exchange Firebase token for backend JWT token
  const exchangeFirebaseToken = async (firebaseToken) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebaseToken }),
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        return {
          success: true,
          user: data.data,
          token: data.data.token
        };
      } else {
        throw new Error(data.message || 'Token exchange failed');
      }
    } catch (error) {
      console.error('Firebase token exchange error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        // Store user info in a simpler format, including role
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified,
          role: data.user.role // Include role for admin detection
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
        // Store user info in a simpler format, including role
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified,
          role: data.user.role // Include role for admin detection
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
      
      // If redirect was required, return early to let the page handle it
      if (data.redirectRequired) {
        return { success: true, redirectRequired: true, message: data.message };
      }
      
      if (data.success) {
        // Store token and user data after successful Google login
        localStorage.setItem('token', data.token);
        const userInfo = {
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          isVerified: data.user.isVerified,
          role: data.user.role // Include role for admin detection
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

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const data = await directAuthApi.forgotPassword(email);
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Verify OTP function
  const verifyResetOTP = async (email, otp) => {
    try {
      const data = await directAuthApi.verifyResetOTP(email, otp);
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Reset password function
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const data = await directAuthApi.resetPassword(email, otp, newPassword);
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Change password function
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const data = await directAuthApi.updatePassword(currentPassword, newPassword);
      return data;
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
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};