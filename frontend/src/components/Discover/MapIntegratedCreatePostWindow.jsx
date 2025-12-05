import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Image as ImageIcon,
  Plus,
  Upload,
  Camera,
  Link,
  Trash2,
  Check,
  AlertCircle,
  Navigation,
} from "lucide-react";
import imageCompression from "browser-image-compression";

const categories = [
  { value: "general", label: "General" },
  { value: "food", label: "Food & Dining" },
  { value: "nature", label: "Nature & Outdoors" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "lodging", label: "Lodging" },
  { value: "landmark", label: "Landmark" },
  { value: "other", label: "Other" },
];

const MapIntegratedCreatePostWindow = ({
  isVisible,
  onClose,
  onCreatePost,
  selectedPosition,
  initialPosition, // For backward compatibility
  position,
  loading = false,
}) => {
  // Use selectedPosition if available, otherwise fall back to initialPosition
  const actualSelectedPosition = selectedPosition || initialPosition;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });

  const [errors, setErrors] = useState({});
  const [fileImages, setFileImages] = useState([]);
  const [linkImages, setLinkImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
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

    // Location is automatically set from the map click, no need to validate here
    // since the modal only opens when a location has been selected

    if (fileImages.length + linkImages.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (fileImages.length + linkImages.length > 10) {
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

    if (
      !actualSelectedPosition ||
      (!actualSelectedPosition.lat && !actualSelectedPosition.latitude) ||
      (!actualSelectedPosition.lng && !actualSelectedPosition.longitude)
    ) {
      setErrors({
        submit: "Location is required. Please select a location on the map.",
      });
      return;
    }

    try {
      // Handle different possible location property names
      const lat = actualSelectedPosition.lat || actualSelectedPosition.latitude;
      const lng =
        actualSelectedPosition.lng || actualSelectedPosition.longitude;

      if (!lat || !lng) {
        setErrors({
          submit:
            "Location coordinates are invalid. Please select a location on the map.",
        });
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
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });

        // Add location data
        if (lat !== undefined && lng !== undefined) {
          formDataToSend.append("location[latitude]", lat.toString());
          formDataToSend.append("location[longitude]", lng.toString());
        }

        // Add image files
        fileImages.forEach((img) => {
          if (img.file) {
            formDataToSend.append("images", img.file, img.name);
          }
        });

        // Add image links if any
        if (hasLinkImages) {
          linkImages.forEach((img) => {
            if (img.url) {
              formDataToSend.append("imageLinks", img.url);
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
          postPayload.imageLinks = linkImages.map((img) => img.url);
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
      if (
        !error.message.includes("unmounted") &&
        !error.message.includes("unmount")
      ) {
        setErrors({
          submit: error.message || "An error occurred while creating the post",
        });
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

  const addImagesFromFiles = useCallback(
    async (files) => {
      const filesToAdd = files.slice(
        0,
        10 - fileImages.length - linkImages.length
      );

      if (filesToAdd.length === 0) {
        setErrors((prev) => ({
          ...prev,
          images: "You can only upload up to 10 images total",
        }));
        return;
      }

      const compressionOptions = {
        maxSizeMB: 1, // (default is Number.POSITIVE_INFINITY)
        maxWidthOrHeight: 1920, // (default is undefined)
        useWebWorker: true, // (default is false)
        initialQuality: 0.8, // (default is 1) Initial compression quality
      };

      for (const file of filesToAdd) {
        // Changed forEach to for...of to use await properly
        if (!file.type.startsWith("image/")) {
          setErrors((prev) => ({
            ...prev,
            images: "Please select valid image files",
          }));
          return; // Stop processing further files if one is invalid
        }

        // Check original file size first (if it's too large, don't even attempt compression)
        if (file.size > 15 * 1024 * 1024) {
          // Allow up to 15MB original size
          setErrors((prev) => ({
            ...prev,
            images: `File size for ${file.name} must be less than 15MB (original)`,
          }));
          return; // Stop processing further files if one is too large
        }

        try {
          // Compress the image
          const compressedFile = await imageCompression(
            file,
            compressionOptions
          );
          console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
          console.log(
            `Compressed file size: ${compressedFile.size / 1024 / 1024} MB`
          );

          // After compression, check if the compressed file size is within limits
          if (compressedFile.size > 2 * 1024 * 1024) {
            // Compressed file should not exceed 2MB
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
    },
    [fileImages, linkImages, errors]
  ); // Dependencies for useCallback

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
        images: "Please enter an image URL",
      }));
      return;
    }

    if (!isValidUrl(url)) {
      setErrors((prev) => ({
        ...prev,
        images: "Please enter a valid image URL",
      }));
      return;
    }

    if (fileImages.length + linkImages.length >= 10) {
      setErrors((prev) => ({
        ...prev,
        images: "You can only upload up to 10 images total",
      }));
      return;
    }

    const newImageLink = {
      id: Date.now() + Math.random(),
      url: url,
      name: `Image from Link`,
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
      // Changed back to _
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
  // NOTE: These hooks must be defined before any conditional returns to maintain hook order
  const calculatedPositionRef = React.useRef(null);
  const positionPropRef = React.useRef(null);

  const calculateAdjustedPosition = React.useCallback(() => {
    if (!position) return { top: "20px", left: "20px" };

    // Check if the position prop has changed. If so, we need to recalculate.
    // However, to prevent movement during map interactions, we only recalculate
    // if the change is significant, which suggests a new click rather than a pan/zoom.
    const DAMPING_FACTOR = 10; // Only recalculate if the click moves by more than 10 pixels
    if (
      positionPropRef.current &&
      Math.abs(positionPropRef.current.x - position.x) < DAMPING_FACTOR &&
      Math.abs(positionPropRef.current.y - position.y) < DAMPING_FACTOR
    ) {
      // If movement is minor, do nothing and keep the current calculated position
    } else {
      // If movement is significant or it's the first render, recalculate
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
    const modalWidth = 300; // Fixed width
    const modalHeight = 500; // Approximate height

    // Position the modal above the click location
    // First, try to center the modal horizontally above the click
    let adjustedTop = Math.max(20, clickTop - modalHeight - 20); // Position above the click with proper spacing for arrow, minimum 20px from top
    let adjustedLeft = Math.max(20, clickLeft - modalWidth / 2); // Center modal horizontally over the click, minimum 20px from left

    // Ensure modal stays within viewport bounds - adjust for right edge
    if (adjustedLeft + modalWidth > viewportWidth - 20) {
      // If centered position goes off right edge, align with click but adjust to stay in viewport
      adjustedLeft = Math.max(
        20,
        Math.min(clickLeft - modalWidth / 2, viewportWidth - modalWidth - 20)
      );
    }

    // Ensure modal stays within viewport bounds - if too far left after adjustment
    if (adjustedLeft < 20) {
      adjustedLeft = 20;
    }

    // Final safety check to ensure modal doesn't overlap the click point
    if (adjustedTop >= clickTop - 10 && adjustedTop <= clickTop + 10) {
      adjustedTop = Math.max(20, clickTop - 120); // Ensure it's well above the click
    }

    // Store the calculated position to prevent recalculation during interactions
    const calculatedPos = {
      top: `${adjustedTop}px`,
      left: `${adjustedLeft}px`,
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

  const displayLat =
    actualSelectedPosition?.lat ?? actualSelectedPosition?.latitude;
  const displayLng =
    actualSelectedPosition?.lng ?? actualSelectedPosition?.longitude;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-300 max-w-sm w-[300px] z-[10001]"
        style={{
          top: adjustedPosition.top,
          left: adjustedPosition.left,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Pointer/Arrow that points to the clicked location - arrow should always point down from modal to click location */}
        {position && (
          <div
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-[1001]"
            style={{
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "12px solid #9ca3af" /* More distinct gray */,
              borderBottom: "none",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "2px",
                left: "-10px",
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "10px solid white" /* bg-white */,
                borderBottom: "none",
              }}
            />
          </div>
        )}
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white rounded-t-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Plus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate">
                  Create New Post
                </h2>
                <p className="text-emerald-100 text-xs">
                  Share your discovery with the community
                </p>
              </div>
            </div>
            <button
              onClick={closeAndReset}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="p-3 max-h-[60vh] overflow-y-auto"
        >
          {/* Title Field */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Title *
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-1.5 pl-8 border rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 ${
                  errors.title
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-emerald-200 focus:border-emerald-500"
                } bg-gray-50 focus:bg-white shadow-sm text-sm`}
                placeholder="Enter a descriptive title"
                maxLength="100"
              />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              {errors.title && (
                <p className="text-red-500 text-xs flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
              <p
                className={`text-xs ml-auto ${
                  formData.title.length > 90 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {formData.title.length}/100
              </p>
            </div>
          </div>

          {/* Description Field */}
          <div className="mb-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-1.5 pl-8 border rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 resize-none ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-emerald-200 focus:border-emerald-500"
                } bg-gray-50 focus:bg-white shadow-sm text-sm`}
                placeholder="Describe this location and what makes it special..."
                maxLength="500"
              />
              <div className="absolute left-2 top-2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              {errors.description && (
                <p className="text-red-500 text-xs flex items-center gap-0.5">
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
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Location *
            </label>
            <div className="relative">
              <input
                type="text"
                value={
                  actualSelectedPosition &&
                  typeof displayLat === "number" &&
                  typeof displayLng === "number"
                    ? `Lat: ${displayLat.toFixed(6)}, Lng: ${displayLng.toFixed(
                        6
                      )}`
                    : "Location not selected"
                }
                readOnly
                className="w-full px-3 py-1.5 pl-8 border border-emerald-200 rounded-lg bg-gray-100 shadow-sm text-xs"
                placeholder="Location set from map click"
              />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-emerald-400">
                <MapPin className="w-3 h-3" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              This location is fixed based on where you clicked on the map
            </p>
            {errors.location && (
              <p className="mt-0.5 text-red-500 text-xs flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div className="mb-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 pl-8 pr-6 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none shadow-sm text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
              </div>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="mb-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Images * (Up to 10)
            </label>

            {/* Tabs for upload vs link */}
            <div className="flex border-b border-gray-200 mb-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-2 py-1 font-medium text-xs flex-shrink-0 ${
                  activeTab === "upload"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`px-2 py-1 font-medium text-xs flex-shrink-0 ${
                  activeTab === "link"
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <Link className="w-3 h-3" />
                  <span>From Link</span>
                </div>
              </button>
            </div>

            {activeTab === "upload" ? (
              <div>
                {/* Upload area */}
                <div
                  className={`border border-dashed rounded-lg transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() =>
                    fileImages.length + linkImages.length < 10 &&
                    fileInputRef.current?.click()
                  }
                >
                  <div className="p-3 text-center">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Upload className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-medium text-xs mb-0.5">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-[0.6rem] text-emerald-600">
                      JPG, PNG, GIF up to 5MB each
                    </p>
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
                <div className="flex flex-col sm:flex-row gap-1">
                  <input
                    ref={linkInputRef}
                    type="text"
                    placeholder="Paste image URL here..."
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-xs min-w-0"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && linkInputRef.current) {
                        e.preventDefault();
                        handleImageLinkAdd(linkInputRef.current.value);
                        linkInputRef.current.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (linkInputRef.current) {
                        handleImageLinkAdd(linkInputRef.current.value);
                        linkInputRef.current.value = "";
                        linkInputRef.current.focus(); // Return focus to input after adding
                      }
                    }}
                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-0.5 text-xs min-w-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {errors.images && (
              <p className="mt-1.5 text-red-500 text-xs flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                {errors.images}
              </p>
            )}

            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span>Progress</span>
                <span>{fileImages.length + linkImages.length}/10</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((fileImages.length + linkImages.length) / 10) * 100
                    }%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Preview of uploaded images */}
          {fileImages.length + linkImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xs font-semibold text-gray-700">
                  Your Images ({fileImages.length + linkImages.length})
                </h3>
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-red-500 hover:text-red-700 text-xs flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[...fileImages, ...linkImages].map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-square rounded-lg overflow-hidden shadow-sm"
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
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="fallback absolute inset-0 flex items-center justify-center text-gray-500 text-[0.6rem]">
                            <Link className="w-3 h-3 mr-0.5" />
                            {image.name}
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all duration-300"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg z-10"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex gap-1.5 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={closeAndReset}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Creating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </span>
              )}
            </button>
          </div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.submit}
              </p>
            </motion.div>
          )}
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapIntegratedCreatePostWindow;
