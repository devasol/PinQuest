import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';

const RealAppExample = () => {
  const { showModal } = useModal();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      showModal({
        title: 'Login Successful',
        message: 'You have been successfully logged in to your account. Redirecting you to the dashboard...',
        type: 'success',
        confirmText: 'Continue',
        autoClose: 3000,
        animationType: 'scale'
      });
    }, 2000);
  };

  const handleDeleteAccount = () => {
    showModal({
      title: 'Confirm Account Deletion',
      message: 'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      type: 'warning',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      showCancelButton: true,
      size: 'lg',
      animationType: 'slide'
    });
  };

  const handleNetworkError = () => {
    showModal({
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'error',
      confirmText: 'Retry',
      cancelText: 'Cancel',
      showCancelButton: true,
      showRetryButton: true,
      onRetry: () => console.log('Retrying connection...'),
      size: 'md',
      animationType: 'fade'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real App Example</h1>
          <p className="text-gray-600 mb-8">Demonstrating the amazing modal in realistic scenarios</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h3>
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors mb-3"
            >
              Delete Account
            </button>
            <button
              onClick={() => {
                showModal({
                  title: 'Feature Coming Soon',
                  message: 'This feature is currently under development and will be available in the next release.',
                  type: 'info',
                  confirmText: 'OK',
                  autoClose: 4000,
                  size: 'md'
                });
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Request Feature
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Scenarios</h3>
            <button
              onClick={handleNetworkError}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg transition-colors mb-3"
            >
              Simulate Network Error
            </button>
            <button
              onClick={() => {
                showModal({
                  title: 'Data Saved',
                  message: 'Your profile information has been successfully updated.',
                  type: 'success',
                  confirmText: 'Great!',
                  size: 'md'
                });
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Success Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealAppExample;