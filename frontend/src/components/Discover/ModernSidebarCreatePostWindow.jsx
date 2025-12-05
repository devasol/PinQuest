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

const getResponsiveWidth = () => {
  if (window.innerWidth >= 1280) return '400px';
  if (window.innerWidth >= 1024) return '360px';
  if (window.innerWidth >= 768) return '340px';
  if (window.innerWidth >= 640) return '320px';
  if (window.innerWidth >= 480) return '300px';
  return '280px';
};

const ModernSidebarCreatePostWindow = ({ 
  isVisible, 
  onClose, 
  onCreatePost, 
  selectedPosition, 
  initialPosition, // For backward compatibility
  loading = false,
  isSidebarExpanded = false
}) => {
  // Use selectedPosition if available, otherwise fall back to initialPosition
  const actualSelectedPosition = selectedPosition || initialPosition;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general"
  });
  const formRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(getResponsiveWidth());

  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth(getResponsiveWidth());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent map zoom when scrolling in the sidebar window
  useEffect(() => {
    let handleWheel;
    
    if (isVisible && formRef.current) {
      // Prevent scroll wheel from affecting the map when scrolling in sidebar window
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
  }, [isVisible]);

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
  }, [addImagesFromFiles]);

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
        className="fixed top-0 bottom-0 z-[99999] sidebar-window h-full bg-gray-900 shadow-2xl border-l border-gray-700 sidebar-create-post-window"
        style={{ 
          width: sidebarWidth, 
          left: isSidebarExpanded && window.innerWidth >= 768 ? '16rem' : '5rem' 
        }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 200,
          duration: 0.4 
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-window-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 id="create-post-window-title" className="font-bold text-lg">Create a New Pin</h2>
            <motion.button 
              onClick={closeAndReset}
              aria-label="Close create post window"
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5 text-white" />
            </motion.button>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="sidebar-window-content overflow-y-auto h-[calc(100%-80px)]">
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            
            {/* Title Field */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition-all text-white ${
                    errors.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-300"
                      : "border-gray-700 focus:border-teal-500"
                  } bg-gray-800 focus:bg-gray-700 shadow-sm`}
                  placeholder="e.g. Amazing view from the top"
                  maxLength="100"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                {errors.title && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.title.length > 90
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {formData.title.length}/100
                </p>
              </div>
            </motion.div>

            {/* Description Field */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition-all resize-none text-white ${
                    errors.description
                      ? "border-red-500 focus:border-red-500 focus:ring-red-300"
                      : "border-gray-700 focus:border-teal-500"
                  } bg-gray-800 focus:bg-gray-700 shadow-sm`}
                  placeholder="Share your experience..."
                  maxLength="500"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                {errors.description && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${
                    formData.description.length > 450
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {formData.description.length}/500
                </p>
              </div>
            </motion.div>

            {/* Location Field */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Location *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={
                    actualSelectedPosition && (typeof displayLat === 'number') && (typeof displayLng === 'number')
                      ? `Lat: ${displayLat.toFixed(4)}, Lng: ${displayLng.toFixed(4)}`
                      : "Location not selected"
                  }
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-xl bg-gray-800 shadow-sm text-gray-400"
                  placeholder="Location set from map click"
                />
              </div>
            </motion.div>

            {/* Category Field */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Category *
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-8 py-3 border border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition-all bg-gray-800 text-white appearance-none shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-gray-800 text-white">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Images Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Images * (Up to 10)
              </label>

              {activeTab === 'upload' ? (
                <motion.div
                    className={`border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                      dragActive
                        ? 'border-teal-400 bg-gray-800'
                        : 'border-gray-700 hover:border-teal-500 hover:bg-gray-800'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => (fileImages.length + linkImages.length) < 10 && fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-6 text-center">
                      <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-8 h-8 text-teal-400" />
                      </motion.div>
                      <p className="text-gray-300 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                </motion.div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={linkInputRef}
                      type="text"
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-3 border border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-500 bg-gray-800 text-white"
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
                          linkInputRef.current.focus();
                        }
                      }}
                      className="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                multiple
                className="hidden"
              />

              {errors.images && (
                <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.images}
                </p>
              )}

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{(fileImages.length + linkImages.length)}/10</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((fileImages.length + linkImages.length) / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            {(fileImages.length + linkImages.length) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Your Images
                  </h3>
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-red-400 hover:text-red-500 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear all</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...fileImages, ...linkImages].map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-lg group"
                    >
                      <div className="w-full h-full bg-gray-800 relative">
                        {image.preview ? (
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
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
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <motion.button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-700">
              <motion.button
                type="button"
                onClick={closeAndReset}
                className="flex-1 px-4 py-3 border border-gray-700 text-gray-300 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all font-medium shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Create Pin</span>
                  </div>
                )}
              </motion.button>
            </div>

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-xl"
              >
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {errors.submit}
                </p>
              </motion.div>
            )}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernSidebarCreatePostWindow;