import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.jsx';

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
    // Check for token in URL (from Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Save token to localStorage and remove it from URL (ensure proper trimming)
      const trimmedToken = tokenFromUrl.trim();
      localStorage.setItem('token', trimmedToken);
      // Clean the URL to remove the token
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    let token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user profile (ensure token is properly trimmed)
      const trimmedToken = token.trim();
      if (token !== trimmedToken) {
        // If the token was trimmed, update it in storage
        localStorage.setItem('token', trimmedToken);
        token = trimmedToken;
      }
      
      const fetchUserProfile = async () => {
        try {
          const data = await authService.getProfile();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      // Ensure token is properly trimmed before storing
      const trimmedToken = data.token.trim();
      localStorage.setItem('token', trimmedToken);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const data = await authService.signup(userData);
      // Ensure token is properly trimmed before storing
      const trimmedToken = data.token.trim();
      localStorage.setItem('token', trimmedToken);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    googleLogin: authService.googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};