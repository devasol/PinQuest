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
  Navigation,
  Send,
  MoreHorizontal,
  Compass,
  Zap
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";

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
    
    socket.on('post-updated', handleUpdate);
    socket.on('new-comment', handleUpdate);

    return () => {
      socket.off('post-updated', handleUpdate);
      socket.off('new-comment', handleUpdate);
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isOpen, authToken, currentPost?._id]);

  const images = useMemo(() => {
    if (!currentPost) return [];
    let rawImages = [];
    if (currentPost.images && Array.isArray(currentPost.images) && currentPost.images.length > 0) {
      rawImages = currentPost.images.filter(img => img).map(img => typeof img === 'string' ? { url: img } : img);
    }
    if (rawImages.length === 0 && currentPost.image) {
      rawImages = [typeof currentPost.image === 'string' ? { url: currentPost.image } : currentPost.image];
    }
    return rawImages;
  }, [currentPost]);

  const nextImage = useCallback(() => {
    if (images.length > 0) setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  const prevImage = useCallback(() => {
    if (images.length > 0) setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

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
    } catch(e) { console.error(e); } finally { setLoadingBookmark(false); }
  };

  const handleRateAction = async (val) => {
    if (!authToken) return showAuthModal();
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
      }
    } catch(e) { console.error(e); }
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!authToken) return showAuthModal();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const result = await postApi.addComment(currentPost._id, { text: newComment }, authToken);
      if (result.success) {
        setComments(prev => [result.data, ...prev]);
        setNewComment('');
      }
    } catch(e) { console.error(e); } finally { setAddingComment(false); }
  };

  const showAuthModal = () => {
    showModal({ title: "Authentication Required", message: "Please login to perform this action", type: 'info' });
  };

  if (!isOpen || !currentPost) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white dark:bg-slate-950 rounded-[4px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row border border-white/20 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Gradient Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50" />

          {/* Close Button Container (Desktop Only) */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-[4px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white md:text-slate-400 md:bg-slate-50 md:dark:bg-slate-900 md:border-slate-100 md:dark:border-slate-800 hover:bg-slate-900 hover:text-white transition-all shadow-sm hidden md:flex"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* LEFT: Immersive Visuals */}
          <div className="w-full md:w-7/12 bg-slate-900 relative group overflow-hidden min-h-[300px] md:min-h-full">
             {images.length > 0 ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10 pointer-events-none" />
                  <OptimizedImage
                    src={getImageUrl(images[currentImageIndex])}
                    alt={currentPost.title}
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[4px] bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-20 hover:bg-white/40">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[4px] bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-20 hover:bg-white/40">
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Image Indicator Chips */}
                  <div className="absolute bottom-8 left-8 flex items-center gap-2 z-20">
                     {images.map((_, i) => (
                       <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-8 bg-teal-400' : 'w-2 bg-white/40'}`} />
                     ))}
                  </div>
                </>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                   <div className="w-16 h-16 rounded-[12px] bg-slate-800 flex items-center justify-center">
                      <Compass size={32} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] font-jakarta">No Visual Data</span>
                </div>
             )}
          </div>

          {/* RIGHT: Modern Info & Interaction */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 h-full overflow-hidden min-h-0">
             
             {/* Header: Author Info */}
             <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[4px] bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-teal-400 dark:text-teal-300 font-black text-lg border-2 border-slate-900 dark:border-slate-700 shadow-xl">
                      {(typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : "A").charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white font-jakarta uppercase tracking-tight">
                         {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : "Anonymous Explorer"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 font-outfit uppercase tracking-widest">
                         {formatDate(currentPost.datePosted)}
                      </span>
                   </div>
                </div>
                <button onClick={onClose} className="md:hidden w-10 h-10 rounded-[4px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                   <X size={18} />
                </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-white dark:bg-slate-950 min-h-0">
                <div className="space-y-8">
                   
                   {/* Title & Category */}
                   <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                         <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-jakarta leading-[0.9]">
                            {currentPost.title}
                         </h2>
                         <button 
                           onClick={handleBookmarkAction}
                           className={`shrink-0 w-12 h-12 rounded-[4px] border flex items-center justify-center transition-all ${bookmarked ? 'bg-teal-400 border-teal-400 text-slate-900 shadow-lg shadow-teal-200' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                         >
                            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} strokeWidth={2.5} />
                         </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <span className="px-4 py-1.5 rounded-[4px] bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest border border-teal-100 dark:border-teal-900 font-jakarta">
                            {currentPost.category || 'General'}
                         </span>
                         <span className="px-4 py-1.5 rounded-[4px] bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest font-jakarta">
                            {currentPost.price > 0 ? `$${currentPost.price}` : 'FREE ACCESS'}
                         </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed font-outfit">
                         {currentPost.description}
                      </p>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-[8px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                         <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest font-jakarta">Global Rating</span>
                         <div className="flex items-center gap-1.5">
                            {[1,2,3,4,5].map(star => (
                               <Star 
                                 key={star} size={16}
                                 className={`cursor-pointer transition-all ${star <= (hoverRating || rating) ? 'text-teal-400 fill-teal-400 scale-125' : 'text-slate-200 dark:text-slate-800'}`}
                                 onMouseEnter={() => setHoverRating(star)}
                                 onMouseLeave={() => setHoverRating(0)}
                                 onClick={() => handleRateAction(star)}
                               />
                            ))}
                         </div>
                         <span className="text-[11px] font-black text-slate-900 dark:text-white font-jakarta uppercase tracking-tighter">
                            {currentPost.averageRating?.toFixed(1) || '0.0'} Trust Level
                         </span>
                      </div>

                      <div 
                        onClick={() => currentPost.location && onGetDirections && onGetDirections(currentPost)}
                        className="p-4 rounded-[8px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3 hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group/loc"
                      >
                         <span className="text-[9px] font-black text-slate-400 group-hover/loc:text-slate-500 dark:text-slate-600 uppercase tracking-widest font-jakarta">Coordinate</span>
                         <MapPin size={22} className="text-teal-400" strokeWidth={2.5} />
                         <span className="text-[10px] font-black uppercase tracking-tighter font-jakarta truncate w-full text-center">
                            Open in Map
                         </span>
                      </div>
                   </div>

                   {/* Action Button */}
                   <button 
                     onClick={() => currentPost.location && onGetDirections && onGetDirections(currentPost)}
                     className="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-[4px] flex items-center justify-center gap-4 group/dir active:scale-95 transition-all shadow-2xl dark:shadow-none shadow-slate-200"
                   >
                      <Navigation size={20} className="text-teal-400 dark:text-white group-hover/dir:translate-x-1 group-hover/dir:-translate-y-1 transition-transform" strokeWidth={3} />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] font-jakarta">Initiate Directions</span>
                   </button>

                   {/* Comments Section */}
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-jakarta flex items-center gap-3">
                            <MessageCircle size={14} className="text-teal-400" strokeWidth={3} />
                            Expedition Log ({comments.length})
                         </h4>
                      </div>

                      <div className="space-y-4">
                         {comments.length > 0 ? (
                            comments.map(comment => <ReviewItem key={comment._id} comment={comment} />)
                         ) : (
                            <div className="p-10 rounded-[8px] bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-3">
                               <MessageCircle size={28} className="text-slate-200 dark:text-slate-800" strokeWidth={3} />
                               <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest font-jakarta">No logs recorded yet.</span>
                            </div>
                         )}
                         <div ref={commentsEndRef} />
                      </div>
                   </div>

                </div>
             </div>

             {/* Fixed Footer: Comment Input */}
             <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-950 shrink-0">
                <form onSubmit={handleAddComment} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-[4px] group focus-within:border-slate-900 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all">
                   <input 
                     type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                     placeholder="Share your log data..."
                     className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 font-outfit outline-none px-4"
                   />
                   <button 
                     type="submit" disabled={!newComment.trim() || addingComment}
                     className="w-12 h-12 rounded-[4px] bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-teal-400 dark:text-white hover:bg-black dark:hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:grayscale"
                   >
                      {addingComment ? <div className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /> : <Send size={18} strokeWidth={3} />}
                   </button>
                </form>
             </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper component for cleaner logs
const ReviewItem = ({ comment }) => (
  <div className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
     <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-[4px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-sm font-jakarta shrink-0">
           {(comment.user?.name || "A").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-1">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-jakarta">
                 {comment.user?.name || "Anonymous Explorer"}
              </span>
              <span className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase font-outfit">
                 {formatDate(comment.createdAt)}
              </span>
           </div>
           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-outfit leading-relaxed">
              {comment.text}
           </p>
        </div>
     </div>
  </div>
);

export default React.memo(PostWindow);