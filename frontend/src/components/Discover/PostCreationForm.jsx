import React, { useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';

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
    <div className="w-80 max-w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Create New Post</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formState.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Enter title"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            name="description"
            value={formState.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Describe this location"
            rows="3"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formState.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Plus className="w-6 h-6 text-gray-400 mx-auto" />
                <span className="text-sm text-gray-600 mt-1">Click to upload images</span>
                <span className="text-xs text-gray-500">JPG, PNG, GIF (max 5MB each)</span>
              </div>
            </label>
            {formState.images && formState.images.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {formState.images.length} image(s) selected
              </div>
            )}
          </div>
        </div>
        
        {submissionError && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {submissionError}
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(PostCreationForm);