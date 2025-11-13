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
      const data = await authService.login({ email, password });
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('firebaseUser', JSON.stringify(data.user));
        setUser(data.user);
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
      const data = await authService.signup(userData);
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('firebaseUser', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, data };
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
      localStorage.removeItem('token');
      localStorage.removeItem('firebaseUser');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('firebaseUser');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await authService.googleLogin();
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('firebaseUser', JSON.stringify(data.user));
        setUser(data.user);
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
    logout,
    googleLogin: handleGoogleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};