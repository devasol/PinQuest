import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, X, Camera, Image as ImageIcon } from 'lucide-react';
import Header from '../../components/Landing/Header/Header';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - should be consistent with other components
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const AddPost = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    image: null,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Check authentication before allowing access
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error for this field
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLocationSelect = () => {
    // Navigate to discover page to select location on map
    // In a real app, we'd open a modal map or integrate the map selector into this page
    // For now, we'll just show a message about how this would work
    alert('In the full application, this would open a map to select your location. For now, location selection is integrated in the Discover page.');
    // We'll keep this as a placeholder for the real implementation
    navigate('/discover');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Check if location is properly selected
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      newErrors.location = 'Location is required. Please select a location on the map.';
    }
    
    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Create form data for post submission
      const postData = new FormData();
      postData.append("title", formData.title);
      postData.append("description", formData.description);
      postData.append("category", formData.category);
      
      // Add image if provided
      if (formData.image) {
        postData.append("image", formData.image, formData.image.name);
      }
      
      // Add location as JSON string
      postData.append("location", JSON.stringify({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      }));
      
      // Import and use the posts API service to handle the post creation
      const { postsApi } = await import('../../services/postsApi.js');
      const result = await postsApi.createPostWithFiles(postData);

      if (result.status === "success") {
        // Success - navigate to success page or home
        navigate('/discover');
      } else {
        throw new Error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'An error occurred while creating the post'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/discover');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 pt-24"> {/* pt-24 accounts for header height */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">Share your discovery with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Title Field */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter a descriptive title"
              maxLength="100"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <p className="mt-1 text-xs text-gray-500 text-right">{formData.title.length}/100 characters</p>
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe this location and what makes it special..."
              maxLength="500"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-xs text-gray-500 text-right">{formData.description.length}/500 characters</p>
          </div>

          {/* Category Field */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="general">General</option>
              <option value="nature">Nature</option>
              <option value="culture">Culture</option>
              <option value="shopping">Shopping</option>
              <option value="food">Food & Drinks</option>
              <option value="event">Event</option>
              <option value="travel">Travel</option>
            </select>
          </div>

          {/* Location Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={selectedLocation ? selectedLocation.address : ''}
                    className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    } bg-gray-50`}
                    placeholder="Select location on map"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleLocationSelect}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Select Location
              </button>
            </div>
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            {selectedLocation && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedLocation.lat}, {selectedLocation.lng}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload an image</p>
                  <p className="text-sm text-gray-500">JPG, PNG, GIF up to 5MB</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Post'
              )}
            </button>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddPost;