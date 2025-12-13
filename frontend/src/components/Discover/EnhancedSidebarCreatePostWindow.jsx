import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Image as ImageIcon, 
  Upload, 
  Link, 
  Trash2, 
  Plus, 
  Check, 
  AlertCircle, 
  Globe, 
  Hash, 
  Send,
  Save
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

const categories = [
  { value: "general", label: "General", color: "bg-gray-500" },
  { value: "food", label: "Food & Dining", color: "bg-orange-500" },
  { value: "nature", label: "Nature & Outdoors", color: "bg-green-500" },
  { value: "entertainment", label: "Entertainment", color: "bg-purple-500" },
  { value: "shopping", label: "Shopping", color: "bg-pink-500" },
  { value: "lodging", label: "Lodging", color: "bg-blue-500" },
  { value: "landmark", label: "Landmark", color: "bg-yellow-500" },
  { value: "other", label: "Other", color: "bg-indigo-500" }
];

const getResponsiveWidth = () => {
  if (window.innerWidth >= 1280) return '650px';
  if (window.innerWidth >= 1024) return '600px';
  if (window.innerWidth >= 768) return '560px';
  if (window.innerWidth >= 640) return '520px';
  if (window.innerWidth >= 480) return '480px';
  return '420px';
};

const EnhancedSidebarCreatePostWindow = ({ 
  isVisible, 
  onClose, 
  onCreatePost, 
  selectedPosition, 
  initialPosition,
  loading = false,
  isSidebarExpanded = false,
  mapRef
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
  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    description: 0
  });
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [sidebarWidth, setSidebarWidth] = useState(getResponsiveWidth());

  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth(getResponsiveWidth());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Prevent map zoom when scrolling in the sidebar window
    let handleWheel;
    
    if (isVisible) {
      // Prevent scroll wheel from affecting the map when scrolling in sidebar window
      handleWheel = (e) => {
        e.preventDefault(); // Prevent the default scroll behavior that might affect the map
      };
      
      document.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (handleWheel) {
        document.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isVisible]);

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
    
    setUploadStatus('uploading');
    setProgress(0);
    
    try {
      const lat = actualSelectedPosition.lat || actualSelectedPosition.latitude;
      const lng = actualSelectedPosition.lng || actualSelectedPosition.longitude;
      
      if (!lat || !lng) {
        setErrors({ submit: "Location coordinates are invalid. Please select a location on the map." });
        return;
      }
      
      // Track total items to upload
      const totalItems = fileImages.length + linkImages.length;
      let completedItems = 0;
      
      // Update progress based on completed items
      const updateProgress = () => {
        completedItems++;
        const newProgress = Math.round((completedItems / totalItems) * 90); // Max out at 90%
        setProgress(newProgress);
      };
      
      if (fileImages.length > 0) {
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
        
        if (linkImages.length > 0) {
          linkImages.forEach(img => {
            if (img.url) {
              formDataToSend.append('imageLinks', img.url);
            }
          });
        }
        
        await onCreatePost(formDataToSend);
      } else {
        const postPayload = {
          ...formData,
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
          imageLinks: linkImages.map(img => img.url)
        };
        
        await onCreatePost(postPayload);
      }
      
      setUploadStatus('success');
      setProgress(100);
      
      // Reset form on successful post creation
      setTimeout(() => {
        setFormData({ title: "", description: "", category: "general" });
        setFileImages([]);
        setLinkImages([]);
        setErrors({});
        setCharacterCounts({ title: 0, description: 0 });
        setProgress(0);
        
        if (onClose) {
          onClose();
        }
      }, 1000);
    } catch (error) {
      console.error("Error creating post:", error);
      setUploadStatus('error');
      setProgress(0);
      setErrors({ submit: error.message || "An error occurred while creating the post" });
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

    // Update character count
    setCharacterCounts(prev => ({
      ...prev,
      [name]: value.length
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
    const maxImages = 10;
    const filesToAdd = files.slice(0, maxImages - fileImages.length - linkImages.length);
    
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
            size: compressedFile.size,
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

  // Close modal and reset form
  const closeAndReset = () => {
    setFormData({ title: "", description: "", category: "general" });
    setFileImages([]);
    setLinkImages([]);
    setErrors({});
    setCharacterCounts({ title: 0, description: 0 });
    setProgress(0);
    setUploadStatus('idle');
    onClose();
  };

  const displayLat = actualSelectedPosition?.lat ?? actualSelectedPosition?.latitude;
  const displayLng = actualSelectedPosition?.lng ?? actualSelectedPosition?.longitude;
  const totalImages = fileImages.length + linkImages.length;

  // Effect to control map scroll wheel zoom when create post sidebar is open
  useEffect(() => {
    if (mapRef?.current) {
      if (isVisible) {
        mapRef.current.scrollWheelZoom.disable();
      } else {
        mapRef.current.scrollWheelZoom.enable();
      }
    }
    
    // Cleanup function to re-enable scroll wheel when component unmounts
    return () => {
      if (mapRef?.current) {
        mapRef.current.scrollWheelZoom.enable();
      }
    };
  }, [isVisible, mapRef]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed top-0 bottom-0 z-[100000] sidebar-window h-full bg-white shadow-2xl border-l border-gray-200"
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
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 id="create-post-window-title" className="font-bold text-lg text-white">Create New Post</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeAndReset}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
        
        {/* Scrollable Content Area - only this has scrollbar */}
        <div className="h-[calc(100%-80px)] flex flex-col overflow-y-auto">
          <form 
            onSubmit={handleSubmit} 
            className="flex-1 flex flex-col"
            onWheel={(e) => {
              // Prevent scroll events from affecting the map
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Prevent mouse events from affecting the map
              e.stopPropagation();
            }}
          >
            <div className="flex-1 p-6 space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-500" />
                Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all ${
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500`}
                  placeholder="Enter a descriptive title"
                  maxLength="100"
                />
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                {errors.title && (
                  <p className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.title}
                  </p>
                )}
                <p
                  className={`ml-auto ${
                    characterCounts.title > 90
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {characterCounts.title}/100
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-500" />
                Description *
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500`}
                  placeholder="Describe this location and what makes it special..."
                  maxLength="500"
                />
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                {errors.description && (
                  <p className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description}
                  </p>
                )}
                <p
                  className={`ml-auto ${
                    characterCounts.description > 450
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {characterCounts.description}/500
                </p>
              </div>
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    actualSelectedPosition && (typeof displayLat === 'number') && (typeof displayLng === 'number')
                      ? `Lat: ${displayLat.toFixed(6)}, Lng: ${displayLng.toFixed(6)}`
                      : "Location not selected"
                  }
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  placeholder="Location set from map click"
                />
              </div>
              <p className="text-xs text-gray-500">
                This location is fixed based on where you clicked on the map
              </p>
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-500" />
                Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.category === cat.value
                        ? `${cat.color} text-white border-white shadow-md`
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-medium">{cat.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  Images * (Up to 10)
                </label>
                <span className="text-xs text-gray-500">{totalImages}/10</span>
              </div>

              {/* Tabs for upload vs link */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'upload'
                      ? 'text-emerald-600 border-b-2 border-emerald-500'
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
                      ? 'text-emerald-600 border-b-2 border-emerald-500'
                      : 'text-gray-500 hover:text-gray-700'
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
                    className={`border border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-300 hover:border-emerald-500 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => totalImages < 10 && fileInputRef.current?.click()}
                  >
                    <div className="p-6 text-center">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-emerald-600 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB each</p>
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
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 bg-gray-50 text-gray-900 placeholder:text-gray-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && linkInputRef.current) {
                          e.preventDefault();
                          handleImageLinkAdd(linkInputRef.current.value);
                          linkInputRef.current.value = '';
                        }
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (linkInputRef.current) {
                          handleImageLinkAdd(linkInputRef.current.value);
                          linkInputRef.current.value = '';
                          linkInputRef.current.focus();
                        }
                      }}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {errors.images && (
                <p className="mt-2 text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.images}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Upload Progress</span>
                  <span>{Math.round(((fileImages.length + linkImages.length) / 10) * 100)}%</span>
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
            {totalImages > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    Your Images ({totalImages})
                  </h3>
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
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
                      className="relative aspect-square rounded-xl overflow-hidden shadow-sm group"
                    >
                      <div className="w-full h-full bg-gray-100 relative">
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
                              <Globe className="w-5 h-5 mr-1" />
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
                      
                      <motion.button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 bg-white px-6 pb-6 -mx-6">
              <motion.button
                type="button"
                onClick={closeAndReset}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || uploadStatus === 'uploading'}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploadStatus === 'uploading' ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Create Post</span>
                  </div>
                )}
              </motion.button>
            </div>

            {uploadStatus === 'uploading' && progress > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3"
              >
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {uploadStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-green-100 border border-green-200 rounded-xl"
              >
                <p className="text-green-700 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Post created successfully!
                </p>
              </motion.div>
            )}

            {errors.submit && uploadStatus !== 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-100 border border-red-200 rounded-xl"
              >
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </motion.div>
            )}
            </div> {/* Close the flex-1 p-6 space-y-6 div */}
            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 bg-white px-6 pb-6 mt-auto">
              <motion.button
                type="button"
                onClick={closeAndReset}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || uploadStatus === 'uploading'}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploadStatus === 'uploading' ? (
                  <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Create Post</span>
                </div>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedSidebarCreatePostWindow;