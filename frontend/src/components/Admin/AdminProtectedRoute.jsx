import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  useEffect(() => {
    const checkAuth = async () => {
      // First check if we have basic auth data
      if (!token) {
        setIsAuthorized(false);
        return;
      }
      
      let isAdmin = false;
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.role === 'admin') {
            setIsAuthorized(true);
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // If user data is missing or not an admin, try to verify via API
      if (token) {
        try {
          let apiUrl = import.meta.env.VITE_API_BASE_URL;
          if (!apiUrl) {
            apiUrl = 'http://localhost:5000/api/v1';
          }
          
          const response = await fetch(`${apiUrl}/admin/verify`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.status === 401) {
            // Token is invalid or expired, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthorized(false);
            return;
          }
          
          const data = await response.json();
          if (data.status === 'success' && data.data?.user?.role === 'admin') {
            // Update local storage with fresh user data
            localStorage.setItem('user', JSON.stringify(data.data.user));
            setIsAuthorized(true);
          } else {
            // Clear tokens if verification fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthorized(false);
          }
        } catch (err) {
          console.error('Error verifying admin status:', err);
          // Clear tokens on error to ensure clean state
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
    };
    
    checkAuth();
  }, []); // Run only once on mount, not when token/user changes

  if (isAuthorized === null) {
    // While checking, show a loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

export default AdminProtectedRoute;