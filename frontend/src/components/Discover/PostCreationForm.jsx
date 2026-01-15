import React, { useCallback, useState, useRef, useEffect } from 'react';
import { X, Plus, MapPin, Hash, FileImage, Link as LinkIcon, Upload, Sparkles, Image as ImageIcon, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PostCreationForm.css';

const PostCreationForm = ({
  creatingPostAt,
  postCreationForm,
  handlePostCreationFormChange,
  handleMapPostCreation,
  setCreatingPostAt,
}) => {
  // Local state for interactions
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Ref for the scrollable container
  const scrollableContainerRef = useRef(null);

  // Manage image preview URLs
  useEffect(() => {
    // Revoke old URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    if (postCreationForm.images && postCreationForm.images.length > 0) {
      const urls = Array.from(postCreationForm.images).map(file => URL.createObjectURL(file));
      setImagePreviewUrls(urls);
    } else {
      setImagePreviewUrls([]);
    }

    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [postCreationForm.images]);

  // Prevent map interaction when scrolling form
  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.stopPropagation();
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  if (!creatingPostAt) return null;

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    handlePostCreationFormChange({ target: { name, value } });
  }, [handlePostCreationFormChange]);

  const addFiles = useCallback((files) => {
    const currentImages = postCreationForm.images || [];
    const currentLinks = postCreationForm.imageLinks || [];
    const totalCount = currentImages.length + currentLinks.length;

    if (totalCount >= 10) {
      handlePostCreationFormChange({
        target: { name: 'error', value: 'Maximum of 10 images reached.' }
      });
      return;
    }

    const availableSlots = 10 - totalCount;
    const filesArray = Array.from(files);
    const filesToAdd = filesArray.slice(0, availableSlots);

    const newImages = [...currentImages, ...filesToAdd];
    handlePostCreationFormChange({ target: { name: 'images', value: newImages } });
  }, [postCreationForm, handlePostCreationFormChange]);

  const handleImageChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleUrlAdd = useCallback(() => {
    if (!urlInput.trim()) return;
    const currentImages = postCreationForm.images || [];
    const currentLinks = postCreationForm.imageLinks || [];
    
    if (currentImages.length + currentLinks.length >= 10) return;

    const newLinks = [...currentLinks, urlInput.trim()];
    handlePostCreationFormChange({ target: { name: 'imageLinks', value: newLinks } });
    setUrlInput('');
  }, [urlInput, postCreationForm, handlePostCreationFormChange]);

  const handleRemoveMedia = useCallback((indexToRemove) => {
    const currentImages = postCreationForm.images || [];
    const currentLinks = postCreationForm.imageLinks || [];
    
    if (indexToRemove < currentImages.length) {
      const newImages = currentImages.filter((_, i) => i !== indexToRemove);
      handlePostCreationFormChange({ target: { name: 'images', value: newImages } });
    } else {
      const linkIndex = indexToRemove - currentImages.length;
      const newLinks = currentLinks.filter((_, i) => i !== linkIndex);
      handlePostCreationFormChange({ target: { name: 'imageLinks', value: newLinks } });
    }
  }, [postCreationForm, handlePostCreationFormChange]);

  const handleCancel = () => {
    // Reset all
    ['title', 'description', 'category', 'images', 'imageLinks', 'error', 'loading'].forEach(name => {
         let value = '';
         if (name === 'images' || name === 'imageLinks') value = [];
         if (name === 'loading') value = false;
         if (name === 'error') value = null;
         if (name === 'category') value = 'general';
         handlePostCreationFormChange({ target: { name, value } });
    });
    setCreatingPostAt(null);
    setUrlInput('');
  };

  const categories = [
    { value: 'general', label: 'General', icon: '🌍' },
    { value: 'nature', label: 'Nature', icon: '🌿' },
    { value: 'culture', label: 'Culture', icon: '🎨' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'food', label: 'Food & Drinks', icon: '🍔' },
    { value: 'event', label: 'Event', icon: '🎉' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
  ];

  const totalMedia = (postCreationForm.images?.length || 0) + (postCreationForm.imageLinks?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col h-full max-h-[90vh] min-h-[500px] font-sans"
    >
      {/* Header */}
      <div className="relative px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white shrink-0">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24" />
        </div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
              <span className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/30">
                <Plus className="w-5 h-5 text-white" />
              </span>
              Create Experience
            </h3>
            <p className="text-gray-400 text-xs font-medium pl-1">Share your discovery with the world</p>
          </div>
          
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/5"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollableContainerRef}
        className="flex-grow overflow-y-auto custom-scrollbar"
        onTouchMove={(e) => e.stopPropagation()}
        onMouseOver={(e) => e.currentTarget.focus()}
      >
        <form onSubmit={handleMapPostCreation} className="p-6 space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2 group">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className={`p-1.5 rounded-md transition-colors ${activeField === 'title' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                <Hash className="w-4 h-4" />
              </span>
              Title
            </label>
            <input
              type="text"
              name="title"
              value={postCreationForm.title || ''}
              onChange={handleChange}
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 font-medium placeholder:text-gray-400"
              placeholder="Give your discovery a catchy name..."
              required
            />
          </div>

          {/* Location/Description */}
          <div className="space-y-2 group">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className={`p-1.5 rounded-md transition-colors ${activeField === 'desc' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                <MapPin className="w-4 h-4" />
              </span>
              Description
            </label>
            <textarea
              name="description"
              value={postCreationForm.description || ''}
              onChange={handleChange}
              onFocus={() => setActiveField('desc')}
              onBlur={() => setActiveField(null)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 min-h-[100px] resize-none font-medium placeholder:text-gray-400 leading-relaxed"
              placeholder="What makes this place special? Share the vibe, tips, or what to look for..."
              required
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="p-1.5 bg-gray-100 text-gray-500 rounded-md">
                <Sparkles className="w-4 h-4" />
              </span>
              Category
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handlePostCreationFormChange({ target: { name: 'category', value: cat.value } })}
                  className={`p-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 h-20 ${
                    postCreationForm.category === cat.value
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm'
                      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Pro */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-gray-100 text-gray-500 rounded-md">
                  <ImageIcon className="w-4 h-4" />
                </span>
                Gallery
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${totalMedia >= 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {totalMedia}/10
              </span>
            </label>

            <div 
              className={`relative border-3 border-dashed rounded-2xl p-6 transition-all duration-300 ease-out group ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
                  : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              
              {!totalMedia && !dragActive && (
                <div className="text-center space-y-3 pointer-events-none">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-bold">Drop your best shots here</p>
                    <p className="text-gray-400 text-sm">or click to browse</p>
                  </div>
                </div>
              )}

              {/* Functional Inputs */}
              <input
                type="file"
                id="image-upload-modern"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label 
                htmlFor="image-upload-modern" 
                className="absolute inset-0 cursor-pointer z-10"
              />

              {/* Previews */}
              {totalMedia > 0 && (
                <div className="relative z-20 grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                  <AnimatePresence>
                    {/* File Images */}
                    {Array.from(postCreationForm.images || []).map((file, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        key={`file-${i}`} 
                        className="relative aspect-square rounded-xl overflow-hidden group/img shadow-sm hover:shadow-md transition-shadow"
                      >
                        <img src={imagePreviewUrls[i]} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleRemoveMedia(i); }}
                            className="p-1.5 bg-white/20 hover:bg-red-500/80 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Link Images */}
                    {Array.from(postCreationForm.imageLinks || []).map((link, i) => {
                      const globalIndex = (postCreationForm.images?.length || 0) + i;
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          key={`link-${i}`}
                          className="relative aspect-square rounded-xl overflow-hidden group/img shadow-sm hover:shadow-md transition-shadow"
                        >
                          <img 
                            src={link} 
                            alt="Link Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                          />
                          <div className="absolute top-1 right-1 bg-black/60 rounded-md p-1 backdrop-blur-sm">
                            <LinkIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleRemoveMedia(globalIndex); }}
                              className="p-1.5 bg-white/20 hover:bg-red-500/80 text-white rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {/* Add More Button (Small) */}
                  {totalMedia < 10 && totalMedia > 0 && (
                    <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors pointer-events-none">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* URL Input Bar */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <LinkIcon className="w-4 h-4 text-gray-400 ml-2" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                placeholder="Or paste an image link..."
                className="flex-grow bg-transparent border-none text-sm focus:ring-0 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
                className="px-3 py-1.5 bg-white text-emerald-600 text-xs font-bold rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {postCreationForm.error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {postCreationForm.error}
            </motion.div>
          )}

        </form>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shrink-0 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={postCreationForm.loading}
          onClick={handleMapPostCreation}
          className="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:to-teal-400 transition-all disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {postCreationForm.loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Planting Pin...</span>
            </>
          ) : (
            <>
              <span>Share Location</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default React.memo(PostCreationForm);