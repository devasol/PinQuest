import React, { useState, useCallback } from 'react';
import { X, Plus, MapPin, Hash, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';

const PostCreationForm = ({
  creatingPostAt,
  onSubmit,
  onCancel,
  initialState,
  isSubmitting,
  submissionError,
}) => {
  const [formState, setFormState] = useState({
    title: initialState?.title || '',
    description: initialState?.description || '',
    category: initialState?.category || 'general',
    images: initialState?.images || [],
  });

  if (!creatingPostAt) {
    return null;
  }

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formState);
  };

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    setFormState(prev => ({ ...prev, images: files }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-80 max-w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Post
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Hash className="w-4 h-4 text-emerald-600" />
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formState.title}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm focus:shadow-md"
            placeholder="Enter an engaging title"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Description *
          </label>
          <textarea
            name="description"
            value={formState.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm focus:shadow-md"
            placeholder="Describe this location and what makes it special..."
            rows="3"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <select
            name="category"
            value={formState.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm focus:shadow-md"
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
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <FileImage className="w-4 h-4 text-emerald-600" />
            Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/30">
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-700 font-medium">Click to upload images</span>
              <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (max 5MB each)</span>
            </label>
            {formState.images && formState.images.length > 0 && (
              <div className="mt-3 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-full inline-block">
                {formState.images.length} image(s) selected
              </div>
            )}
          </div>
        </div>

        {submissionError && (
          <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-xl text-sm border border-red-200">
            <div className="font-semibold text-red-800 mb-1">Error</div>
            <div>{submissionError}</div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              'Create Post'
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default React.memo(PostCreationForm);