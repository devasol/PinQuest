import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../services/usePageTitle';
import './AdminLogin.css';

const AdminLogin = () => {
  usePageTitle("Admin Login");
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use a more flexible approach to determine the API URL
      let apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      // If environment variable is not set, try to determine from current origin
      if (!apiUrl) {
        const currentOrigin = window.location.origin;
        if (currentOrigin.includes('localhost:5173')) {
          apiUrl = 'http://localhost:5000/api/v1';
        } else {
          // If frontend is hosted elsewhere, you might need to adjust this
          apiUrl = 'http://localhost:5000/api/v1';
        }
      }
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store the token and user info in localStorage
        localStorage.setItem('token', data.token);
        const userData = data.data; // User data is directly in data.data, not data.data.user
        
        // Ensure role exists in user data - if not present, role defaults to 'user'
        if (!userData.role) {
          userData.role = 'user';
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Determine if user is admin based on role
        const isAdmin = userData.role === 'admin';
        if (isAdmin) {
          localStorage.setItem('isAdmin', 'true');
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend server is running on http://localhost:5000');
      } else {
        setError(err.message || 'An error occurred. Please check your connection and try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <Lock className="admin-login-icon-svg" />
          </div>
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">Sign in to access the admin dashboard</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <AlertTriangle className="admin-login-error-icon" />
            {error}
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-input-group">
            <label htmlFor="email" className="admin-login-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="admin-login-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your admin email"
              required
            />
          </div>

          <div className="admin-login-input-group">
            <label htmlFor="password" className="admin-login-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="admin-login-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="admin-login-button-icon animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p className="admin-login-footer-text">
            For security purposes, only authorized administrators can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;