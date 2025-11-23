import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Check if user is authenticated and has admin role
  let isAdmin = false;
  
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      isAdmin = userData.role === 'admin';
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

export default AdminProtectedRoute;