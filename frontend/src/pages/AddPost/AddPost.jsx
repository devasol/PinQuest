import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { MapPin, X, Image as ImageIcon, Plus, Upload } from 'lucide-react';
import Header from '../../components/Landing/Header/Header';
import { useAuth } from '../../contexts/AuthContext';

// API base URL - should be consistent with other components
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const AddPost = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
  });
  const [selectedLocation, setSelectedLocation] = useState(null); // eslint-disable-line no-unused-vars
  const [images, setImages] = useState([]);
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
      validateAndAddImage(file);
    }
  };

  const validateAndAddImage = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        image: 'Please select a valid image file'
      }));
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: 'File size must be less than 5MB'
      }));
      return false;
    }

    // Check if we've reached the limit of 10 images
    if (images.length >= 10) {
      setErrors(prev => ({
        ...prev,
        image: 'You can only upload up to 10 images'
      }));
      return false;
    }

    // Create preview and add to images array
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = {
        id: Date.now() + Math.random(),
        file: file,
        preview: reader.result
      };
      setImages(prev => [...prev, newImage]);
      
      // Clear error for this field
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    };
    reader.readAsDataURL(file);

    return true;
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleAddButtonClick = () => {
    fileInputRef.current?.click();
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
      
      // Add all images if provided
      images.forEach((img, index) => {
        postData.append(`images`, img.file, img.file.name);
      });
      
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24"> {/* pt-24 accounts for header height */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
          whileHover={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-sans">Create New Post</h1>
                <p className="text-emerald-100 font-sans">Share your discovery with the community</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Title Field */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 ${
                    errors.title 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-emerald-200 focus:border-emerald-500'
                  } bg-gray-50 focus:bg-white shadow-sm focus:shadow-md`}
                  placeholder="Enter a descriptive title"
                  maxLength="100"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </motion.div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                {errors.title && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-sans"
                  >
                    {errors.title}
                  </motion.p>
                )}
                <p className={`text-xs ml-auto font-sans ${formData.title.length > 90 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.title.length}/100 characters
                </p>
              </div>
            </motion.div>

            {/* Description Field */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                Description *
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 resize-none ${
                    errors.description 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-emerald-200 focus:border-emerald-500'
                  } bg-gray-50 focus:bg-white shadow-sm focus:shadow-md`}
                  placeholder="Describe this location and what makes it special..."
                  maxLength="500"
                />
                <div className="absolute left-4 top-4 text-emerald-400">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </motion.div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                {errors.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-sans"
                  >
                    {errors.description}
                  </motion.p>
                )}
                <p className={`text-xs ml-auto font-sans ${formData.description.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.description.length}/500 characters
                </p>
              </div>
            </motion.div>

            {/* Category Field */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-6"
            >
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 pr-10 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none shadow-sm focus:shadow-md font-sans"
                >
                  <option value="general">General</option>
                  <option value="nature">Nature</option>
                  <option value="culture">Culture</option>
                  <option value="shopping">Shopping</option>
                  <option value="food">Food & Drinks</option>
                  <option value="event">Event</option>
                  <option value="travel">Travel</option>
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </motion.div>
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Location Field */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                Location *
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={selectedLocation ? selectedLocation.address : ''}
                      className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 ${
                        errors.location 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-emerald-200 focus:border-emerald-500'
                      } bg-gray-50 focus:bg-white shadow-sm focus:shadow-md font-sans`}
                      placeholder="Select location on map"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                      <div className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    </div>
                    <MapPin className="absolute left-10 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLocationSelect}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <MapPin className="w-4 h-4" />
                  Select Location
                </button>
              </div>
              {errors.location && <p className="mt-2 text-red-500 text-sm font-sans">{errors.location}</p>}
              {selectedLocation && (
                <p className="mt-2 text-sm text-gray-600 font-sans">
                  Selected: {selectedLocation.lat}, {selectedLocation.lng}
                </p>
              )}
            </motion.div>

            {/* Image Upload Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mb-8"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                Images (Optional - Up to 10)
              </label>
              
              {/* Image Upload Input */}
              <div className="mb-4">
                <div 
                  className="border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50"
                  onClick={handleAddButtonClick}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 border-2 border-dashed border-emerald-200 rounded-2xl"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4"
                    >
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </motion.div>
                    <p className="text-emerald-800 font-medium mb-1 font-sans">Click to upload images</p>
                    <p className="text-sm text-emerald-600 font-sans">JPG, PNG, GIF up to 5MB each</p>
                    <p className="text-xs text-emerald-500 font-sans mt-2">Drag & drop supported</p>
                    <div className="mt-4 w-full max-w-xs h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: images.length > 0 ? `${(images.length / 10) * 100}%` : 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {errors.image && <p className="mt-2 text-red-500 text-sm font-sans">{errors.image}</p>}
              </div>

              {/* Uploaded Images Preview */}
              {images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="flex flex-wrap gap-4">
                    {images.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ y: -5, scale: 1.03 }}
                        className="relative group w-32 h-32 flex-shrink-0"
                      >
                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                          <img 
                            src={image.preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110 shadow-lg z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-sm text-gray-600 font-sans">
                      {images.length}/10 images uploaded
                    </p>
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setImages([])}
                        className="text-red-500 hover:text-red-700 text-sm font-sans underline transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Form Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200"
            >
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border-2 border-emerald-300 text-emerald-700 bg-white rounded-xl hover:bg-emerald-50 transition-all duration-300 font-medium hover:shadow-md hover:shadow-emerald-100 hover:border-emerald-400 hover:text-emerald-800 font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group font-sans"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Post
                      <motion.span
                        animate={{ x: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Plus className="ml-2 w-5 h-5" />
                      </motion.span>
                    </>
                  )}
                </span>
                {!loading && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ opacity: 1 }}
                    initial={false}
                  />
                )}
              </button>
            </motion.div>

            {errors.submit && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-red-700 text-sm font-sans">{errors.submit}</p>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddPost;