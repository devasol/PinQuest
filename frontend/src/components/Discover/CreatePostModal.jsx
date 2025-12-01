import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Image as ImageIcon, Plus, Upload, Camera, Link, Trash2, Check, AlertCircle } from 'lucide-react';

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
  const [fileImages, setFileImages] = useState([]); // For uploaded files
  const [linkImages, setLinkImages] = useState([]); // For image links
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'link'
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

    const postPayload = {
      ...formData,
      location: {
        latitude: parseFloat(selectedPosition.lat),
        longitude: parseFloat(selectedPosition.lng),
      },
      images: fileImages, // Include the uploaded files
      imageLinks: linkImages, // Include image links separately
    };

    try {
      await onCreatePost(postPayload);
    } catch (error) {
      console.error("Error creating post:", error);
      setErrors({ submit: error.message || "An error occurred while creating the post" });
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

  const addImagesFromFiles = (files) => {
    const filesToAdd = files.slice(0, 10 - fileImages.length - linkImages.length);
    
    if (filesToAdd.length === 0) {
      setErrors((prev) => ({
        ...prev,
        images: "You can only upload up to 10 images total",
      }));
      return;
    }

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          images: "Please select valid image files",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          images: "File size must be less than 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          id: Date.now() + Math.random(),
          file: file,
          preview: reader.result,
          name: file.name,
        };
        setFileImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

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
  const handleImageLinkAdd = () => {
    const link = prompt("Enter the image URL:");
    if (link) {
      if (!isValidUrl(link)) {
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
        url: link,
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
    setSelectedPosition(initialPosition);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        onClick={closeAndReset}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Post</h2>
                  <p className="text-emerald-100">Share your discovery with the community</p>
                </div>
              </div>
              <button
                onClick={closeAndReset}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            {/* Title Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 ${
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-emerald-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white shadow-sm`}
                  placeholder="Enter a descriptive title"
                  maxLength="100"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.title && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
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
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-emerald-200 focus:border-emerald-500"
                  } bg-gray-50 focus:bg-white shadow-sm`}
                  placeholder="Describe this location and what makes it special..."
                  maxLength="500"
                />
                <div className="absolute left-4 top-4 text-emerald-400">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
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
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedPosition ? `Lat: ${selectedPosition.lat.toFixed(6)}, Lng: ${selectedPosition.lng.toFixed(6)}` : "Location not selected"}
                  readOnly
                  className="w-full px-4 py-3 pl-12 border-2 border-emerald-200 rounded-xl bg-gray-100 shadow-sm"
                  placeholder="Location set from map click"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This location is fixed based on where you clicked on the map
              </p>
              {errors.location && (
                <p className="mt-1 text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Category Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pl-12 pr-10 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none shadow-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Images * (Up to 10)
              </label>

              {/* Tabs for upload vs link */}
              <div className="flex border-b border-gray-200 mb-4">
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
                    Upload
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
                    <Link className="w-4 h-4" />
                    From Link
                  </div>
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div>
                  {/* Upload area */}
                  <div
                    className={`border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
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
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-emerald-800 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-emerald-600">JPG, PNG, GIF up to 5MB each</p>
                      <p className="text-xs text-emerald-500 mt-1">Max 10 images</p>
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
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Paste image URL here..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleImageLinkAdd}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              )}

              {errors.images && (
                <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.images}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{(fileImages.length + linkImages.length)}/10</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
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
                className="mb-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Your Images ({fileImages.length + linkImages.length})</h3>
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[...fileImages, ...linkImages].map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group aspect-square rounded-lg overflow-hidden shadow-md"
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
                            <div className="fallback absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                              <Link className="w-6 h-6 mr-2" />
                              {image.name}
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeAndReset}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Post
                    </>
                  )}
                </span>
              </button>
            </div>

            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-700 text-sm flex items-center gap-2">
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