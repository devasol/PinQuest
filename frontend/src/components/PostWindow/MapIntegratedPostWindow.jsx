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
  Navigation,
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api.js";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import CommentItem from './CommentItem'; // Import the new CommentItem component
import { useModal } from "../../contexts/ModalContext";
import { connectSocket } from "../../services/socketService";

const MapIntegratedPostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isAuthenticated, 
  isVisible, 
  onClose,
  onSave,
  onRate,
  onGetDirections,
  position
}) => {
  // Use the incoming post data directly instead of complex state management
  const [currentPost, setCurrentPost] = useState(post);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(post?.userRating || 0); // Use user's specific rating if available
  const [hoverRating, setHoverRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
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
    if (!isVisible || !authToken || !currentPost?._id) return;

    const socket = connectSocket(authToken);

    // Join a room specific to this post to receive updates
    socket.emit('join-post-room', currentPost._id);

    const handlePostUpdate = (updatedPost) => {
      if (updatedPost._id === currentPost._id) {
        setCurrentPost(prevPost => {
          // Preserve comment updates but no need to preserve like fields since likes are removed
          return {
            ...updatedPost,
            comments: updatedPost.comments || [], // Comments can be updated from server
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
      socket.off('post-deleted', handlePostUpdate);
      socket.emit('leave-post-room', currentPost._id);
    };
  }, [isVisible, authToken, currentPost?._id]);

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
        
        // Close the comment input after successful comment
        if (showComments && (prev => !prev)) {
          setShowComments(false);
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
    }
  };

  // If not visible, return nothing
  if (!isVisible || !currentPost) return null;

  // Calculate position based on map coordinates with better viewport constraints
  const calculatedPositionRef = React.useRef(null);
  const positionPropRef = React.useRef(null);
  
  const calculateAdjustedPosition = React.useCallback(() => {
    if (!position) return { top: '20px', left: '20px' };
    
    // Check if the position prop has changed, if so, reset the stored calculation
    if (positionPropRef.current !== position) {
      calculatedPositionRef.current = null;
      positionPropRef.current = position;
    }
    
    // Only calculate once and store in ref to prevent position changes during interactions
    if (calculatedPositionRef.current) {
      return calculatedPositionRef.current;
    }
    
    const clickTop = position.y;
    const clickLeft = position.x;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Modal dimensions 
    const modalWidth = 320; // Fixed width
    const modalHeight = 500; // Approximate height
    
    // Position the modal relative to the marker with better viewport constraints
    let adjustedTop = Math.max(20, clickTop - modalHeight/2); // Position near the marker
    let adjustedLeft = Math.max(20, clickLeft + 30); // Position to the right of the marker
    
    // Ensure modal stays within viewport bounds - adjust for right edge
    if (adjustedLeft + modalWidth > viewportWidth - 20) {
      // If positioned to the right would go off screen, position to the left
      adjustedLeft = Math.max(20, clickLeft - modalWidth - 10);
    }
    
    // Ensure modal stays within viewport bounds - adjust for bottom edge
    if (adjustedTop + modalHeight > viewportHeight - 20) {
      adjustedTop = Math.max(20, viewportHeight - modalHeight - 20);
    }
    
    // Ensure modal stays within viewport bounds - if too far left after adjustment
    if (adjustedLeft < 20) {
      adjustedLeft = 20;
    }
    
    // Final safety check to ensure modal doesn't overlap the click point
    if (adjustedTop >= clickTop - 10 && adjustedTop <= clickTop + 10 && adjustedLeft >= clickLeft - 10 && adjustedLeft <= clickLeft + 10) {
      adjustedTop = Math.max(20, clickTop - 120); // Ensure it's well above the marker
    }
    
    // Store the calculated position to prevent recalculation during interactions
    const calculatedPos = { 
      top: `${adjustedTop}px`,
      left: `${adjustedLeft}px`
    };
    calculatedPositionRef.current = calculatedPos;
    return calculatedPos;
  }, [position]); // Only recalculate when position changes
  
  // Use the memoized position calculation
  const adjustedPosition = calculateAdjustedPosition();

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed', // Use fixed positioning for better map experience
          top: adjustedPosition.top,
          left: adjustedPosition.left,
          zIndex: 10000, // Higher z-index for map overlays
          maxWidth: '350px',
          minWidth: '300px'
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm">
              {typeof currentPost.postedBy === 'object' ? currentPost.postedBy.name : currentPost.postedBy || "Anonymous"}
            </h3>
            <p className="text-xs opacity-90 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(currentPost.datePosted)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Image Gallery */}
          <div className="w-full">
            <div className="relative">
              {hasImages && images.length > 0 ? (
                <div className="relative w-full h-48 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
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
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 transition-all shadow-lg z-10 border border-gray-200 backdrop-blur-sm"
                        aria-label="Previous image"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-800" />
                      </button>
                      <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 transition-all shadow-lg z-10 border border-gray-200 backdrop-blur-sm"
                        aria-label="Next image"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-800" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                  <div className="text-center max-w-xs">
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
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
                    <p className="text-sm text-gray-600">
                      No Images Available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post Details */}
          <div className="p-4">
            {showInfo ? (
              <>
                <div className="flex flex-col items-start justify-between gap-2 mb-3">
                  <h1 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {currentPost.title || 'Untitled Post'}
                  </h1>
                  {currentPost.category && (
                    <span className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center shadow-sm border border-emerald-200">
                      <span className="capitalize">{currentPost.category}</span>
                    </span>
                  )}
                </div>

                <p className="text-gray-700 mb-3 text-sm leading-relaxed">{currentPost.description || 'No description available.'}</p>

                {/* Location */}
                {currentPost.location?.latitude && currentPost.location?.longitude && (
                  <div className="flex text-gray-700 mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-sm text-gray-800">Location</p>
                      <p className="text-sm text-gray-700 break-all">
                        {currentPost.location.latitude.toFixed(6)}, {currentPost.location.longitude.toFixed(6)}
                      </p>
                      {currentPost.location.address && (
                        <p className="text-xs text-gray-600 mt-1">{currentPost.location.address}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Ratings */}
                <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-800">Ratings</h3>
                    <div className="flex items-center">
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
                      <span className="ml-2 text-gray-800 font-bold text-sm">
                        {(currentPost.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{currentPost.totalRatings || 0}</span> 
                      <span className="mx-2">•</span>
                      <span>{(currentPost.comments || []).length || 0} {(currentPost.comments || []).length === 1 ? 'comment' : 'comments'}</span>
                    </p>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        rating > 0 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-sm hover:shadow-md' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={rating === 0 || !authToken}
                    >
                      {rating > 0 ? 'Submit Rating' : 'Rate'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                  <MapPin className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Info Hidden</h3>
                <button 
                  onClick={() => setShowInfo(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  Show Info
                </button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={handleComment}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-semibold">{currentPost.comments?.length || 0}</span>
                </motion.button>

                <motion.button
                  onClick={handleBookmark}
                  disabled={loading}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all text-sm ${
                    bookmarked
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-sm hover:shadow-md"
                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
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
                  className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 bg-gradient-to-r from-white to-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
                </motion.button>
                <motion.button
                  onClick={handleGetDirections}
                  className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 bg-gradient-to-r from-white to-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:shadow-sm transition-all text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Dir</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 bg-gray-50"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800">Comments</h3>
                </div>
                
                {/* Comments List */}
                <div className="p-4 max-h-48 overflow-y-auto">
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
                    <div className="text-center py-4">
                      <MessageCircle className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No comments yet</p>
                    </div>
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment..."
                      className="flex-1 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <motion.button
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium text-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      Post
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </motion.div>
      </AnimatePresence>
      );
    };

export default MapIntegratedPostWindow;