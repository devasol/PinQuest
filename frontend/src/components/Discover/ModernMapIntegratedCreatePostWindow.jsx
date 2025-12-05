import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Image as ImageIcon, Plus, Upload, Link, Trash2, Check, AlertCircle, Navigation, Globe } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const categories = [
  { value: "general", label: "General" },
  { value: "food", label: "Food & Dining" },
  { value: "nature", label: "Nature & Outdoors" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "lodging", label: "Lodging" },
  { value: "landmark", label: "Landmark" },
  { value: "other", label: "Other" }
];

const ModernMapIntegratedCreatePostWindow = ({ 
  isVisible, 
  onClose, 
  onCreatePost, 
  selectedPosition, 
  initialPosition, // For backward compatibility
  position,
  loading = false
}) => {
  // Use selectedPosition if available, otherwise fall back to initialPosition
  const actualSelectedPosition = selectedPosition || initialPosition;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general"
  });

  const [errors, setErrors] = useState({});
  const [fileImages, setFileImages] = useState([]);
  const [linkImages, setLinkImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

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

    if (!actualSelectedPosition || 
        (!actualSelectedPosition.lat && !actualSelectedPosition.latitude) || 
        (!actualSelectedPosition.lng && !actualSelectedPosition.longitude)) {
      setErrors({ submit: "Location is required. Please select a location on the map." });
      return;
    }
    
    try {
      // Handle different possible location property names
      const lat = actualSelectedPosition.lat || actualSelectedPosition.latitude;
      const lng = actualSelectedPosition.lng || actualSelectedPosition.longitude;
      
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
      // Only update errors if not unmounting to prevent memory leaks
      if (!error.message.includes('unmounted') && !error.message.includes('unmount')) {
        setErrors({ submit: error.message || "An error occurred while creating the post" });
      }
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
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };

    for (const file of filesToAdd) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          images: "Please select valid image files",
        }));
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          images: `File size for ${file.name} must be less than 15MB (original)`,
        }));
        return;
      }

      try {
        // Compress the image
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
        
        // After compression, check if the compressed file size is within limits
        if (compressedFile.size > 2 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            images: `Compressed file size for ${file.name} exceeds 2MB. Please choose a smaller image.`,
          }));
          return;
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
        return;
      }
    }

    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  }, [fileImages, linkImages, errors]);

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
    } catch (_) {
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

  // Calculate positions to place modal above the click with pointer
  const calculatedPositionRef = React.useRef(null);
  const positionPropRef = React.useRef(null);
  
  const calculateAdjustedPosition = React.useCallback(() => {
    if (!position) return { top: '20px', left: '20px' };
    
    // Check if the position prop has changed, if so, reset the stored calculation
    if (positionPropRef.current !== position) {
      calculatedPositionRef.current = null;
      positionPropRef.current = position;
    }
    
    // Only calculate once and store in ref to prevent position changes during interactions
    if (calculatedPositionRef.current) {
      return calculatedPositionRef.current;
    }
    
    const clickTop = position.y;
    const clickLeft = position.x;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Modal dimensions 
    const modalWidth = 320; // Fixed width
    const modalHeight = 550; // Approximate height
    
    // Position the modal above the click location
    // First, try to center the modal horizontally above the click
    let adjustedTop = Math.max(20, clickTop - modalHeight - 20); // Position above the click with proper spacing for arrow, minimum 20px from top
    let adjustedLeft = Math.max(20, clickLeft - (modalWidth / 2)); // Center modal horizontally over the click, minimum 20px from left
    
    // Ensure modal stays within viewport bounds - adjust for right edge
    if (adjustedLeft + modalWidth > viewportWidth - 20) {
      // If centered position goes off right edge, align with click but adjust to stay in viewport
      adjustedLeft = Math.max(20, Math.min(clickLeft - (modalWidth / 2), viewportWidth - modalWidth - 20));
    }
    
    // Ensure modal stays within viewport bounds - if too far left after adjustment
    if (adjustedLeft < 20) {
      adjustedLeft = 20;
    }
    
    // Final safety check to ensure modal doesn't overlap the click point
    if (adjustedTop >= clickTop - 10 && adjustedTop <= clickTop + 10) {
      adjustedTop = Math.max(20, clickTop - 140); // Ensure it's well above the click
    }
    
    // Store the calculated position to prevent recalculation during interactions
    const calculatedPos = { 
      top: `${adjustedTop}px`,
      left: `${adjustedLeft}px`
    };
    calculatedPositionRef.current = calculatedPos;
    return calculatedPos;
  }, [position]); // Only recalculate when position changes
  
  // Use the memoized position calculation
  const adjustedPosition = calculateAdjustedPosition();

  // Close modal and reset form
  const closeAndReset = () => {
    setFormData({ title: "", description: "", category: "general" });
    setFileImages([]);
    setLinkImages([]);
    setErrors({});
    onClose();
  };

  if (!isVisible) return null;
  
  const displayLat = actualSelectedPosition?.lat ?? actualSelectedPosition?.latitude;
  const displayLng = actualSelectedPosition?.lng ?? actualSelectedPosition?.longitude;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30, rotateX: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 30, rotateX: 15 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 300,
          duration: 0.4 
        }}
        className="fixed bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm w-[320px] z-[10001]"
        style={{
          top: adjustedPosition.top,
          left: adjustedPosition.left,
        }}
      >
          {/* Pointer/Arrow that points to the clicked location */}
          {position && (
            <div 
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-[1001]"
              style={{ 
                width: 0, 
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '14px solid #e5e7eb', 
                borderBottom: 'none',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            >
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: '2px', 
                  left: '-12px',
                  width: 0, 
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '12px solid white', 
                  borderBottom: 'none'
                }}
              />
            </div>
          )}
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Create New Post</h2>
                  <p className="text-emerald-100 text-sm">Share your discovery with the community</p>
                </div>
              </div>
              <button
                onClick={closeAndReset}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 max-h-[65vh] overflow-y-auto">
            {/* Title Field */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all ${
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white shadow-sm`}
                  placeholder="Enter a descriptive title"
                  maxLength="100"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.title && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.title.length > 90
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {formData.title.length}/100
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white shadow-sm`}
                  placeholder="Describe this location and what makes it special..."
                  maxLength="500"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.description.length > 450
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Location Field - This is pre-filled and fixed based on user's map click */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={
                    actualSelectedPosition && (typeof displayLat === 'number') && (typeof displayLng === 'number')
                      ? `Lat: ${displayLat.toFixed(6)}, Lng: ${displayLng.toFixed(6)}`
                      : "Location not selected"
                  }
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 shadow-sm"
                  placeholder="Location set from map click"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This location is fixed based on where you clicked on the map
              </p>
            </div>

            {/* Category Field */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all bg-gray-50 focus:bg-white appearance-none shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Images * (Up to 10)
              </label>

              {/* Tabs for upload vs link */}
              <div className="flex border-b border-gray-200 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'upload'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-500 hover:text-gray-700'
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
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>From Link</span>
                  </div>
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div>
                  {/* Upload area */}
                  <div
                    className={`border border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                      dragActive
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => (fileImages.length + linkImages.length) < 10 && fileInputRef.current?.click()}
                  >
                    <div className="p-4 text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-emerald-800 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-emerald-600">JPG, PNG, GIF up to 5MB each</p>
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={linkInputRef}
                      type="text"
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
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
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              {errors.images && (
                <p className="mt-2 text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.images}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{(fileImages.length + linkImages.length)}/10</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
                className="mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Your Images ({fileImages.length + linkImages.length})
                  </h3>
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[...fileImages, ...linkImages].map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-sm group"
                    >
                      <div className="w-full h-full bg-gray-200 relative">
                        {image.preview ? (
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <img
                              src={image.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="fallback absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                              <Globe className="w-4 h-4 mr-1" />
                              {image.name}
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all shadow-lg z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeAndReset}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md relative"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Post</span>
                  </div>
                )}
              </button>
            </div>

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-red-700 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </motion.div>
            )}
          </form>
        </motion.div>
      </AnimatePresence>
  );
};

export default ModernMapIntegratedCreatePostWindow;