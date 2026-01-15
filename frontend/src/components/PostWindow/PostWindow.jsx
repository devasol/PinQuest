import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MapPin,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  ExternalLink,
  ZoomIn,
  Search,
  Navigation,
  Send,
  MoreHorizontal
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import CommentItem from './CommentItem';
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";
import './PostWindow.css';

const PostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isOpen, 
  onClose,
  onSave,
  onRate,
  onGetDirections
}) => {
  // State
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(post?.userRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingComment, setAddingComment] = useState(false);
  const [bookmarked, setBookmarked] = useState(post?.bookmarked || post?.saved || false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);
  
  const { showModal } = useModal();
  const commentsEndRef = useRef(null);

  // Sync post prop
  useEffect(() => {
    if (post) {
      setCurrentPost(prev => {
        if (!prev || prev._id !== post._id) return post;
        return { ...prev, ...post, comments: post.comments || [], averageRating: post.averageRating || prev.averageRating };
      });
      setComments(post.comments || []);
      setRating(post.userRating || 0);
      setBookmarked(post.bookmarked || post.saved || false);
    }
  }, [post]);

  // Socket updates
  useEffect(() => {
    if (!isOpen || !authToken || !currentPost?._id) return;
    const socket = connectSocket(authToken);
    socket.emit('join-post-room', currentPost._id);

    const handleUpdate = (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setComments(updatedPost.comments || []);
        setCurrentPost(prev => ({ ...updatedPost, comments: updatedPost.comments || [] }));
      }
    };
    
    // Listeners
    socket.on('post-updated', handleUpdate);
    socket.on('new-comment', handleUpdate);
    socket.on('post-deleted', (id) => id === currentPost._id && onClose && onClose());

    return () => {
      socket.off('post-updated', handleUpdate);
      socket.off('new-comment', handleUpdate);
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isOpen, authToken, currentPost?._id, onClose]);

  // Image Logic
  const images = useMemo(() => {
    if (!currentPost) return [];

    // Normalize images into a clean array
    let rawImages = [];

    // 1. Check images array - handle both string URLs and object formats
    if (currentPost.images && Array.isArray(currentPost.images) && currentPost.images.length > 0) {
      rawImages = currentPost.images
        .filter(img => img) // Remove null/undefined values
        .map(img => {
          // If img is a string, convert to object format
          if (typeof img === 'string') {
            return { url: img };
          }
          // If img is an object but doesn't have a url property, try to extract it
          if (typeof img === 'object') {
            // Prioritize url, then path, then filename, then publicId
            if (img.url) return { url: img.url, publicId: img.publicId };
            if (img.path) return { url: img.path, publicId: img.publicId };
            if (img.filename) return { url: `/uploads/${img.filename}`, publicId: img.filename };
            if (img.publicId) return { url: `/uploads/${img.publicId}`, publicId: img.publicId };
          }
          return img;
        });
    }

    // 2. If no images array (or empty), check for single image object
    if (rawImages.length === 0 && currentPost.image) {
      let singleImage = null;
      // If image is a string, wrap it; if it's an object with url, wrap it
      if (typeof currentPost.image === 'string') {
        singleImage = { url: currentPost.image };
      } else if (typeof currentPost.image === 'object') {
        // Prioritize url, then path, then filename, then publicId
        if (currentPost.image.url) singleImage = { url: currentPost.image.url, publicId: currentPost.image.publicId };
        else if (currentPost.image.path) singleImage = { url: currentPost.image.path, publicId: currentPost.image.publicId };
        else if (currentPost.image.filename) singleImage = { url: `/uploads/${currentPost.image.filename}`, publicId: currentPost.image.filename };
        else if (currentPost.image.publicId) singleImage = { url: `/uploads/${currentPost.image.publicId}`, publicId: currentPost.image.publicId };
      }

      if (singleImage) {
        rawImages = [singleImage];
      }
    }

    return rawImages;
  }, [currentPost]);

  const nextImage = useCallback(() => {
    if (images.length > 0) setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  const prevImage = useCallback(() => {
    if (images.length > 0) setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  // Reset image index when images change or post changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images.length, currentPost?._id]);

  // Actions
  const handleBookmarkAction = async () => {
    if (!authToken) return showAuthModal();
    setLoadingBookmark(true);
    try {
      const action = bookmarked ? userApi.removeFavorite : userApi.addFavorite;
      const result = await action(currentPost._id, authToken);
      if (result.success) {
        setBookmarked(!bookmarked);
        onSave && onSave(currentPost._id, !bookmarked);
      }
    } catch(e) { 
      console.error(e); 
    } finally { 
      setLoadingBookmark(false); 
    }
  };

  const [selectedRating, setSelectedRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const handleRateAction = async (val) => {
    if (!authToken) return showAuthModal();
    if (isRatingSubmitting) return;

    setIsRatingSubmitting(true);
    try {
      const result = await postApi.addRating(currentPost._id, { rating: val }, authToken);
      if (result.success) {
        setRating(val);
        setCurrentPost(prev => ({
          ...prev, 
          averageRating: result.data?.averageRating || prev.averageRating,
          totalRatings: result.data?.totalRatings || prev.totalRatings,
          userRating: val
        }));
        onRate && onRate(currentPost._id, result.data?.averageRating, result.data?.totalRatings);
        setSelectedRating(0);
      }
    } catch(e) { 
      console.error(e); 
    } finally {
      setIsRatingSubmitting(false);
    }
  };



  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!authToken) return showAuthModal();
    if (!newComment.trim()) return;

    setAddingComment(true);
    const tempId = Date.now();
    const tempComment = {
      _id: tempId,
      text: newComment,
      user: currentUser,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI
    setComments(prev => [tempComment, ...prev]);
    setNewComment('');

    try {
      const result = await postApi.addComment(currentPost._id, { text: newComment }, authToken);
      if (result.success) {
        // Replace temp comment with real one
        setComments(prev => prev.map(c => c._id === tempId ? result.data : c));
      } else {
        // Rollback
        setComments(prev => prev.filter(c => c._id !== tempId));
      }
    } catch(e) {
      console.error(e);
      setComments(prev => prev.filter(c => c._id !== tempId));
    } finally {
      setAddingComment(false);
    }
  };

  const showAuthModal = () => {
    showModal({ title: "Authentication Required", message: "Please login to perform this action", type: 'info', confirmText: 'OK' });
  };

  if (!isOpen || !currentPost) return null;

  const hasImages = images.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button (Floating) */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all md:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT COLUMN: Image Gallery (60% width on Desktop) */}
          <div className="w-full md:w-[60%] bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 flex items-center justify-center relative group min-h-[300px] md:min-h-full">
            {hasImages ? (
              <>
                 <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
                    <OptimizedImage
                       key={`post-img-${currentPost._id}-${currentImageIndex}`}
                       src={getImageUrl(images[currentImageIndex])}
                       alt={currentPost.title || "Post image"}
                       className="max-w-full max-h-full object-contain"
                       wrapperClassName="w-full h-full"
                       priority={true}
                    />
                 </div>

                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {images.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
               <div className="text-gray-500 flex flex-col items-center">
                 <div className="bg-gray-800 p-4 rounded-full mb-2"><MoreHorizontal className="w-8 h-8" /></div>
                 <p>No Visuals</p>
               </div>
            )}
          </div>

          {/* RIGHT COLUMN: Details & Comments (40% width on Desktop) */}
          <div className="w-full md:w-[40%] flex flex-col bg-white h-auto md:h-full overflow-hidden">
            
            {/* Right Column Container - Flex Column */}
            <div className="flex-1 flex flex-col h-full md:max-h-[90vh] overflow-hidden bg-white">
               
               {/* 1. Fixed Header (Author & Close) */}
               <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                  <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-sm border-2 border-white/20">
                      {(typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : (currentPost.postedBy || "Anonymous")).charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 leading-tight">
                       {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : "Anonymous"}
                     </h3>
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-500 font-medium">{formatDate(currentPost.datePosted)}</span>
                       {bookmarked && (
                         <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                           <Bookmark className="w-3 h-3 fill-current" />
                           Saved
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 <button onClick={onClose} className="hidden md:flex p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* 2. Scrollable Content (Details + Comments) */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                  <div className="space-y-6">
                    {/* Title & Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                          {currentPost.title}
                        </h2>
                        <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide border border-emerald-100">
                          {currentPost.category}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {currentPost.description}
                      </p>
                    </div>

                    {/* Meta Data (Price, Location) */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                        <div className="p-1 rounded-full bg-emerald-100">
                           <span className="block w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        {currentPost.price > 0 ? `$${currentPost.price}` : 'Free'}
                      </div>
                      
                      {currentPost.location && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-600 text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors group/loc"
                             onClick={() => {
                               onGetDirections && onGetDirections(currentPost);
                               onClose();
                             }}
                        >
                          <MapPin className="w-4 h-4 group-hover/loc:scale-110 transition-transform" />
                          <span>
                            {currentPost.location.address || `${currentPost.location.latitude.toFixed(4)}, ${currentPost.location.longitude.toFixed(4)}`}
                          </span>
                          <ExternalLink className="w-3 h-3 ml-1 opacity-50 group-hover/loc:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Interaction Dashboard */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-gray-100 bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-center hover:bg-gray-100 transition-colors relative group/rate">
                         {/* Average Rating Display */}
                         <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                           Avg: <span className="text-gray-900 font-bold text-sm">{currentPost.averageRating?.toFixed(1) || '0.0'}</span> <span className="text-gray-300">({currentPost.totalRatings || 0})</span>
                         </div>

                         <div className="flex items-center gap-1 my-1">
                           {[1,2,3,4,5].map(star => (
                             <Star 
                               key={star} 
                               className={`w-5 h-5 cursor-pointer transition-all active:scale-90 ${ 
                                 star <= (hoverRating || selectedRating || rating) 
                                   ? 'text-amber-400 fill-amber-400 scale-110' 
                                   : 'text-gray-300' 
                               }`}
                               onMouseEnter={() => setHoverRating(star)}
                               onMouseLeave={() => setHoverRating(0)}
                               onClick={() => setSelectedRating(star)}
                             />
                           ))}
                         </div>
                         
                         {selectedRating > 0 ? (
                           <button 
                             onClick={() => handleRateAction(selectedRating)}
                             disabled={isRatingSubmitting}
                             className="w-full py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold uppercase tracking-wide hover:bg-emerald-600 transition-colors shadow-sm animate-in fade-in slide-in-from-bottom-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                             {isRatingSubmitting ? (
                               <>
                                 <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 {rating > 0 ? 'Updating...' : 'Rating...'}
                               </>
                             ) : (
                               rating > 0 ? 'Update Rating' : 'Submit Rating'
                             )}
                           </button>
                         ) : (
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                             {rating > 0 ? `Your Rating: ${rating}/5` : "Tap Stars to Rate"}
                           </span>
                         )}
                      </div>

                      <button 
                       onClick={handleBookmarkAction}
                       disabled={loadingBookmark}
                       className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all shadow-sm relative overflow-hidden group/btn ${
                         bookmarked 
                         ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-500 text-white shadow-amber-200' 
                         : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                       }`}
                      >
                        {bookmarked && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />}
                        <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current animate-pulse-once' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-wide relative z-10">
                          {bookmarked ? "Saved to Collection" : "Save for Later"}
                        </span>
                      </button>
                    </div>

                    {/* Get Directions Button */}
                    {currentPost.location && (
                      <button 
                        onClick={() => {
                          onGetDirections && onGetDirections(currentPost.position || [currentPost.location.latitude, currentPost.location.longitude]);
                          onClose();
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-bold tracking-wide shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-5 h-5 fill-current" />
                        <span>Get Directions</span>
                      </button>
                    )}

                    {/* Comments Section Header */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        Comments <span className="text-gray-400 font-normal">({comments.length})</span>
                      </h4>
                      
                      <div className="space-y-4">
                        {comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment._id} className="group">
                              <CommentItem comment={comment} currentUserId={currentUser?._id} authToken={authToken} onUpdate={() => {}} onDelete={() => {}} />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Be the first to share your thoughts.</p>
                          </div>
                        )}
                        <div ref={commentsEndRef} />
                      </div>
                    </div>
                  </div>
               </div>

               {/* 3. Fixed Footer (Comment Input) */}
               <div className="p-4 border-t border-gray-100 bg-white shrink-0 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-xl px-4 py-3 text-sm transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={!newComment.trim() || addingComment}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/30"
                    >
                      {addingComment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
               </div>
            </div>

            {/* End Right Column Container */}
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(PostWindow);