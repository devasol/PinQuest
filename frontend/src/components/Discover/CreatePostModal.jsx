import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Image as ImageIcon, Plus, Upload, Camera, Link, Trash2, Check, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import './CreatePostModal.css';

const CreatePostModal = ({ 
  isOpen, 
  onClose, 
  initialPosition = null, 
  onCreatePost, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const formRef = useRef(null);
  
  // Update selectedPosition when initialPosition prop changes
  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition(initialPosition);
    }
  }, [initialPosition]);
  
  useEffect(() => {
    let handleWheel;
    
    if (isOpen && formRef.current) {
      // Prevent scroll wheel from affecting the map when scrolling in modal
      handleWheel = (e) => {
        if (formRef.current && formRef.current.contains(e.target)) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (handleWheel) {
        document.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isOpen]);

  const [fileImages, setFileImages] = useState([]); // For uploaded files
  const [linkImages, setLinkImages] = useState([]); // For image links
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'link'
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);

  const categories = [
    { value: "general", label: "General" },
    { value: "nature", label: "Nature" },
    { value: "culture", label: "Culture" },
    { value: "shopping", label: "Shopping" },
    { value: "food", label: "Food & Drinks" },
    { value: "event", label: "Event" },
    { value: "travel", label: "Travel" },
  ];

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Location is automatically set from the map click, no need to validate here
    // since the modal only opens when a location has been selected

    if ((fileImages.length + linkImages.length) === 0) {
      newErrors.images = "At least one image is required";
    }

    if ((fileImages.length + linkImages.length) > 10) {
      newErrors.images = "You can only upload up to 10 images total";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedPosition || 
        (!selectedPosition?.lat && !selectedPosition?.latitude) || 
        (!selectedPosition?.lng && !selectedPosition?.longitude)) {
      setErrors({ submit: "Location is required. Please select a location on the map." });
      return;
    }
    
    try {
      // Handle different possible location property names
      const lat = selectedPosition?.lat || selectedPosition?.latitude;
      const lng = selectedPosition?.lng || selectedPosition?.longitude;
      
      if (!lat || !lng) {
        setErrors({ submit: "Location coordinates are invalid. Please select a location on the map." });
        return;
      }
      
      // Check if we have file images
      const hasFileImages = fileImages.length > 0;
      const hasLinkImages = linkImages.length > 0;
      
      if (!hasFileImages && !hasLinkImages) {
        setErrors({ submit: "At least one image is required" });
        return;
      }
      
      if (hasFileImages) {
        // Create FormData for file uploads
        const formDataToSend = new FormData();
        
        // Add text fields
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });
        
        // Add location data
        if (lat !== undefined && lng !== undefined) {
          formDataToSend.append('location[latitude]', lat.toString());
          formDataToSend.append('location[longitude]', lng.toString());
        }
        
        // Add image files
        fileImages.forEach(img => {
          if (img.file) {
            formDataToSend.append('images', img.file, img.name);
          }
        });
        
        // Add image links if any
        if (hasLinkImages) {
          linkImages.forEach(img => {
            if (img.url) {
              formDataToSend.append('imageLinks', img.url);
            }
          });
        }
        
        await onCreatePost(formDataToSend);
      } else {
        // No file images, just image links - send as regular object
        const postPayload = {
          ...formData,
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
        };

        if (hasLinkImages) {
          postPayload.imageLinks = linkImages.map(img => img.url);
        }
        
        await onCreatePost(postPayload);
      }
      
      // Reset form on successful post creation
      setFormData({ title: "", description: "", category: "general" });
      setFileImages([]);
      setLinkImages([]);
      setErrors({});
      
      // Close the modal after successful creation
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setErrors({ submit: error.message || "An error occurred while creating the post" });
      // Re-throw the error so the parent component can handle loading state
      throw error;
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle image upload from files
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    addImagesFromFiles(files);
  };

  const addImagesFromFiles = useCallback(async (files) => {
    const filesToAdd = files.slice(0, 10 - fileImages.length - linkImages.length);
    
    if (filesToAdd.length === 0) {
      setErrors((prev) => ({
        ...prev,
        images: "You can only upload up to 10 images total",
      }));
      return;
    }

    const compressionOptions = {
      maxSizeMB: 1,           // (default is Number.POSITIVE_INFINITY)
      maxWidthOrHeight: 1920, // (default is undefined)
      useWebWorker: true,     // (default is false)
      initialQuality: 0.8, // (default is 1) Initial compression quality
    };

    for (const file of filesToAdd) { // Changed forEach to for...of to use await properly
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          images: "Please select valid image files",
        }));
        return; // Stop processing further files if one is invalid
      }

      // Check original file size first (if it's too large, don't even attempt compression)
      if (file.size > 15 * 1024 * 1024) { // Allow up to 15MB original size
        setErrors((prev) => ({
          ...prev,
          images: `File size for ${file.name} must be less than 15MB (original)`,
        }));
        return; // Stop processing further files if one is too large
      }

      try {
        // Compress the image
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
        
        // After compression, check if the compressed file size is within limits
        if (compressedFile.size > 2 * 1024 * 1024) { // Compressed file should not exceed 2MB
          setErrors((prev) => ({
            ...prev,
            images: `Compressed file size for ${file.name} exceeds 2MB. Please choose a smaller image.`,
          }));
          return; // Stop processing further files if compressed size is too large
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage = {
            id: Date.now() + Math.random(),
            file: compressedFile, // Store the compressed file
            preview: reader.result,
            name: file.name, // Keep original file name for display
          };
          setFileImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(compressedFile); // Read compressed file for preview
      } catch (error) {
        console.error("Error compressing image:", error);
        setErrors((prev) => ({
          ...prev,
          images: `Error compressing image ${file.name}. Please try another image.`,
        }));
        return; // Stop processing further files if compression fails
      }
    }

    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  }, [fileImages, linkImages, errors]); // Dependencies for useCallback

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addImagesFromFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle image from link
  const handleImageLinkAdd = (url) => {
    if (!url) {
      setErrors((prev) => ({
        ...prev,
        images: "Please enter an image URL"
      }));
      return;
    }
    
    if (!isValidUrl(url)) {
      setErrors((prev) => ({
        ...prev,
        images: "Please enter a valid image URL"
      }));
      return;
    }

    if ((fileImages.length + linkImages.length) >= 10) {
      setErrors((prev) => ({
        ...prev,
        images: "You can only upload up to 10 images total"
      }));
      return;
    }

    const newImageLink = {
      id: Date.now() + Math.random(),
      url: url,
      name: `Image from Link`
    };

    setLinkImages((prev) => [...prev, newImageLink]);
    
    // Clear any previous image errors after successful addition
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) { // Changed back to _
      return false;
    }
  };

  // Remove image
  const removeImage = (id) => {
    setFileImages((prev) => prev.filter((img) => img.id !== id));
    setLinkImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Clear all images
  const clearAllImages = () => {
    setFileImages([]);
    setLinkImages([]);
  };

  // Close modal and reset form
  const closeAndReset = () => {
    setFormData({ title: "", description: "", category: "general" });
    setFileImages([]);
    setLinkImages([]);
    setErrors({});
    setSelectedPosition(initialPosition);
    onClose();
  };

  if (!isOpen) return null;

  const displayLat = selectedPosition?.lat ?? selectedPosition?.latitude;
  const displayLng = selectedPosition?.lng ?? selectedPosition?.longitude;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-2 sm:p-4 create-post-modal-container"
        onClick={(e) => {
          // Only close if the click was directly on the backdrop, not on the modal itself
          if (e.target === e.currentTarget) {
            closeAndReset();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col z-[100000] border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 sm:p-5 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create New Post</h2>
                  <p className="text-xs text-slate-300">Share your discovery with the community</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeAndReset();
                }}
                className="p-2 rounded-full hover:bg-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-200" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            {/* Title Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pl-11 pr-4 border rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 ${
                    errors.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-slate-600 focus:border-emerald-500"
                  } bg-slate-700/50 focus:bg-slate-700 text-white placeholder:text-slate-400`}
                  placeholder="Enter a descriptive title"
                  maxLength="100"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.title && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.title}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.title.length > 90
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {formData.title.length}/100
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-emerald-500">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full px-4 py-3 pl-11 pr-4 border rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-slate-600 focus:border-emerald-500"
                  } bg-slate-700/50 focus:bg-slate-700 text-white placeholder:text-slate-400`}
                  placeholder="Describe this location and what makes it special..."
                  maxLength="500"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.description.length > 450
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Location Field - This is pre-filled and fixed based on user's map click */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Location *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={
                    selectedPosition && (typeof displayLat === 'number') && (typeof displayLng === 'number')
                      ? `Lat: ${displayLat.toFixed(6)}, Lng: ${displayLng.toFixed(6)}`
                      : "Location not selected"
                  }
                  readOnly
                  className="w-full px-4 py-3 pl-11 pr-4 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-200"
                  placeholder="Location set from map click"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                This location is fixed based on where you clicked on the map
              </p>
              {errors.location && (
                <p className="mt-1 text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-11 pr-10 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 bg-slate-700/50 focus:bg-slate-700 text-white appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-slate-700">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images Section */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Images * (Up to 10)
              </label>

              {/* Tabs for upload vs link */}
              <div className="flex border-b border-slate-600 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'upload'
                      ? 'text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('link')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'link'
                      ? 'text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4" />
                    <span>From Link</span>
                  </div>
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div>
                  {/* Upload area */}
                  <div
                    className={`border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-900/20'
                        : 'border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => (fileImages.length + linkImages.length) < 10 && fileInputRef.current?.click()}
                  >
                    <div className="p-4 text-center">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-emerald-400 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-400">JPG, PNG, GIF up to 5MB each</p>
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={linkInputRef}
                      type="text"
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-700/50 text-white placeholder:text-slate-400"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && linkInputRef.current) {
                          e.preventDefault();
                          handleImageLinkAdd(linkInputRef.current.value);
                          linkInputRef.current.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (linkInputRef.current) {
                          handleImageLinkAdd(linkInputRef.current.value);
                          linkInputRef.current.value = '';
                          linkInputRef.current.focus(); // Return focus to input after adding
                        }
                      }}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              {errors.images && (
                <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.images}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{(fileImages.length + linkImages.length)}/10</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((fileImages.length + linkImages.length) / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Preview of uploaded images */}
            {(fileImages.length + linkImages.length) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-slate-300">Your Images ({fileImages.length + linkImages.length})</h3>
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[...fileImages, ...linkImages].map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group aspect-square rounded-lg overflow-hidden shadow-sm"
                    >
                      <div className="w-full h-full bg-slate-700 relative">
                        {image.preview ? (
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700">
                            <img
                              src={image.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="fallback absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                              <Link className="w-4 h-4 mr-1" />
                              {image.name}
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all shadow-md z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeAndReset();
                }}
                className="flex-1 px-4 py-3 border border-slate-600 text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Post</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg"
              >
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </motion.div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostModal;