import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Eye,
  EyeOff,
  Send,
  ImageIcon,
  ThumbsUp,
  Bookmark as BookmarkIcon
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";

const getResponsiveWidth = () => {
  if (window.innerWidth >= 1280) return '650px';
  if (window.innerWidth >= 1024) return '600px';
  if (window.innerWidth >= 768) return '560px';
  if (window.innerWidth >= 640) return '520px';
  if (window.innerWidth >= 480) return '480px';
  return '420px';
};

const EnhancedSidebarPostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isAuthenticated, 
  isVisible, 
  onClose,
  onSave,
  onRate,
  onGetDirections,
  isSidebarExpanded = false,
  mapRef
}) => {
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(post?.userRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(getResponsiveWidth());
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const { showModal } = useModal();
  const [bookmarked, setBookmarked] = useState(post?.bookmarked || post?.saved || false);
  const [liked, setLiked] = useState(post?.likes?.some(like => 
    like.user && 
    (like.user._id === currentUser?._id || 
     (typeof like.user === 'string' && like.user === currentUser?._id) ||
     (typeof like.user === 'object' && like.user._id === currentUser?._id))
  ) || false);

  // Effect to control map scroll wheel zoom when post sidebar is open
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

  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth(getResponsiveWidth());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to control map scroll wheel zoom when post sidebar is open
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

  // Update currentPost when the post prop changes
  useEffect(() => {
    if (post) {
      setCurrentPost(prevCurrentPost => {
        if (!prevCurrentPost || prevCurrentPost._id !== post._id) {
          return post;
        }
        return {
          ...prevCurrentPost,
          ...post,
          comments: post.comments || [],
          averageRating: post.averageRating || prevCurrentPost.averageRating,
          totalRatings: post.totalRatings || prevCurrentPost.totalRatings,
          likes: post.likes || prevCurrentPost.likes,
          likesCount: post.likesCount || prevCurrentPost.likesCount,
        };
      });
      setComments(post.comments || []);
      setRating(post.userRating || 0);
      setBookmarked(post.bookmarked || post.saved || false);
      setLiked(post.likes?.some(like => 
        like.user && 
        (like.user._id === currentUser?._id || 
         (typeof like.user === 'string' && like.user === currentUser?._id) ||
         (typeof like.user === 'object' && like.user._id === currentUser?._id))
      ) || false);
    }
  }, [post, currentUser]);

  // Set up real-time updates via socket
  useEffect(() => {
    if (!isVisible || !authToken || !currentPost?._id) return;

    const socket = connectSocket(authToken);

    socket.emit('join-post-room', currentPost._id);

    const handlePostUpdate = (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setCurrentPost(prevPost => ({
          ...prevPost,
          ...updatedPost,
          comments: updatedPost.comments || [],
          likes: updatedPost.likes || [],
          averageRating: updatedPost.averageRating || prevPost.averageRating,
          totalRatings: updatedPost.totalRatings || prevPost.totalRatings,
          likesCount: updatedPost.likesCount || prevPost.likesCount,
        }));
        setComments(updatedPost.comments || []);
      }
    };
    
    const handlePostDeletion = (deletedPostId) => {
      if (deletedPostId === currentPost._id) {
        onClose && onClose();
      }
    };
    
    socket.on('post-updated', handlePostUpdate);
    socket.on('post-bookmarked', handlePostUpdate);
    socket.on('new-comment', handlePostUpdate);
    socket.on('post-deleted', handlePostDeletion);
    socket.on('post-like', handlePostUpdate);

    return () => {
      socket.off('post-updated', handlePostUpdate);
      socket.off('post-bookmarked', handlePostUpdate);
      socket.off('new-comment', handlePostUpdate);
      socket.off('post-deleted', handlePostDeletion);
      socket.off('post-like', handlePostUpdate);
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isVisible, authToken, currentPost?._id, onClose]);

  // Create stable images array
  const hasImages = useMemo(() => {
    return currentPost && ((currentPost.images && currentPost.images.length > 0) || currentPost.image);
  }, [currentPost]);

  const images = useMemo(() => {
    if (!currentPost) return [];
    const result = currentPost?.images || (currentPost?.image ? [currentPost.image] : []);
    return [...result];
  }, [currentPost]);

  // Navigation functions for images
  const nextImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  }, [images]);

  const prevImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  }, [images]);

  const handleBookmark = async () => {
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: "Please login to bookmark posts",
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    setLoading(true);
    try {
      let result;
      if (bookmarked) {
        result = await userApi.removeFavorite(currentPost._id, authToken);
      } else {
        result = await userApi.addFavorite(currentPost._id, authToken);
      }

      if (result.success) {
        setBookmarked(!bookmarked);
        onSave && onSave(currentPost._id, !bookmarked);
        
        showModal({
          title: "Success",
          message: `Post ${!bookmarked ? 'saved' : 'removed from saved'}`,
          type: 'success',
          confirmText: 'OK'
        });
      } else {
        throw new Error(result.error || 'Failed to update bookmark status');
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      showModal({
        title: "Error",
        message: error.message || 'An error occurred. Please try again.',
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: "Please login to like posts",
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    try {
      const response = liked 
        ? await postApi.unlikePost(currentPost._id, authToken)
        : await postApi.likePost(currentPost._id, authToken);
        
      if (response.success) {
        setLiked(!liked); // Toggle the liked state
        setCurrentPost(prev => ({
          ...prev,
          likes: response.data?.likes || [],
          likesCount: response.data?.likesCount || (liked ? Math.max(0, prev.likesCount - 1) : (prev.likesCount || 0) + 1)
        }));
      } else {
        throw new Error(response.error || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      showModal({
        title: "Error",
        message: error.message || 'An error occurred. Please try again.',
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentPost.title,
        text: currentPost.description,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      const postUrl = `${window.location.origin}/post/${currentPost._id}`;
      navigator.clipboard.writeText(postUrl).then(() => {
        showModal({
          title: "Success",
          message: 'Post link copied to clipboard!',
          type: 'success',
          confirmText: 'OK'
        });
      });
    }
  };

  const handleGetDirections = () => {
    if (!currentPost.location || !currentPost.location.latitude || !currentPost.location.longitude) {
      showModal({
        title: "Location Not Available",
        message: 'Location information is not available for this post.',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }
    
    const position = [currentPost.location.latitude, currentPost.location.longitude];
    onGetDirections && onGetDirections(position);
    onClose && onClose();
  };

  const handleRate = async (starRating) => {
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to rate posts',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    if (!currentPost?._id) return;

    try {
      const result = await postApi.addRating(currentPost._id, { rating: starRating }, authToken);

      if (result.success) {
        setRating(starRating);
        
        setCurrentPost(prevPost => ({
          ...prevPost,
          averageRating: result.data?.averageRating || prevPost.averageRating || 0,
          totalRatings: result.data?.totalRatings || prevPost.totalRatings || 0,
          userRating: starRating
        }));
        
        if (onRate && typeof onRate === 'function') {
          onRate(currentPost._id, result.data?.averageRating || 0, result.data?.totalRatings || 0);
        }
        
        showModal({
          title: "Rating Submitted",
          message: 'Thank you for rating this post!',
          type: 'success',
          confirmText: 'OK'
        });
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showModal({
        title: "Error",
        message: error.message || 'An error occurred while rating. Please try again.',
        type: 'error',
        confirmText: 'OK'
      });
    }
  };

  const handleAddComment = async () => {
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: 'Please login to comment',
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    if (!newComment.trim() || !currentPost?._id) return;

    setCommentLoading(true);
    try {
      const response = await postApi.addComment(currentPost._id, { text: newComment }, authToken);

      if (response.success) {
        const newCommentObj = {
          _id: response.data?._id || `temp-${Date.now()}`,
          text: newComment,
          user: {
            name: currentUser?.name || currentUser?.email || "Anonymous",
            _id: currentUser?._id
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setComments(prevComments => [...prevComments, newCommentObj]);
        setNewComment('');
        
        setCurrentPost(prevPost => ({
          ...prevPost,
          comments: [...(prevPost.comments || []), newCommentObj],
          totalComments: (prevPost.totalComments || prevPost.comments?.length || 0) + 1
        }));
        
        // Close comments if user just submitted a comment
        if (showComments) {
          setTimeout(() => setShowComments(false), 1000);
        }
      } else {
        throw new Error(response.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showModal({
        title: "Error",
        message: 'An error occurred while adding comment. Please try again.',
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleClose = () => {
    onClose && onClose(); 
  };

  if (!isVisible || !currentPost) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed top-0 bottom-0 z-[100000] sidebar-window bg-white shadow-2xl border-l border-gray-200 overflow-hidden"
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
        aria-labelledby="post-window-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 id="post-window-title" className="font-bold text-lg truncate">
              {currentPost.title || 'Post Details'}
            </h2>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label={showInfo ? "Hide info" : "Show info"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showInfo ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </motion.button>
              <motion.button 
                onClick={handleClose}
                aria-label="Close post window"
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Content with scrollable area - prevent scroll from affecting map */}
        <div 
          className="sidebar-window-content overflow-y-auto h-[calc(100%-80px)]"
          onWheel={(e) => {
            // Prevent scroll events from affecting the map
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent mouse events from affecting the map
            e.stopPropagation();
          }}
        >
            {/* Image Gallery */}
            <div className="w-full mb-6 relative">
              <div className="relative w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden rounded-b-lg shadow-inner">
              {hasImages && images.length > 0 ? (
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <OptimizedImage
                    src={getImageUrl(images[currentImageIndex])}
                    alt={currentPost.title || 'Post image'}
                    className="w-full h-full object-cover"
                    wrapperClassName="flex items-center justify-center"
                  />
                </motion.div>
              ) : (
                <div className="text-center p-4">
                  <div className="mx-auto w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-3">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-500 mb-1">No Images Available</h3>
                  <p className="text-sm text-gray-400">
                    This post doesn't have any images yet.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                  aria-label="Previous image"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                  aria-label="Next image"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Thumbnail Gallery */}
            {hasImages && images.length > 1 && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {images.map((img, index) => {
                    const isSelected = currentImageIndex === index;
                    
                    return (
                      <motion.button
                        key={`thumb-${index}`} 
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-emerald-500 shadow-md scale-105' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <OptimizedImage
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Post Details */}
          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="px-6 pb-6 space-y-5"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {currentPost.title || 'Untitled Pin'}
                </h1>
                {currentPost.category && (
                  <span className="self-start bg-emerald-100 text-emerald-800 text-sm px-4 py-2 rounded-full font-semibold">
                    {currentPost.category}
                  </span>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed text-base">
                {currentPost.description || 'No description available.'}
              </p>

              {/* Location */}
              {currentPost.location?.latitude && currentPost.location?.longitude && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-800 text-lg">Location</span>
                  </div>
                  <p className="text-base text-gray-700">
                    {currentPost.location.latitude.toFixed(6)}, {currentPost.location.longitude.toFixed(6)}
                  </p>
                  {currentPost.location.address && (
                    <p className="text-sm text-gray-600 mt-1">{currentPost.location.address}</p>
                  )}
                </div>
              )}

              {/* Ratings */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg text-gray-800">Ratings & Reviews</h3>
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={`star-${star}`}
                          className="p-1 rounded-full"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (authToken) {
                              setRating(star);
                              handleRate(star);
                            } else {
                              showModal({
                                title: "Authentication Required",
                                message: 'Please login to rate posts',
                                type: 'info',
                                confirmText: 'OK'
                              });
                            }
                          }}
                          onMouseEnter={() => authToken && setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors duration-200 ${
                              star <= (hoverRating || rating || currentPost.averageRating || 0) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <span className="ml-3 text-xl font-bold text-gray-800">
                      {(currentPost.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex gap-2 text-gray-600">
                    <span className="font-medium">{currentPost.totalRatings || 0} ratings</span>
                    <span>•</span>
                    <span>{(currentPost.comments || []).length || 0} comments</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Posted By</p>
                  <p className="font-bold text-lg text-gray-800">{typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Posted On</p>
                  <p className="font-bold text-lg text-gray-800">{formatDate(currentPost.datePosted)}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="p-6 border-t border-gray-200 bg-white"
          >
            <div className="flex flex-wrap items-center justify-around gap-4">
              <motion.button
                onClick={handleComment}
                className="flex flex-col items-center gap-1.5 text-gray-700 hover:text-emerald-600 transition-all"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label="View comments"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold text-sm">{currentPost.comments?.length || 0}</span>
              </motion.button>

              <motion.button
                onClick={handleLike}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  liked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-700 hover:text-emerald-600"
                }`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label={liked ? "Unlike post" : "Like post"}
              >
                <ThumbsUp
                  className={`w-6 h-6 ${liked ? "fill-current" : ""}`}
                />
                <span className="font-semibold text-sm">{liked ? "Liked" : "Like"}</span>
              </motion.button>

              <motion.button
                onClick={handleBookmark}
                disabled={loading}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  bookmarked
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-gray-700 hover:text-emerald-600"
                } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
              >
                <BookmarkIcon
                  className={`w-6 h-6 ${bookmarked ? "fill-current" : ""}`}
                />
                <span className="font-semibold text-sm">{bookmarked ? "Saved" : "Save"}</span>
              </motion.button>

              <motion.button
                onClick={handleGetDirections}
                className="flex flex-col items-center gap-1.5 text-gray-700 hover:text-emerald-600 transition-all"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label="Get directions"
              >
                <ExternalLink className="w-6 h-6" />
                <span className="font-semibold text-sm">Directions</span>
              </motion.button>
            </div>
            
            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-gray-50 mt-6 rounded-2xl border border-gray-200"
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">Comments ({comments.length})</h3>
                  </div>
                  
                  {/* Comments List - integrated with main scroll to avoid double scrollbars */}
                  <div className="p-4 flex-1 overflow-y-auto">
                    {comments && comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment, index) => (
                          <motion.div
                            key={comment._id || `comment-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white p-3 rounded-xl border border-gray-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-800">
                                    {typeof comment.user === 'object' ? comment.user.name : comment.user || "Anonymous"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700 mt-1">{comment.text}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-base">No comments yet. Be the first!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Comment Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <motion.button
                        onClick={handleAddComment}
                        disabled={commentLoading}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        aria-label="Post comment"
                      >
                        {commentLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedSidebarPostWindow;