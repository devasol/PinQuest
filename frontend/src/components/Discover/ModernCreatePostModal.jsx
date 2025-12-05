import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Image as ImageIcon, Plus, Upload, Link, Trash2, Check, AlertCircle, Navigation, Camera, Gallery, Cloud, Globe, Lock } from 'lucide-react';
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

const ModernCreatePostModal = ({ 
  isVisible, 
  onClose, 
  onCreatePost, 
  selectedPosition, 
  initialPosition,
  position,
  loading = false
}) => {
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
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);
  const [progress, setProgress] = useState(0);

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
    
    setIsSubmitting(true);
    setProgress(0);
    
    try {
      const lat = actualSelectedPosition.lat || actualSelectedPosition.latitude;
      const lng = actualSelectedPosition.lng || actualSelectedPosition.longitude;
      
      if (!lat || !lng) {
        setErrors({ submit: "Location coordinates are invalid. Please select a location on the map." });
        return;
      }
      
      const hasFileImages = fileImages.length > 0;
      const hasLinkImages = linkImages.length > 0;
      
      if (!hasFileImages && !hasLinkImages) {
        setErrors({ submit: "At least one image is required" });
        return;
      }
      
      if (hasFileImages) {
        const formDataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });
        
        if (lat !== undefined && lng !== undefined) {
          formDataToSend.append('location[latitude]', lat.toString());
          formDataToSend.append('location[longitude]', lng.toString());
        }
        
        fileImages.forEach(img => {
          if (img.file) {
            formDataToSend.append('images', img.file, img.name);
          }
        });
        
        if (hasLinkImages) {
          linkImages.forEach(img => {
            if (img.url) {
              formDataToSend.append('imageLinks', img.url);
            }
          });
        }
        
        // Simulate progress for better UX
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        
        await onCreatePost(formDataToSend);
        clearInterval(interval);
        
      } else {
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
      setProgress(0);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error creating post:", error);
      if (!error.message.includes('unmounted') && !error.message.includes('unmount')) {
        setErrors({ submit: error.message || "An error occurred while creating the post" });
      }
      setProgress(0);
      throw error;
    } finally {
      setIsSubmitting(false);
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
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
        
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
            file: compressedFile,
            preview: reader.result,
            name: file.name,
          };
          setFileImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(compressedFile);
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
    
    if (positionPropRef.current !== position) {
      calculatedPositionRef.current = null;
      positionPropRef.current = position;
    }
    
    if (calculatedPositionRef.current) {
      return calculatedPositionRef.current;
    }
    
    const clickTop = position.y;
    const clickLeft = position.x;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const modalWidth = 320;
    const modalHeight = 550;
    
    let adjustedTop = Math.max(20, clickTop - modalHeight - 20);
    let adjustedLeft = Math.max(20, clickLeft - (modalWidth / 2));
    
    if (adjustedLeft + modalWidth > viewportWidth - 20) {
      adjustedLeft = Math.max(20, Math.min(clickLeft - (modalWidth / 2), viewportWidth - modalWidth - 20));
    }
    
    if (adjustedLeft < 20) {
      adjustedLeft = 20;
    }
    
    if (adjustedTop >= clickTop - 10 && adjustedTop <= clickTop + 10) {
      adjustedTop = Math.max(20, clickTop - 140);
    }
    
    const calculatedPos = { 
      top: `${adjustedTop}px`,
      left: `${adjustedLeft}px`
    };
    calculatedPositionRef.current = calculatedPos;
    return calculatedPos;
  }, [position]);
  
  const adjustedPosition = calculateAdjustedPosition();

  // Close modal and reset form
  const closeAndReset = () => {
    setFormData({ title: "", description: "", category: "general" });
    setFileImages([]);
    setLinkImages([]);
    setErrors({});
    setProgress(0);
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
        className="fixed bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-[320px] z-[10001] create-post-modal-container"
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
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create New Post</h2>
                <p className="text-slate-300 text-sm">Share your discovery with the community</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeAndReset();
              }}
              className="p-1.5 rounded-full hover:bg-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-200" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 max-h-[65vh] overflow-y-auto">
          {/* Title Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${
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
                  <AlertCircle className="w-3 h-3" />
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
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none ${
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
                  <AlertCircle className="w-3 h-3" />
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

          {/* Location Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-200"
                placeholder="Location set from map click"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              This location is fixed based on where you clicked on the map
            </p>
          </div>

          {/* Category Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
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
                className="w-full pl-10 pr-10 py-3 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-slate-700/50 focus:bg-slate-700 text-white appearance-none"
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
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={linkInputRef}
                    type="text"
                    placeholder="Paste image URL here..."
                    className="flex-1 px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 min-w-0 bg-slate-700/50 text-white placeholder:text-slate-400"
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
                    className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {errors.images && (
              <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
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
              className="mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-300">
                  Your Images ({fileImages.length + linkImages.length})
                </h3>
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
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
                            <Globe className="w-4 h-4 mr-1" />
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
          <div className="flex gap-2 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeAndReset();
              }}
              className="flex-1 px-4 py-3 border border-slate-600 text-slate-200 bg-slate-700 rounded-xl hover:bg-slate-600 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {isSubmitting ? (
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

          {isSubmitting && progress > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-xl"
            >
              <p className="text-red-300 text-sm flex items-center gap-1">
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

export default ModernCreatePostModal;