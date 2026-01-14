import React, { useCallback, useMemo } from 'react';
import { X, Plus, MapPin, Hash, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';
import './PostCreationForm.css';

const PostCreationForm = ({
  creatingPostAt,
  postCreationForm,
  handlePostCreationFormChange,
  handleMapPostCreation,
  setCreatingPostAt,
}) => {

  // Effect to manage image preview URLs and cleanup
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState([]);

  React.useEffect(() => {
    // Clean up previous URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    // Create new preview URLs when images change
    if (postCreationForm.images && postCreationForm.images.length > 0) {
      const urls = Array.from(postCreationForm.images).map(file => URL.createObjectURL(file));
      setImagePreviewUrls(urls);
    } else {
      setImagePreviewUrls([]);
    }

    // Cleanup function for when component unmounts or effect runs again
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [postCreationForm.images]); // Only run when images change

  // Ref for the scrollable container
  const scrollableContainerRef = React.useRef(null);

  // Handle wheel events to prevent map zoom when scrolling content
  React.useEffect(() => {
    const container = scrollableContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Always prevent the wheel event from propagating to the map
      // This stops the map from zooming/panning when scrolling in the form
      e.preventDefault();
      e.stopPropagation();

      // Manually handle the scrolling within the container
      container.scrollTop += e.deltaY;
    };

    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  if (!creatingPostAt) {
    return null;
  }

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    handlePostCreationFormChange({
      target: {
        name,
        value
      }
    });
  }, [handlePostCreationFormChange]);

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);

    // Limit to 10 images maximum
    const currentImages = postCreationForm.images || [];

    // If already at max, show error
    if (currentImages.length >= 10) {
      handlePostCreationFormChange({
        target: {
          name: 'error',
          value: 'Maximum of 10 images reached. Remove some images to add new ones.'
        }
      });
      return;
    }

    // Calculate how many more images we can add
    const availableSlots = 10 - currentImages.length;
    const filesToAdd = files.slice(0, availableSlots); // Take only as many as we can

    if (files.length > availableSlots) {
      // Show warning about limited files added
      handlePostCreationFormChange({
        target: {
          name: 'error',
          value: `Only ${availableSlots} more image(s) can be added (maximum 10).`
        }
      });
    }

    // Combine existing images with new ones
    const allImages = [...currentImages, ...filesToAdd];

    // Update the form state using the parent's handler
    handlePostCreationFormChange({
      target: {
        name: 'images',
        value: allImages
      }
    });
  }, [handlePostCreationFormChange, postCreationForm.images]);

  const handleRemoveImage = useCallback((indexToRemove) => {
    const currentImages = postCreationForm.images || [];
    const newImages = currentImages.filter((_, index) => index !== indexToRemove);

    // Update the form state using the parent's handler
    handlePostCreationFormChange({
      target: {
        name: 'images',
        value: newImages
      }
    });
  }, [handlePostCreationFormChange, postCreationForm.images]);

  const handleSubmit = (e) => {
    handleMapPostCreation(e);
  };

  const handleCancel = () => {
    // Clear form values when closing
    handlePostCreationFormChange({
      target: {
        name: 'title',
        value: ''
      }
    });
    handlePostCreationFormChange({
      target: {
        name: 'description',
        value: ''
      }
    });
    handlePostCreationFormChange({
      target: {
        name: 'category',
        value: 'general'
      }
    });
    handlePostCreationFormChange({
      target: {
        name: 'images',
        value: []
      }
    });
    handlePostCreationFormChange({
      target: {
        name: 'error',
        value: null
      }
    });
    handlePostCreationFormChange({
      target: {
        name: 'loading',
        value: false
      }
    });

    // Close the form
    setCreatingPostAt(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full bg-white rounded-lg xs:rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-full max-h-[95vh] sm:max-h-[85vh] min-h-[400px]"
    >
      <div className="p-2 xs:p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex-shrink-0 amazing-post-form">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm xs:text-base flex items-center gap-1 xs:gap-2">
            <Plus className="w-3 h-3 xs:w-4 xs:h-4" />
            <span className="text-xs xs:text-sm sm:text-base">Create New Post</span>
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-3 h-3 xs:w-4 xs:h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollableContainerRef}
        className="overflow-y-auto flex-grow max-h-[calc(95vh-50px)] sm:max-h-[calc(85vh-50px)] min-h-[300px] amazing-post-form"
        onTouchMove={(e) => {
          // Prevent touch move events from affecting the map
          e.stopPropagation();
        }}
        onMouseOver={(e) => {
          // Prevent map zoom when mouse is over the form
          e.currentTarget.focus();
        }}
      >
        <form onSubmit={handleSubmit} className="p-2 xs:p-3 space-y-3 xs:space-y-4 flex-grow amazing-post-form">
          <div className="space-y-1 xs:space-y-2">
            <label className="block text-sm xs:text-base font-semibold text-gray-700 flex items-center gap-1 xs:gap-2 amazing-post-form">
              <Hash className="w-2 h-2 xs:w-3 xs:h-3 text-emerald-600" />
              <span className="text-sm xs:text-base">Title *</span>
            </label>
            <input
              type="text"
              name="title"
              value={postCreationForm.title || ''}
              onChange={handleChange}
              className="w-full px-2 py-1.5 xs:px-3 xs:py-2 border border-gray-300 rounded-md xs:rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm xs:text-base transition-all shadow-sm focus:shadow-md amazing-post-form"
              placeholder="Enter an engaging title"
              required
            />
          </div>

          <div className="space-y-1 xs:space-y-2">
            <label className="block text-sm xs:text-base font-semibold text-gray-700 flex items-center gap-1 xs:gap-2 amazing-post-form">
              <MapPin className="w-2 h-2 xs:w-3 xs:h-3 text-emerald-600" />
              <span className="text-sm xs:text-base">Description *</span>
            </label>
            <textarea
              name="description"
              value={postCreationForm.description || ''}
              onChange={handleChange}
              className="w-full px-2 py-1.5 xs:px-3 xs:py-2 border border-gray-300 rounded-md xs:rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm xs:text-base transition-all shadow-sm focus:shadow-md resize-vertical min-h-[60px] xs:min-h-[80px] amazing-post-form"
              placeholder="Describe this location..."
              rows="1 xs:2"
              required
            />
          </div>

          <div className="space-y-1 xs:space-y-2">
            <label className="block text-sm xs:text-base font-semibold text-gray-700 flex items-center gap-1 xs:gap-2 amazing-post-form">
              <Hash className="w-2 h-2 xs:w-3 xs:h-3 text-emerald-600" />
              <span className="text-sm xs:text-base">Category</span>
            </label>
            <select
              name="category"
              value={postCreationForm.category || 'general'}
              onChange={handleChange}
              className="w-full px-2 py-1.5 xs:px-3 xs:py-2 border border-gray-300 rounded-md xs:rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm xs:text-base transition-all shadow-sm focus:shadow-md amazing-post-form"
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

          {/* Image Upload Section */}
          <div className="space-y-1 xs:space-y-2">
            <label className="block text-sm xs:text-base font-semibold text-gray-700 flex items-center gap-1 xs:gap-2 amazing-post-form">
              <FileImage className="w-2 h-2 xs:w-3 xs:h-3 text-emerald-600" />
              <span className="text-sm xs:text-base">Images</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md xs:rounded-lg p-2 xs:p-3 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-1 xs:mb-2">
                  <Plus className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-600" />
                </div>
                <span className="text-[0.6rem] xs:text-xs text-gray-700 font-medium">Upload images</span>
                <span className="text-[0.5rem] xs:text-[0.6rem] text-gray-500 mt-1">JPG, PNG, GIF</span>
              </label>

              {/* Image Preview Section */}
              {postCreationForm.images && postCreationForm.images.length > 0 && (
                <div className="mt-2 xs:mt-3 space-y-1 xs:space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-1 xs:gap-2">
                    <div className="text-[0.5rem] xs:text-[0.6rem] text-emerald-700 font-medium bg-emerald-50 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full">
                      {postCreationForm.images.length}/10
                    </div>
                    {postCreationForm.images.length < 10 && (
                      <div className="text-[0.5rem] xs:text-[0.6rem] text-gray-500">
                        +{10 - postCreationForm.images.length}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-0.5 xs:gap-1">
                    {Array.from(postCreationForm.images).map((file, index) => {
                      return (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={imagePreviewUrls[index]}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover rounded-md border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="text-white text-[0.6rem] xs:text-[0.7rem] bg-red-500 rounded-full w-3 h-3 xs:w-4 xs:h-4 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {postCreationForm.error && (
            <div className="p-1.5 xs:p-2 bg-red-100 text-red-700 rounded-md xs:rounded-lg text-sm xs:text-base border border-red-200 amazing-post-form">
              <div className="font-semibold text-red-800 mb-0.5 xs:mb-1">Error</div>
              <div className="text-sm xs:text-base">{postCreationForm.error}</div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 xs:gap-2 pt-1 xs:pt-2 pb-2">
            <motion.button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-2 py-1.5 xs:px-3 xs:py-2 border border-gray-300 text-gray-700 rounded-md xs:rounded-lg hover:bg-gray-50 text-sm xs:text-base font-medium transition-all shadow-sm amazing-post-form"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={postCreationForm.loading}
              className="flex-1 px-2 py-1.5 xs:px-3 xs:py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-md xs:rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70 flex items-center justify-center gap-1 xs:gap-2 text-sm xs:text-base font-semibold transition-all shadow-lg amazing-post-form"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {postCreationForm.loading ? (
                <>
                  <div className="animate-spin rounded-full h-2 w-2 xs:h-3 xs:w-3 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Post</span>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default React.memo(PostCreationForm);