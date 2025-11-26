import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { User, MapPin, Star, Bookmark, Activity, Calendar, Image } from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import usePageTitle from '../../services/usePageTitle';
import './ProfilePage.css';

const ProfilePage = () => {
  usePageTitle("Profile");
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [savedLocations, setSavedLocations] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(6);
  const [savedPerPage] = useState(6);
  const [editingPost, setEditingPost] = useState(null);
  const [postEditData, setPostEditData] = useState({ title: '', description: '', category: 'general' });
  const [deleting, setDeleting] = useState(null); // Track what we're deleting
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load user data and initialize
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData(user);
      setEditData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
      });
      loadUserData();
    }
  }, [isAuthenticated, user]);

  // Load user-specific data
  const loadUserData = async () => {
    try {
      setLoadingData(true);
      
      // Load saved locations
      const savedResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/users/saved-locations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSavedLocations(savedData.data?.savedLocations || []);
      }
      
      // Load all posts and filter for user's posts
      const postsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // Filter posts by current user
        const userPostsData = postsData.data?.filter(post => 
          post.postedBy?._id === user._id || post.postedBy === user._id
        ) || [];
        setUserPosts(userPostsData);
      }
      
      // Generate activity log
      generateActivityLog();
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Generate activity log based on user actions
  const generateActivityLog = () => {
    const newActivities = [];
    
    // Add saved locations to activities
    savedLocations.slice(0, 10).forEach(location => {
      newActivities.push({
        id: `save-${location.id}`,
        type: 'saved',
        title: `Saved ${location.title || location.name}`,
        timestamp: location.savedAt || location.datePosted,
        icon: Bookmark,
      });
    });
    
    // Add posts to activities
    userPosts.slice(0, 10).forEach(post => {
      newActivities.push({
        id: `post-${post._id}`,
        type: 'post',
        title: `Posted ${post.title}`,
        timestamp: post.datePosted,
        icon: MapPin,
      });
    });
    
    // Sort by timestamp, newest first
    newActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setActivities(newActivities);
  };

  // Handle profile updates
  const handleUpdateProfile = async () => {
    try {
      setUploading(true);
      
      // Update user profile in Firebase
      if (auth.currentUser) {
        await auth.currentUser.updateProfile({
          displayName: editData.name,
        });
      }
      
      // Update local state 
      setUserData(prev => ({
        ...prev,
        name: editData.name,
        bio: editData.bio,
        location: editData.location
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUploading(false);
    }
  };





  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to delete a saved location
  const deleteSavedLocation = async (locationId) => {
    if (!window.confirm("Are you sure you want to remove this saved location?")) {
      return;
    }

    setDeleting(locationId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/users/saved-locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the location from the state
        const updatedSavedLocations = savedLocations.filter(loc => loc.id !== locationId);
        setSavedLocations(updatedSavedLocations);
        
        // Update activities log to reflect the change
        generateActivityLog();
      } else {
        const errorData = await response.json();
        console.error('Delete saved location error:', errorData);
        alert('Failed to remove saved location: ' + (errorData.message || 'Please try again.'));
      }
    } catch (error) {
      console.error('Error removing saved location:', error);
      alert('An error occurred while removing the saved location. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Function to delete a post
  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setDeleting(postId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the post from the state
        const updatedUserPosts = userPosts.filter(post => post._id !== postId);
        setUserPosts(updatedUserPosts);
        
        // Update activities log to reflect the change
        generateActivityLog();
      } else {
        const errorData = await response.json();
        console.error('Delete post error:', errorData);
        alert('Failed to delete post: ' + (errorData.message || 'Please try again.'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Function to start editing a post
  const startEditPost = (post) => {
    setEditingPost(post._id);
    setPostEditData({
      title: post.title,
      description: post.description,
      category: post.category || 'general'
    });
  };

  // Function to update a post
  const updatePost = async (postId) => {
    setDeleting(postId); // Reusing for update loading state

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postEditData.title,
          description: postEditData.description,
          category: postEditData.category,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the post in the state
        const updatedUserPosts = userPosts.map(post => 
          post._id === postId ? { ...post, ...result.data } : post
        );
        setUserPosts(updatedUserPosts);
        
        // Reset edit state
        setEditingPost(null);
        setPostEditData({ title: '', description: '', category: 'general' });
      } else {
        const errorData = await response.json();
        console.error('Update post error:', errorData);
        alert('Failed to update post: ' + (errorData.message || 'Please try again.'));
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('An error occurred while updating the post. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Function to cancel post edit
  const cancelEditPost = () => {
    setEditingPost(null);
    setPostEditData({ title: '', description: '', category: 'general' });
  };

  // Pagination for posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = userPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPagesPosts = Math.ceil(userPosts.length / postsPerPage);

  // Pagination for saved locations
  const [savedPage, setSavedPage] = useState(1);
  const indexOfLastSaved = savedPage * savedPerPage;
  const indexOfFirstSaved = indexOfLastSaved - savedPerPage;
  const currentSaved = savedLocations.slice(indexOfFirstSaved, indexOfLastSaved);
  const totalPagesSaved = Math.ceil(savedLocations.length / savedPerPage);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to access your profile</p>
          <a 
            href="/login"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userData.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userData.name || 'User'}!</h1>
                <p className="text-gray-600">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'saved', label: 'Saved Locations', icon: Bookmark },
            { id: 'posts', label: 'My Posts', icon: MapPin },
            ...(isAuthenticated ? [{ id: 'activities', label: 'Activities', icon: Activity }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto profile-picture-ring">
                    {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{userData.name || 'User'}</h3>
                    <p className="text-gray-600">{userData.email}</p>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium">{user.createdAt ? formatDate(user.createdAt) : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-medium">{userPosts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Saved Locations</span>
                    <span className="font-medium">{savedLocations.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={uploading}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
                      >
                        {uploading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({...editData, location: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Your location"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{userData.name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{userData.email || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Bio</span>
                      <span className="font-medium">{userData.bio || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Location</span>
                      <span className="font-medium">{userData.location || 'Not set'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved Locations Tab */}
        {activeTab === 'saved' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Locations</h2>
            
            {savedLocations.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved locations yet</h3>
                <p className="text-gray-600">Start exploring and save your favorite places!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentSaved.map((location) => (
                    <div key={location.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{location.title || location.name}</h3>
                        <button
                          onClick={() => deleteSavedLocation(location.id)}
                          disabled={deleting === location.id}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          title="Remove saved location"
                        >
                          {deleting === location.id ? (
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            </div>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{location.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Saved: {formatDate(location.savedAt)}</span>
                        <span>Category: {location.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination for saved locations */}
                {totalPagesSaved > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSavedPage(prev => Math.max(prev - 1, 1))}
                        disabled={savedPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPagesSaved }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setSavedPage(page)}
                          className={`px-4 py-2 rounded-lg ${
                            savedPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setSavedPage(prev => Math.min(prev + 1, totalPagesSaved))}
                        disabled={savedPage === totalPagesSaved}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Posts</h2>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">Start sharing your favorite places with the community!</p>
                <a 
                  href="/discover"
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 inline-block"
                >
                  Discover Places
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPosts.map((post) => (
                    <div key={post._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      {editingPost === post._id ? (
                        // Edit form
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={postEditData.title}
                            onChange={(e) => setPostEditData({...postEditData, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Post title"
                          />
                          <textarea
                            value={postEditData.description}
                            onChange={(e) => setPostEditData({...postEditData, description: e.target.value})}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Post description"
                          />
                          <select
                            value={postEditData.category}
                            onChange={(e) => setPostEditData({...postEditData, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="general">General</option>
                            <option value="nature">Nature</option>
                            <option value="culture">Culture</option>
                            <option value="shopping">Shopping</option>
                            <option value="food">Food & Drinks</option>
                            <option value="event">Event</option>
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updatePost(post._id)}
                              disabled={deleting === post._id}
                              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors duration-200"
                            >
                              {deleting === post._id ? 'Updating...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditPost}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-blue-500 mr-1" />
                              <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditPost(post)}
                                className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                title="Edit post"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deletePost(post._id)}
                                disabled={deleting === post._id}
                                className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                title="Delete post"
                              >
                                {deleting === post._id ? (
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                  </div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.description}</p>
                          
                          {post.images && post.images.length > 0 && (
                            <div className="mb-3">
                              <OptimizedImage
                                src={typeof post.images[0] === 'string' ? post.images[0] : (post.images[0]?.url || post.images[0]?.image)}
                                alt={post.title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(post.datePosted)}</span>
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              <span>{post.averageRating?.toFixed(1) || 0}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination for posts */}
                {totalPagesPosts > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPagesPosts }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesPosts))}
                        disabled={currentPage === totalPagesPosts}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Feed</h2>
            
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">Your activities will appear here as you interact with the app.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'activities' && !isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-4">Please log in to view your activity feed.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;