import React, { useCallback, useState, useRef, useEffect } from 'react';
import { X, Plus, MapPin, Hash, FileImage, Link as LinkIcon, Upload, Sparkles, Image as ImageIcon, Check, ArrowRight, Zap, ShieldCheck, Compass, Trees, Landmark, Store, Coffee, Ticket, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './PostCreationForm.css';

// Local individual file preview component safely manages its own memory
const FilePreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      className="relative aspect-square rounded-[4px] border border-slate-200 dark:border-slate-800 overflow-hidden group/img shadow-sm"
    >
      {preview ? (
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
      )}
      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className="p-1.5 bg-rose-500 text-white rounded-[4px] shadow-lg transform translate-y-2 group-hover/img:translate-y-0 transition-all"
        >
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
};

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

  // Ref for the scrollable container
  const scrollableContainerRef = useRef(null);

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
      // Reset input value to allow selecting the same file again if it was removed
      e.target.value = null;
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
    { value: 'general', label: 'General', icon: Compass },
    { value: 'nature', label: 'Nature', icon: Trees },
    { value: 'culture', label: 'Culture', icon: Landmark },
    { value: 'shopping', label: 'Shopping', icon: Store },
    { value: 'food', label: 'Food & Drinks', icon: Coffee },
    { value: 'event', label: 'Event', icon: Ticket },
    { value: 'travel', label: 'Travel', icon: Mountain },
  ];

  const totalMedia = (postCreationForm.images?.length || 0) + (postCreationForm.imageLinks?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-white dark:bg-slate-950 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full max-h-[90vh] min-h-[500px] font-jakarta"
      style={{ borderRadius: '4px' }}
    >
      {/* Premium Header */}
      <div className="relative px-8 py-7 bg-slate-900 text-white shrink-0 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        {/* Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-500" />
        
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-teal-500/10 p-2.5 rounded-[4px] border border-teal-500/20">
              <Plus className="w-5 h-5 text-teal-400" strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">
                Create New Pin
              </h3>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Share your discovery</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="p-2 rounded-[4px] bg-white/5 border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* Structured Content */}
      <div
        ref={scrollableContainerRef}
        className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20"
        onTouchMove={(e) => e.stopPropagation()}
        onMouseOver={(e) => e.currentTarget.focus()}
      >
        <form onSubmit={handleMapPostCreation} className="p-8 space-y-8">
          
          {/* Title Input Block */}
          <div className="space-y-3 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-teal-500" strokeWidth={3} />
              Title
            </label>
            <input
              type="text"
              name="title"
              value={postCreationForm.title || ''}
              onChange={handleChange}
              onFocus={() => setActiveField('title')}
              onBlur={() => setActiveField(null)}
              className="w-full h-12 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all duration-300 font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 text-sm font-outfit"
              style={{ borderRadius: '4px' }}
              placeholder="Enter a title for this location..."
              required
            />
          </div>

          {/* Description Block */}
          <div className="space-y-3 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-500" strokeWidth={3} />
              Description
            </label>
            <textarea
              name="description"
              value={postCreationForm.description || ''}
              onChange={handleChange}
              onFocus={() => setActiveField('desc')}
              onBlur={() => setActiveField(null)}
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-indigo-500/10 transition-all duration-300 min-h-[120px] resize-none font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-200 dark:placeholder:text-slate-700 leading-relaxed text-sm font-outfit"
              style={{ borderRadius: '4px' }}
              placeholder="What makes this place special? Share the vibe, tips, or what to look for..."
              required
            />
          </div>

          {/* Premium Category Grid */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" strokeWidth={3} />
              Category
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.value}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePostCreationFormChange({ target: { name: 'category', value: cat.value } })}
                    className={`relative p-3 rounded-[4px] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 h-20 overflow-hidden ${
                      postCreationForm.category === cat.value
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 text-teal-900 dark:text-teal-400 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Icon 
                      className={`w-6 h-6 transition-colors duration-300 ${
                        postCreationForm.category === cat.value ? 'text-teal-600' : 'text-slate-400'
                      }`} 
                      strokeWidth={2.5} 
                    />
                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{cat.label}</span>
                    {postCreationForm.category === cat.value && (
                      <motion.div layoutId="active-cat" className="absolute top-1 right-1">
                        <Check className="w-3 h-3 text-teal-600" strokeWidth={4} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Advanced Media Management */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-teal-500" strokeWidth={3} />
                Images
              </div>
              <span className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-widest ${totalMedia >= 10 ? 'text-rose-500' : 'text-teal-600'}`}>
                {totalMedia} / 10 Added
              </span>
            </label>

            <div 
              className={`relative border-2 border-dashed transition-all duration-300 ease-out group p-1 ${
                dragActive 
                  ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-500/5' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 hover:border-teal-300 dark:hover:border-indigo-500'
              }`}
              style={{ borderRadius: '4px' }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="p-8">
                {!totalMedia && !dragActive && (
                  <div className="text-center space-y-4 pointer-events-none">
                    <div className="w-14 h-14 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto transition-transform duration-300 group-hover:scale-110" style={{ borderRadius: '4px' }}>
                      <Upload className="w-6 h-6 text-teal-500" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">Upload Images</p>
                      <p className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-wider mt-1 opacity-60">Drag files or click to add</p>
                    </div>
                  </div>
                )}

                {/* Secret Inputs */}
                <input type="file" id="image-upload-modern" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                {totalMedia === 0 && (
                  <label htmlFor="image-upload-modern" className="absolute inset-0 cursor-pointer z-10" />
                )}

                {/* Sharp Previews */}
                {totalMedia > 0 && (
                  <div className="relative z-20 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence>
                      {Array.from(postCreationForm.images || []).map((file, i) => (
                        <FilePreview 
                          key={`file-${i}`} 
                          file={file} 
                          onRemove={() => handleRemoveMedia(i)} 
                        />
                      ))}

                      
                      {Array.from(postCreationForm.imageLinks || []).map((link, i) => {
                        const globalIndex = (postCreationForm.images?.length || 0) + i;
                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            key={`link-${i}`}
                            className="relative aspect-square rounded-[4px] border border-slate-200 dark:border-slate-800 overflow-hidden group/img shadow-sm"
                          >
                            <img 
                              src={link} alt="Link Preview" crossOrigin="anonymous" className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                            <div className="absolute top-1 left-1 bg-slate-950/80 rounded-[2px] p-1 backdrop-blur-sm">
                              <LinkIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleRemoveMedia(globalIndex); }}
                                className="p-1.5 bg-rose-500 text-white rounded-[4px] shadow-lg"
                              >
                                <X className="w-4 h-4" strokeWidth={3} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {totalMedia < 10 && (
                      <label htmlFor="image-upload-modern" className="relative aspect-square rounded-[4px] border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group">
                        <Plus className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors" strokeWidth={2} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Premium URL Bridge */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[4px] border border-slate-200 dark:border-slate-800 focus-within:border-slate-900 dark:focus-within:border-indigo-500 transition-all">
              <LinkIcon className="w-4 h-4 text-slate-300 dark:text-slate-700 ml-2" strokeWidth={2.5} />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
                placeholder="External asset link..."
                className="flex-grow bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-700 uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-[2px] hover:bg-black disabled:opacity-30 transition-all"
              >
                Add Link
              </button>
            </div>
          </div>

          {postCreationForm.error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-50 dark:bg-rose-500/10 border-l-4 border-rose-500 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
            >
              <ShieldCheck className="w-4 h-4" strokeWidth={3} />
              {postCreationForm.error}
            </motion.div>
          )}

        </form>
      </div>

      {/* High-Impact Footer */}
      <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0 flex gap-4">
        <motion.button
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="flex-1 h-12 rounded-[4px] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-[11px] font-black uppercase tracking-[0.2em] transition-all"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: '#0f172a' }}
          whileTap={{ scale: 0.98 }}
          disabled={postCreationForm.loading}
          onClick={handleMapPostCreation}
          className="flex-[2] h-12 rounded-[4px] bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {postCreationForm.loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Create Pin</span>
              <Zap className="w-4 h-4 text-teal-400 fill-teal-400" />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

};

export default React.memo(PostCreationForm);