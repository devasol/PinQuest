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
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import CommentItem from './CommentItem'; // Import the new CommentItem component
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";
import './PostWindow.css';

const PostWindow = ({ 
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
  // Use the incoming post data directly instead of complex state management
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(post?.userRating || 0); // Use user's specific rating if available
  const [hoverRating, setHoverRating] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);


  // Initialize bookmark state
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

  // Update currentPost when the post prop changes (for initial load or when switching posts)
  useEffect(() => {
    if (post) {
      setCurrentPost(prevCurrentPost => {
        // Only update if it's a different post entirely
        if (!prevCurrentPost || prevCurrentPost._id !== post._id) {
          return post;
        }
        // If same post, keep the current state but update volatile data
        return {
          ...prevCurrentPost,
          ...post,
          comments: post.comments || [],
          averageRating: post.averageRating || prevCurrentPost.averageRating,
          totalRatings: post.totalRatings || prevCurrentPost.totalRatings,
        };
      });
      setComments(post.comments || []);
      // Update rating if user has rated this post
      setRating(post.userRating || 0);
      // Update bookmark status
      setBookmarked(post.bookmarked || post.saved || false);
    }
  }, [post]);

  // Set up real-time updates via socket
  useEffect(() => {
    if (!isOpen || !authToken || !currentPost?._id) return;

    const socket = connectSocket(authToken);

    // Join a room specific to this post to receive updates
    socket.emit('join-post-room', currentPost._id);

    const handlePostUpdate = (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setCurrentPost(prevPost => {
          // Preserve comment updates but no need to preserve like fields since likes are removed
          return {
            ...updatedPost,
            comments: updatedPost.comments || [] // Comments can be updated from server
          };
        });
        setComments(updatedPost.comments || []);
      }
    };
    
    const handlePostDeletion = (deletedPostId) => {
      if (deletedPostId === currentPost._id) {
        // Close the post window if the current post was deleted
        onClose && onClose();
      }
    };
    
    socket.on('post-updated', handlePostUpdate);
    socket.on('post-bookmarked', handlePostUpdate);
    socket.on('new-comment', handlePostUpdate);
    socket.on('post-deleted', handlePostDeletion);

    // Cleanup function
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
      // The hook already handles optimistic updates and server sync
      // The parent will update accordingly through the callback
      onSave && onSave(currentPost._id, !bookmarked); // This should trigger parent component to update
    } catch (error) {
      console.error('Error handling bookmark:', error);
      // The hook already handles error recovery, so no additional action needed here
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
    
    // Use the parent's getDirections function to show directions in the map
    const position = [currentPost.location.latitude, currentPost.location.longitude];
    onGetDirections && onGetDirections(position);
    
    // Close the post window after getting directions
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
        // Update the rating state
        setRating(starRating);
        
        // Update the current post with new rating data
        setCurrentPost(prevPost => ({
          ...prevPost,
          averageRating: result.data?.averageRating || prevPost.averageRating || 0,
          totalRatings: result.data?.totalRatings || prevPost.totalRatings || 0,
          userRating: starRating // Store the user's rating
        }));
        
        // Call parent callback if provided
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
        // Optimistically update the UI with the new comment
        const newCommentObj = {
          _id: response.data?._id || `temp-${Date.now()}`, // Use server ID if available
          text: newComment,
          user: currentUser, // Use current user data
          createdAt: new Date().toISOString(), // Use current timestamp
          updatedAt: new Date().toISOString()
        };
        
        setComments(prevComments => [...prevComments, newCommentObj]);
        setNewComment('');
        
        // Update the current post's comment count
        setCurrentPost(prevPost => ({
          ...prevPost,
          comments: [...(prevPost.comments || []), newCommentObj],
          totalComments: (prevPost.totalComments || prevPost.comments?.length || 0) + 1
        }));
        
        // Close the modal after successful comment
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

  // Simple close handler
  const handleClose = () => {
    onClose && onClose(); 
  };

  // If not open, return nothing
  if (!isOpen || !currentPost) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-black/70 to-black/60 backdrop-blur-xl z-[99998] flex items-center justify-center p-2 sm:p-4 md:p-6 min-h-full"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3
          }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col z-[99999] border border-white/20 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center shadow-xl">
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}
              </h3>
              <p className="text-xs sm:text-sm opacity-90 flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatDate(currentPost.datePosted)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full sm:p-2.5 bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm shadow-lg"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="post-window-container flex flex-col flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Image Gallery */}
            <div className="w-full">
              <div className="relative">
                {hasImages && images.length > 0 ? (
                  <div className="post-window-image-container relative w-full h-48 sm:h-60 md:h-80 lg:h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="transition-transform duration-300 ease-out">
                        <OptimizedImage
                          src={getImageUrl(images[currentImageIndex])}
                          alt={currentPost.title || 'Post image'}
                          className="max-w-full max-h-full object-cover"
                          wrapperClassName="flex items-center justify-center"
                        />
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 transition-all shadow-lg z-10 border border-gray-200 backdrop-blur-sm"
                          aria-label="Previous image"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 text-gray-800" />
                        </button>
                        <button
                          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 sm:p-3 transition-all shadow-lg z-10 border border-gray-200 backdrop-blur-sm"
                          aria-label="Next image"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 sm:h-60 md:h-80 lg:h-96 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
                    <div className="text-center max-w-sm">
                      <div className="mx-auto w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-3 sm:mb-6 shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 sm:h-12 w-8 sm:w-12 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">No Images Available</h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        This post doesn't have any images yet. Check back later for updates!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {hasImages && images.length > 1 && (
                <div className="p-3 sm:p-5 bg-white/90 border-t border-gray-200 backdrop-blur-sm overflow-x-auto">
                  <div className="flex space-x-2 sm:space-x-3 pb-2">
                    {images.map((img, index) => {
                      const isSelected = currentImageIndex === index;

                      return (
                        <button
                          key={`thumb-${index}`}
                          onClick={() => {
                            setCurrentImageIndex(index);
                          }}
                          className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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
            <div className="bg-white">
              <div className="post-window-content p-4 sm:p-5 md:p-7">
                {showInfo ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 mb-4">
                      <h1 className="post-window-title text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0 leading-tight">
                        {currentPost.title || 'Untitled Post'}
                      </h1>
                      {currentPost.category && (
                        <span className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold inline-flex items-center shadow-sm border border-emerald-200">
                          <span className="capitalize">{currentPost.category}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{currentPost.description || 'No description available.'}</p>

                    {/* Location */}
                    {currentPost.location?.latitude && currentPost.location?.longitude && (
                      <div className="flex flex-col sm:flex-row items-start text-gray-700 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 sm:mr-4 flex-shrink-0 shadow-sm">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="w-full">
                          <p className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Location</p>
                          <p className="text-gray-700 text-sm sm:text-base break-all">
                            {currentPost.location.latitude.toFixed(6)}, {currentPost.location.longitude.toFixed(6)}
                          </p>
                          {currentPost.location.address && (
                            <p className="text-gray-600 text-xs sm:text-sm mt-1">{currentPost.location.address}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 mb-2 sm:mb-3">
                        <h3 className="font-bold text-base sm:text-lg text-gray-800">Ratings & Reviews</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`star-${star}`}
                              className={`w-5 h-5 sm:w-6 sm:h-6 cursor-pointer ${
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
                          <span className="ml-2 sm:ml-3 text-gray-800 font-bold text-base sm:text-lg">
                            {(currentPost.averageRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{currentPost.totalRatings || 0}</span>
                          <span className="mx-1 sm:mx-2 text-gray-400">•</span>
                          <span>{(currentPost.comments || []).length || 0} {(currentPost.comments || []).length === 1 ? 'comment' : 'comments'}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium">Rate this:</span>
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
                            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm ${
                              rating > 0
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={rating === 0 || !authToken}
                          >
                            {rating > 0 ? 'Submit Rating' : 'Select Stars'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 font-semibold">Posted By</p>
                        <p className="font-bold text-gray-800 text-sm sm:text-base">{typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 font-semibold">Posted On</p>
                        <p className="font-bold text-gray-800 text-sm sm:text-base">{formatDate(currentPost.datePosted)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="mb-6 p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                      <MapPin className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Information Hidden</h3>
                    <p className="text-gray-600 mb-4">Press 'I' key or close the window to show details again</p>
                    <button
                      onClick={() => setShowInfo(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md font-medium"
                    >
                      Show Information
                    </button>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="post-window-actions p-4 sm:p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <motion.button
                      onClick={handleComment}
                      className="flex items-center space-x-1 sm:space-x-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm text-xs sm:text-sm min-w-[60px] justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-semibold ml-1 sm:ml-2">{currentPost.comments?.length || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleBookmark}
                      disabled={loading} // Disable button when loading
                      className={`flex items-center space-x-1 sm:space-x-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-sm text-xs sm:text-sm min-w-[60px] justify-center ${
                        bookmarked
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                      } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bookmark
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${bookmarked ? "fill-current text-white" : ""}`}
                      />
                    </motion.button>
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0">
                    <motion.button
                      onClick={handleShare}
                      className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 bg-gradient-to-r from-white to-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-sm transition-all font-medium text-xs sm:text-sm min-w-[70px] justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline ml-1">Share</span>
                      <span className="sm:hidden">Share</span>
                    </motion.button>
                    <motion.button
                      onClick={handleGetDirections}
                      className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 bg-gradient-to-r from-white to-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-sm transition-all font-medium text-xs sm:text-sm min-w-[70px] justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline ml-1">Directions</span>
                      <span className="sm:hidden">Dir</span>
                    </motion.button>
                  </div>
                </div>

                {/* Comments Modal */}
                {showCommentsModal && (
                  <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/50 backdrop-blur-lg flex items-center justify-center z-[100000] p-2 sm:p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[80vh] flex flex-col border border-white/20 backdrop-blur-sm">
                      <div className="p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl sm:rounded-t-2xl">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Comments
                          </h3>
                          <button
                            onClick={() => setShowCommentsModal(false)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto max-h-48 sm:max-h-96 p-4 sm:p-5">
                        {comments && comments.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {comments.map((comment) => (
                              <CommentItem
                                key={comment._id || `comment-${Math.random()}`}
                                comment={comment}
                                authToken={authToken}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8">
                            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                            <p className="text-sm sm:text-base text-gray-500">No comments yet. Be the first to comment!</p>
                          </div>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="p-4 sm:p-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-xl sm:rounded-b-2xl">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment..."
                            className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm min-h-[42px]"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                          />
                          <motion.button
                            onClick={handleAddComment}
                            className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-md text-sm min-w-[80px] flex items-center justify-center"
                            whileTap={{ scale: 0.95 }}
                          >
                            Post
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostWindow;