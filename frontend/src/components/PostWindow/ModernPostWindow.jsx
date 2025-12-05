import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Image as ImageIcon,
  MoreHorizontal
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import CommentItem from './CommentItem';
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";
import './ModernPostWindow.css';

const ModernPostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isAuthenticated, 
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
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [showImageControls, setShowImageControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { showModal } = useModal();
  const [bookmarked, setBookmarked] = useState(post?.bookmarked || post?.saved || false);
  const [loading, setLoading] = useState(false);

  // Simple local bookmark functionality
  const handleBookmarkFromHook = async () => {
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
        // Update local state optimistically
        setBookmarked(!bookmarked);
        
        // Call parent callback to notify of the change
        onSave && onSave(currentPost._id, !bookmarked);
        
        // Show success message
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
        };
      });
      setComments(post.comments || []);
      setRating(post.userRating || 0);
      setBookmarked(post.bookmarked || post.saved || false);
    }
  }, [post]);

  // Set up real-time updates via socket
  useEffect(() => {
    if (!isOpen || !authToken || !currentPost?._id) return;

    const socket = connectSocket(authToken);

    socket.emit('join-post-room', currentPost._id);

    const handlePostUpdate = (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setCurrentPost(prevPost => ({
          ...updatedPost,
          comments: updatedPost.comments || []
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

    return () => {
      socket.off('post-updated', handlePostUpdate);
      socket.off('post-bookmarked', handlePostUpdate);
      socket.off('new-comment', handlePostUpdate);
      socket.off('post-deleted', handlePostDeletion);
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isOpen, authToken, currentPost?._id]);

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

    try {
      await handleBookmarkFromHook();
      onSave && onSave(currentPost._id, !bookmarked);
    } catch (error) {
      console.error('Error handling bookmark:', error);
    }
  };

  const handleComment = () => {
    setShowCommentsModal(true);
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

    try {
      const response = await postApi.addComment(currentPost._id, { text: newComment }, authToken);

      if (response.success) {
        const newCommentObj = {
          _id: response.data?._id || `temp-${Date.now()}`,
          text: newComment,
          user: currentUser,
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
        
        setShowCommentsModal(false);
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
    }
  };

  const handleClose = () => {
    onClose && onClose(); 
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' && hasImages && images.length > 1) {
        nextImage();
      } else if (e.key === 'ArrowLeft' && hasImages && images.length > 1) {
        prevImage();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasImages, images.length, nextImage, prevImage]);

  if (!isOpen || !currentPost) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[99998] flex items-center justify-center p-4 min-h-full"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300,
            duration: 0.4 
          }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col z-[99999] border border-emerald-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex justify-between items-center relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}
                </h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(currentPost.datePosted)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label={showInfo ? "Hide info" : "Show info"}
              >
                {showInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Gallery */}
            <div className="md:w-1/2">
              <div className="relative h-64 md:h-full">
                {hasImages && images.length > 0 ? (
                  <div className="relative w-full h-full">
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
                      onMouseEnter={() => setShowImageControls(true)}
                      onMouseLeave={() => setShowImageControls(false)}
                    >
                      <OptimizedImage
                        src={getImageUrl(images[currentImageIndex])}
                        alt={currentPost.title || 'Post image'}
                        className="w-full h-full object-cover"
                        wrapperClassName="flex items-center justify-center"
                      />
                      
                      {/* Navigation Arrows */}
                      {images.length > 1 && showImageControls && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                            aria-label="Previous image"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                            aria-label="Next image"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-4">
                        <ImageIcon className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">No Images Available</h3>
                      <p className="text-gray-600 text-sm">
                        This post doesn't have any images yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {hasImages && images.length > 1 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {images.map((img, index) => {
                      const isSelected = currentImageIndex === index;
                      
                      return (
                        <button
                          key={`thumb-${index}`} 
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-emerald-500 shadow-lg scale-105' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <OptimizedImage
                            src={getImageUrl(img)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Post Details */}
            <div className="md:w-1/2 flex flex-col">
              {showInfo ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                      {currentPost.title || 'Untitled Post'}
                    </h1>
                    {currentPost.category && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-semibold">
                        {currentPost.category}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {currentPost.description || 'No description available.'}
                  </p>

                  {/* Location */}
                  {currentPost.location?.latitude && currentPost.location?.longitude && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">Location</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {currentPost.location.latitude.toFixed(6)}, {currentPost.location.longitude.toFixed(6)}
                      </p>
                      {currentPost.location.address && (
                        <p className="text-xs text-gray-600 mt-1">{currentPost.location.address}</p>
                      )}
                    </div>
                  )}

                  {/* Ratings */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">Ratings & Reviews</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`star-${star}`}
                              className={`w-5 h-5 cursor-pointer ${
                                star <= (rating > 0 ? rating : (hoverRating || currentPost.averageRating || 0)) 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              onClick={() => {
                                if (authToken) {
                                  setRating(star);
                                } else {
                                  showModal({
                                    title: "Authentication Required",
                                    message: 'Please login to rate posts',
                                    type: 'info',
                                    confirmText: 'OK'
                                  });
                                }
                              }}
                              onMouseEnter={() => authToken && rating === 0 && setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            />
                          ))}
                        </div>
                        <span className="text-gray-800 font-bold">
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
                      <button
                        onClick={() => {
                          if (rating > 0) {
                            handleRate(rating);
                          } else {
                            showModal({
                              title: "Select a Rating",
                              message: 'Please select a rating first',
                              type: 'info',
                              confirmText: 'OK'
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
                          rating > 0 
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={rating === 0 || !authToken}
                      >
                        {rating > 0 ? 'Submit Rating' : 'Select Stars'}
                      </button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Posted By</p>
                      <p className="font-bold text-gray-800">{typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">Posted On</p>
                      <p className="font-bold text-gray-800">{formatDate(currentPost.datePosted)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                  <div className="mb-4 p-3 bg-gray-200 rounded-full">
                    <EyeOff className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Information Hidden</h3>
                  <p className="text-gray-600 mb-4 text-sm">Press 'I' key or close the window to show details again</p>
                  <button 
                    onClick={() => setShowInfo(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Show Information
                  </button>
                </div>
              )}

              {/* Action Bar */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={handleComment}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-semibold">{currentPost.comments?.length || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleBookmark}
                      disabled={loading}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        bookmarked
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${bookmarked ? "fill-current text-white" : ""}`}
                      />
                    </motion.button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={handleShare}
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </motion.button>
                    <motion.button
                      onClick={handleGetDirections}
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Directions</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Modal */}
          <AnimatePresence>
            {showCommentsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
                onClick={() => setShowCommentsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.85, opacity: 0, y: 20 }}
                  transition={{ 
                    type: "spring", 
                    damping: 20, 
                    stiffness: 300,
                    duration: 0.3 
                  }}
                  className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-96 flex flex-col border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800">Comments</h3>
                      <button 
                        onClick={() => setShowCommentsModal(false)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {comments && comments.length > 0 ? (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <CommentItem 
                            key={comment._id || `comment-${Math.random()}`}
                            comment={comment}
                            authToken={authToken}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your comment..."
                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <motion.button
                        onClick={handleAddComment}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium"
                        whileTap={{ scale: 0.95 }}
                      >
                        Post
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernPostWindow;