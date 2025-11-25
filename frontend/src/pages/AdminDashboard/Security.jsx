import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, User, Settings, AlertCircle, Loader2 } from 'lucide-react';
import usePageTitle from '../../services/usePageTitle';
import './Security.css';

const Security = () => {
  usePageTitle("Security Settings");
  const [showPassword, setShowPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    suspiciousActivity: true,
    autoLogout: 30,
    passwordExpiry: 90
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Fetch recent activity from backend
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Determine API URL with fallback
        let apiUrl = import.meta.env.VITE_API_BASE_URL;
        if (!apiUrl) {
          apiUrl = 'http://localhost:5000/api/v1';
        }
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`${apiUrl}/analytics/activity-timeline?days=7`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activity');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          // Format the activity data to match our frontend structure
          const formattedActivity = data.data.map((activity, index) => ({
            id: activity._id || index,
            action: activity.action || 'Unknown activity',
            time: activity.date || new Date().toISOString(),
            ip: activity.ip || 'N/A',
            location: activity.location || 'N/A'
          }));
          
          setRecentActivity(formattedActivity);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match!');
      setPasswordLoading(false);
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long!');
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setPasswordError('No authentication token found');
        setPasswordLoading(false);
        return;
      }

      // Determine API URL with fallback
      let apiUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiUrl) {
        apiUrl = 'http://localhost:5000/api/v1';
      }
      
      // For admin password change, we'd typically use a different endpoint
      // This assumes there's an admin endpoint to change user passwords
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        alert('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError('Network error. Please try again.');
      console.error('Password change error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSecuritySettingChange = async (setting) => {
    const currentValue = securitySettings[setting];
    const newValue = !currentValue;
    
    // Update the setting immediately in the UI
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: newValue
    }));

    try {
      // In a real implementation, you would make an API call to update the setting
      // Example: await updateSecuritySetting(setting, newValue);
      console.log(`Updated ${setting} to ${newValue}`);
    } catch (err) {
      // If the API call fails, revert the change
      setSecuritySettings(prev => ({
        ...prev,
        [setting]: currentValue
      }));
      alert('Failed to update setting: ' + err.message);
    }
  };

  const handleAutoLogoutChange = async (value) => {
    const newValue = parseInt(value);
    
    setSecuritySettings(prev => ({
      ...prev,
      autoLogout: newValue
    }));

    try {
      // In a real implementation, you would make an API call to update the setting
      // Example: await updateSecuritySetting('autoLogout', newValue);
      console.log(`Updated autoLogout to ${newValue}`);
    } catch (err) {
      // If the API call fails, revert the change
      setSecuritySettings(prev => ({
        ...prev,
        autoLogout: securitySettings.autoLogout
      }));
      alert('Failed to update auto logout setting: ' + err.message);
    }
  };

  if (loading && recentActivity.length === 0) {
    return (
      <div className="security-page">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading security data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="security-page">
      <div className="security-header">
        <h2 className="security-title">Security Settings</h2>
        <p className="security-subtitle">Manage your account security and privacy settings</p>
      </div>

      <div className="security-grid">
        {/* Password Change */}
        <div className="security-card">
          <div className="security-card-header">
            <div className="security-card-icon">
              <Lock className="security-card-icon-svg" />
            </div>
            <div>
              <h3 className="security-card-title">Change Admin Password</h3>
              <p className="security-card-description">Update your admin account password</p>
            </div>
          </div>
          
          <form className="security-form" onSubmit={handleSubmitPassword}>
            <div className="security-form-group">
              <label htmlFor="currentPassword" className="security-form-label">Current Password</label>
              <div className="security-password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  className="security-form-input"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="security-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="security-password-icon" /> : <Eye className="security-password-icon" />}
                </button>
              </div>
            </div>

            <div className="security-form-group">
              <label htmlFor="newPassword" className="security-form-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="security-form-input"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
              <p className="security-form-help">Password must be at least 8 characters long</p>
            </div>

            <div className="security-form-group">
              <label htmlFor="confirmPassword" className="security-form-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="security-form-input"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            {passwordError && (
              <div className="security-error">
                <AlertCircle className="security-error-icon" />
                {passwordError}
              </div>
            )}

            <button type="submit" className="security-btn security-btn-primary" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="security-btn-icon animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="security-card">
          <div className="security-card-header">
            <div className="security-card-icon">
              <Settings className="security-card-icon-svg" />
            </div>
            <div>
              <h3 className="security-card-title">Security Settings</h3>
              <p className="security-card-description">Configure your security preferences</p>
            </div>
          </div>
          
          <div className="security-settings">
            <div className="security-setting-item">
              <div className="security-setting-info">
                <h4 className="security-setting-title">Two-Factor Authentication</h4>
                <p className="security-setting-description">Add an extra layer of security to your account</p>
              </div>
              <label className="security-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.twoFactorAuth}
                  onChange={() => handleSecuritySettingChange('twoFactorAuth')}
                />
                <span className="security-slider"></span>
              </label>
            </div>

            <div className="security-setting-item">
              <div className="security-setting-info">
                <h4 className="security-setting-title">Login Notifications</h4>
                <p className="security-setting-description">Receive email notifications for new login attempts</p>
              </div>
              <label className="security-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.loginNotifications}
                  onChange={() => handleSecuritySettingChange('loginNotifications')}
                />
                <span className="security-slider"></span>
              </label>
            </div>

            <div className="security-setting-item">
              <div className="security-setting-info">
                <h4 className="security-setting-title">Suspicious Activity Alerts</h4>
                <p className="security-setting-description">Get notified of unusual account activity</p>
              </div>
              <label className="security-switch">
                <input
                  type="checkbox"
                  checked={securitySettings.suspiciousActivity}
                  onChange={() => handleSecuritySettingChange('suspiciousActivity')}
                />
                <span className="security-slider"></span>
              </label>
            </div>

            <div className="security-setting-item">
              <div className="security-setting-info">
                <h4 className="security-setting-title">Auto Logout</h4>
                <p className="security-setting-description">Time before auto logout when inactive</p>
              </div>
              <select 
                className="security-select"
                value={securitySettings.autoLogout}
                onChange={(e) => handleAutoLogoutChange(e.target.value)}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={0}>Never</option>
              </select>
            </div>

            <div className="security-setting-item">
              <div className="security-setting-info">
                <h4 className="security-setting-title">Password Expiry</h4>
                <p className="security-setting-description">Days before password expires</p>
              </div>
              <select 
                className="security-select"
                value={securitySettings.passwordExpiry}
                onChange={(e) => setSecuritySettings(prev => ({...prev, passwordExpiry: parseInt(e.target.value)}))}
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="security-card security-recent-activity">
          <div className="security-card-header">
            <div className="security-card-icon">
              <Clock className="security-card-icon-svg" />
            </div>
            <div>
              <h3 className="security-card-title">Recent Activity</h3>
              <p className="security-card-description">Your recent login activity</p>
            </div>
          </div>
          
          {error ? (
            <div className="security-error">
              <AlertCircle className="security-error-icon" />
              Failed to load activity: {error}
            </div>
          ) : (
            <div className="security-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="security-activity-item">
                    <div className={`security-activity-icon ${activity.action.includes('Failed') || activity.action.includes('Error') ? 'security-activity-icon-warning' : 'security-activity-icon-success'}`}>
                      {activity.action.includes('Failed') || activity.action.includes('Error') ? <AlertTriangle className="security-activity-icon-svg" /> : <CheckCircle className="security-activity-icon-svg" />}
                    </div>
                    <div className="security-activity-content">
                      <div className="security-activity-info">
                        <p className="security-activity-text">{activity.action}</p>
                        <span className="security-activity-time">{new Date(activity.time).toLocaleString()}</span>
                      </div>
                      <div className="security-activity-meta">
                        {activity.ip && <span className="security-activity-ip">IP: {activity.ip}</span>}
                        {activity.location && <span className="security-activity-location">Location: {activity.location}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="security-activity-item">
                  <div className="security-activity-content">
                    <p className="security-activity-text">No recent activity found</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Security;