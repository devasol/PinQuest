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
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import usePostInteractions from "../../hooks/usePostInteractions";
import CommentItem from './CommentItem'; // Import the new CommentItem component
import { connectSocket } from "../../services/socketService";
import './PostWindow.css';

const PostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isAuthenticated, 
  isOpen, 
  onClose,
  onLike,
  onComment,
  onSave,
  onRate,
  onGetDirections
}) => {
  // Use the incoming post data directly instead of complex state management
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(false);

  // Initialize from hook for interaction states (using currentPost state)
  const {
    liked,
    likeCount,
    bookmarked,
    handleLike: handleLikeFromHook,
    handleBookmark: handleBookmarkFromHook,
    refreshPostStatus
  } = usePostInteractions(currentPost, currentUser || null, authToken, isAuthenticated);

  // Update currentPost when the post prop changes, but be careful not to override interaction states
  useEffect(() => {
    if (post) {
      // Preserve current interaction states if they exist in currentPost
      setCurrentPost(prevCurrentPost => {
        // Only update non-interaction fields, preserving the interaction states managed by the hook
        if (!prevCurrentPost || post._id !== prevCurrentPost._id) {
          // If switching to a different post, use the new post data completely
          return post;
        } else {
          // If the same post but with updated data, merge preserving UI state from hook
          // but taking the new data from the post
          return {
            ...post,
            // Preserve the current state values that might have been updated by user interactions
            // The actual interaction states (like, bookmark) are handled by the hook separately
            ...prevCurrentPost
          };
        }
      });
      setComments(post.comments || []);
    }
  }, [post]);

  // Refresh interaction status when component opens or post changes
  useEffect(() => {
    if (isOpen && currentPost && refreshPostStatus) {
      // Refresh interaction states when currentPost changes or component opens
      refreshPostStatus();
    }
  }, [isOpen, currentPost, refreshPostStatus]);

  // Set up real-time updates via socket
  useEffect(() => {
    if (!isOpen || !authToken || !currentPost?._id || !refreshPostStatus) return;

    const socket = connectSocket(authToken);

    // Join a room specific to this post to receive updates
    socket.emit('join-post-room', currentPost._id);

    // Listen for post updates
    socket.on('post-updated', (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setCurrentPost(updatedPost);
        setComments(updatedPost.comments || []);
        // Refresh interaction states to reflect updates
        refreshPostStatus();
      }
    });

    // Listen for like updates
    socket.on('post-liked', (likeData) => {
      if (likeData.postId === currentPost._id) {
        // Refresh the post data to get updated like count
        refreshPostStatus();
      }
    });

    // Listen for bookmark updates
    socket.on('post-bookmarked', (bookmarkData) => {
      if (bookmarkData.postId === currentPost._id) {
        // Refresh the post data to get updated bookmark status
        refreshPostStatus();
      }
    });

    // Listen for comment updates
    socket.on('new-comment', (commentData) => {
      if (commentData.postId === currentPost._id) {
        // Refresh to get the new comment count
        refreshPostStatus();
      }
    });

    // Cleanup function
    return () => {
      socket.off('post-updated');
      socket.off('post-liked');
      socket.off('post-bookmarked');
      socket.off('new-comment');
      // Optionally leave the post room
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isOpen, authToken, currentPost?._id, refreshPostStatus]);

  // Create stable images array
  const hasImages = useMemo(() => {
    return currentPost && ((currentPost.images && currentPost.images.length > 0) || currentPost.image);
  }, [currentPost?.images, currentPost?.image]);

  const images = useMemo(() => {
    if (!currentPost) return [];
    const result = currentPost?.images || (currentPost?.image ? [currentPost.image] : []);
    return [...result];
  }, [currentPost?.images, currentPost?.image, currentPost?.image]);

  // Navigation functions for images
  const nextImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === images.length - 1 ? 0 : prev + 1
      );
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [images]);

  const prevImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === 0 ? images.length - 1 : prev - 1
      );
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [images]);

  // Interaction handlers
  const handleLike = async () => {
    if (!authToken) {
      alert("Please login to like posts");
      return;
    }

    try {
      if (!liked) {
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 1000);
      }
      await handleLikeFromHook();
      // Refresh the post status to ensure UI immediately reflects the change
      setTimeout(() => refreshPostStatus(), 100);
      onLike && onLike(currentPost._id, !liked); // This should trigger parent component to update
    } catch (error) {
      console.error('Error handling like:', error);
      // The hook already handles error recovery, so no additional action needed here
    }
  };

  const handleBookmark = async () => {
    if (!authToken) {
      alert("Please login to bookmark posts");
      return;
    }

    try {
      await handleBookmarkFromHook();
      // Refresh the post status to ensure UI immediately reflects the change
      setTimeout(() => refreshPostStatus(), 100);
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
        alert('Post link copied to clipboard!');
      });
    }
  };

  const handleGetDirections = () => {
    if (!currentPost.location || !currentPost.location.latitude || !currentPost.location.longitude) {
      alert('Location information is not available for this post.');
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
      alert('Please login to rate posts');
      return;
    }

    if (!currentPost?._id) return;

    try {
      const result = await postApi.addRating(currentPost._id, { rating: starRating }, authToken);

      if (result.success) {
        setRating(starRating);
        // Call parent callback if provided
        if (onRate && typeof onRate === 'function') {
          onRate(currentPost._id, result.data?.averageRating || 0, result.data?.totalRatings || 0);
        }
        alert('Thank you for rating this post!');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleAddComment = async () => {
    if (!authToken) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim() || !currentPost?._id) return;

    try {
      const response = await postApi.addComment(currentPost._id, { text: newComment }, authToken);

      if (response.success) {
        setNewComment('');
        // Simple approach: refetch the post to get updated comments
        if (authToken) {
          const updatedResponse = await postApi.getPostById(currentPost._id, authToken);
          if (updatedResponse.success && updatedResponse.data) {
            setCurrentPost(updatedResponse.data);
            setComments(updatedResponse.data.comments || []);
          }
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[6000] flex items-center justify-center p-4"
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
          className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col z-[6001] border border-gray-200/50"
          onClick={(e) => e.stopPropagation()}
          style={{ minHeight: '600px' }}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center shadow-lg">
            <div>
              <h3 className="font-bold text-lg">
                {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}
              </h3>
              <p className="text-sm opacity-90 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                {formatDate(currentPost.datePosted)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white">
            {/* Image Gallery */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="relative flex-1">
                {hasImages && images.length > 0 ? (
                  <div className="relative w-full h-80 md:h-96 lg:h-full flex items-center justify-center bg-gray-50">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="transition-transform duration-200 ease-out">
                        <OptimizedImage
                          src={getImageUrl(images[currentImageIndex])}
                          alt={currentPost.title || 'Post image'}
                          className="max-w-full max-h-full object-contain"
                          wrapperClassName="flex items-center justify-center"
                        />
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-3 transition-all shadow-lg z-10 border border-gray-200"
                          aria-label="Previous image"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full p-3 transition-all shadow-lg z-10 border border-gray-200"
                          aria-label="Next image"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 text-gray-800 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-gray-200">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-80 md:h-96 lg:h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                    <div className="text-center max-w-sm">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-500"
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
                      <h3 className="text-xl font-bold text-gray-800 mb-2">No Images Available</h3>
                      <p className="text-gray-600">
                        This post doesn't have any images yet. Check back later for updates!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {hasImages && images.length > 1 && (
                <div className="p-5 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {images.map((img, index) => {
                      const isSelected = currentImageIndex === index;
                      
                      return (
                        <button
                          key={`thumb-${index}`} 
                          onClick={() => {
                            setCurrentImageIndex(index);
                          }}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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
            <div className="lg:w-1/2 flex flex-col">
              <div className="p-7 overflow-y-auto flex-1">
                {showInfo ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between mb-5">
                      <h1 className="text-2xl font-bold text-gray-900 mb-3 lg:mb-0 lg:mr-4 leading-tight">
                        {currentPost.title || 'Untitled Post'}
                      </h1>
                      {currentPost.category && (
                        <span className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1.5 rounded-full font-medium inline-flex items-center">
                          <span className="capitalize">{currentPost.category}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-6 leading-relaxed">{currentPost.description || 'No description available.'}</p>

                    {/* Location */}
                    {currentPost.location?.latitude && currentPost.location?.longitude && (
                      <div className="flex items-start text-gray-700 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 mb-1">Location</p>
                          <p className="text-gray-700">
                            {currentPost.location.latitude.toFixed(6)}, {currentPost.location.longitude.toFixed(6)}
                          </p>
                          {currentPost.location.address && (
                            <p className="text-gray-600 text-sm mt-1">{currentPost.location.address}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex flex-wrap items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-800">Ratings & Reviews</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`star-${star}`}
                              className={`w-6 h-6 cursor-pointer ${
                                star <= (rating > 0 ? rating : (hoverRating || currentPost.averageRating || 0)) 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              onClick={() => {
                                if (authToken) {
                                  setRating(star);
                                } else {
                                  alert('Please login to rate posts');
                                }
                              }}
                              onMouseEnter={() => rating === 0 && setHoverRating(star)}
                              onMouseLeave={() => rating === 0 && setHoverRating(0)}
                            />
                          ))}
                          <span className="ml-3 text-gray-800 font-bold">
                            {(currentPost.averageRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-gray-600">
                          <span className="font-medium">{currentPost.totalRatings || 0}</span> 
                          <span className="mx-2">•</span>
                          <span>{currentPost.comments?.length || 0} {currentPost.comments?.length === 1 ? 'comment' : 'comments'}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Rate this:</span>
                          <button
                            onClick={() => {
                              if (rating > 0) {
                                handleRate(rating);
                              } else {
                                alert('Please select a rating first');
                              }
                            }}
                            className={`px-4 py-2 rounded-lg transition-all ${
                              rating > 0 
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={rating === 0}
                          >
                            {rating > 0 ? 'Submit Rating' : 'Select Stars'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Posted By</p>
                        <p className="font-bold text-gray-800">{typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Posted On</p>
                        <p className="font-bold text-gray-800">{formatDate(currentPost.datePosted)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="mb-6 p-4 bg-gray-100 rounded-full">
                      <MapPin className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Information Hidden</h3>
                    <p className="text-gray-600 mb-4">Press 'I' key or close the window to show details again</p>
                    <button 
                      onClick={() => setShowInfo(true)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Show Information
                    </button>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-5 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <motion.button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all relative ${
                        liked 
                          ? "bg-red-100 text-red-600" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      whileTap={{ scale: 0.95 }}
                      animate={likeAnimation ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {likeAnimation && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 1 }}
                        >
                          <Heart className="w-6 h-6 text-red-300" />
                        </motion.div>
                      )}
                      <Heart className={`w-6 h-6 relative z-10 ${liked ? "fill-current" : ""}`} />
                      <span className="font-bold relative z-10">
                        {likeCount || 0}
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={handleComment}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-bold">{currentPost.comments?.length || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleBookmark}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
                        bookmarked
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bookmark
                        className={`w-6 h-6 ${bookmarked ? "fill-current" : ""}`}
                      />
                    </motion.button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={handleShare}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </motion.button>
                    <motion.button
                      onClick={handleGetDirections}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="font-medium">Directions</span>
                    </motion.button>
                  </div>
                </div>
                
                {/* Comments Modal */}
                {showCommentsModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[6002] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200">
                      <div className="p-5 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-bold text-gray-800">Comments</h3>
                          <button 
                            onClick={() => setShowCommentsModal(false)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto max-h-96 p-5">
                        {comments && comments.length > 0 ? (
                          <div className="space-y-4">
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
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Input */}
                      <div className="p-5 border-t border-gray-200">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                          />
                          <motion.button
                            onClick={handleAddComment}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
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