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
  Clock,
  Minus,
  Plus,
  ExternalLink,
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import './PostWindow.css';

const PostWindow = ({ 
  post, 
  currentUser, 
  authToken, 
  isOpen, 
  onClose,
  onLike,
  onComment
}) => {
  const [liked, setLiked] = useState(
    post?.likes && post?.likes.some((like) => like.user === currentUser?._id)
  );
  const [likeCount, setLikeCount] = useState(post?.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(
    currentUser?.favorites?.some((fav) => fav.post === post?._id)
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showImageControls, setShowImageControls] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const images = useMemo(() => post?.images || (post?.image ? [post.image] : []), [post?.images, post?.image]);

  // Preload images to improve user experience
  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach(img => {
        const imgElement = new Image();
        imgElement.src = getImageUrl(img);
      });
    }
  }, [images]);

  // Fetch ratings for the post
  useEffect(() => {
    const fetchRatings = async () => {
      if (!post?._id) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts/${post._id}/ratings`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setAverageRating(data.averageRating || 0);
          setTotalRatings(data.totalRatings || 0);
        } else {
          setAverageRating(0);
          setTotalRatings(0);
        }
      } catch (err) {
        setAverageRating(0);
        setTotalRatings(0);
      }
    };

    fetchRatings();
  }, [post?._id]);

  const handleLike = async () => {
    if (!authToken) {
      alert("Please login to like posts");
      return;
    }

    const result = await (liked 
      ? postApi.unlikePost(post._id, authToken)
      : postApi.likePost(post._id, authToken)
    );

    if (result.success) {
      setLiked(!liked);
      setLikeCount(result.data?.likesCount || (likeCount + (liked ? -1 : 1)));
      
      // Trigger like animation
      if (!liked) {
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 1000);
      }
      
      onLike && onLike(post._id, !liked);
    } else {
      // Revert the state if the API call failed
      setLiked(prev => !prev);
      setLikeCount(prev => prev + (liked ? 1 : -1));
    }
  };

  const handleBookmark = async () => {
    if (!authToken) {
      alert("Please login to bookmark posts");
      return;
    }

    let result;
    if (bookmarked) {
      result = await userApi.removeFavorite(post._id, authToken);
      if (result.success) {
        setBookmarked(false);
      }
    } else {
      result = await userApi.addFavorite(post._id, authToken);
      if (result.success) {
        setBookmarked(true);
      }
    }
  };

  const handleComment = () => {
    onComment && onComment(post._id);
  };

  const nextImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === images.length - 1 ? 0 : prev + 1
      );
      // Reset zoom when switching images
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [images]);

  const prevImage = useCallback(() => {
    if (images && images.length > 0) {
      setCurrentImageIndex(prev => 
        prev === 0 ? images.length - 1 : prev - 1
      );
      // Reset zoom when switching images
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [images]);

  // Image zoom handlers
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.2, 1));
  };

  const handleDragStart = (e) => {
    if (imageScale <= 1) return;
    
    setIsDragging(true);
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    setDragStart({
      x: clientX - imagePosition.x,
      y: clientY - imagePosition.y
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging || imageScale <= 1) return;

    e.preventDefault();
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

    setImagePosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Auto-hide image controls
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      setShowImageControls(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isOpen, currentImageIndex]);

  const handleImageMouseMove = () => {
    setShowImageControls(true);
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      setShowImageControls(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, nextImage, prevImage]);

  // Reset image position when scale changes
  useEffect(() => {
    if (imageScale <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  }, [imageScale]);

  // Handle sharing the post
  const handleShare = () => {
    if (navigator.share) {
      // Web Share API is supported
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback: Copy link to clipboard
      const postUrl = `${window.location.origin}/post/${post._id}`;
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Post link copied to clipboard!');
      }).catch(() => {
        // If clipboard API fails, fallback to prompt
        prompt('Copy this link:', postUrl);
      });
    }
  };

  // Handle getting directions to the post location
  const handleGetDirections = () => {
    if (!post.location || !post.location.latitude || !post.location.longitude) {
      alert('Location information is not available for this post.');
      return;
    }
    
    // Create a Google Maps directions URL
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${post.location.latitude},${post.location.longitude}`;
    window.open(directionsUrl, '_blank');
  };

  // Handle rating submission
  const handleRate = async (starRating) => {
    if (!authToken) {
      alert('Please login to rate posts');
      return;
    }

    if (!post?._id) {
      console.error('Post ID is missing for rating');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts/${post._id}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          rating: starRating
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Update the rating state to reflect the new rating
        setRating(starRating);
        // Refetch average rating to update display
        const ratingResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/posts/${post._id}/ratings`);
        const ratingData = await ratingResponse.json();
        
        if (ratingData.status === 'success') {
          setAverageRating(ratingData.averageRating || 0);
          setTotalRatings(ratingData.totalRatings || 0);
        }
        
        alert('Thank you for rating this post!');
      } else {
        console.error('Error submitting rating:', result.message);
        alert('Error submitting rating. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Error submitting rating. Please try again.');
    }
  };

  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{ minHeight: '600px' }}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-cyan-600/90 backdrop-blur-sm text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center space-x-4">
              {post.postedBy?.avatar ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <OptimizedImage
                    src={post.postedBy.avatar.url}
                    alt={post.postedBy.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-2 border-white shadow-md">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">
                  {post.postedBy?.name || "Anonymous"}
                </h3>
                <p className="text-sm opacity-90 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {formatDate(post.datePosted)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200 backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white">
            {/* Image Gallery */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="relative flex-1 bg-white/20 backdrop-blur-sm">
                {images && images.length > 0 ? (
                  <div 
                    className="relative w-full h-full flex items-center justify-center"
                    onMouseMove={handleImageMouseMove}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab"
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      style={{ cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                      onTouchStart={(e) => {
                        if (imageScale <= 1) return;
                        setIsDragging(true);
                        setDragStart({
                          x: e.touches[0].clientX - imagePosition.x,
                          y: e.touches[0].clientY - imagePosition.y
                        });
                      }}
                      onTouchMove={(e) => {
                        if (!isDragging || imageScale <= 1) return;
                        e.preventDefault();
                        setImagePosition({
                          x: e.touches[0].clientX - dragStart.x,
                          y: e.touches[0].clientY - dragStart.y
                        });
                      }}
                      onTouchEnd={handleDragEnd}
                    >
                      <div 
                        className="transition-transform duration-200 ease-out"
                        style={{
                          transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                        }}
                      >
                        <OptimizedImage
                          src={getImageUrl(images[currentImageIndex])}
                          alt={post.title}
                          className="max-w-full max-h-full object-contain"
                          wrapperClassName="flex items-center justify-center"
                        />
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && showImageControls && (
                      <>
                        <motion.button
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all shadow-lg z-10 backdrop-blur-sm border border-white border-opacity-50"
                          aria-label="Previous image"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </motion.button>
                        <motion.button
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all shadow-lg z-10 backdrop-blur-sm border border-white border-opacity-50"
                          aria-label="Next image"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </motion.button>
                      </>
                    )}

                    {/* Zoom Controls */}
                    {showImageControls && (
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-4 right-4 flex flex-col space-y-3 z-10"
                      >
                        <button
                          onClick={handleZoomIn}
                          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all backdrop-blur-sm border border-white border-opacity-50"
                          aria-label="Zoom in"
                        >
                          <Plus className="w-4 h-4 text-gray-800" />
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all backdrop-blur-sm border border-white border-opacity-50"
                          aria-label="Zoom out"
                        >
                          <Minus className="w-4 h-4 text-gray-800" />
                        </button>
                      </motion.div>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
                      >
                        {currentImageIndex + 1} / {images.length}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-8">
                    <div className="text-center max-w-sm">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
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
              {images.length > 1 && (
                <div className="p-5 bg-white/30 backdrop-blur-sm border-t border-gray-200">
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setImageScale(1);
                          setImagePosition({ x: 0, y: 0 });
                        }}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-200 ${
                          currentImageIndex === index 
                            ? 'border-emerald-500 shadow-lg scale-105' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <OptimizedImage
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Post Details */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="p-7 overflow-y-auto flex-1 bg-white/20 backdrop-blur-sm">
                {showInfo ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between mb-5">
                      <h1 className="text-3xl font-bold text-gray-900 mb-3 lg:mb-0 lg:mr-4 leading-tight">
                        {post.title}
                      </h1>
                      {post.category && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm px-5 py-2 rounded-full font-medium shadow-md inline-flex items-center">
                          <span className="capitalize">{post.category}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-7 leading-relaxed text-lg">{post.description}</p>

                    {/* Location */}
                    {post.location?.latitude && post.location?.longitude && (
                      <div className="flex items-start text-gray-700 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 mb-1">Location</p>
                          <p className="text-gray-700">
                            {post.location.latitude.toFixed(6)}, {post.location.longitude.toFixed(6)}
                          </p>
                          {post.location.address && (
                            <p className="text-gray-600 text-sm mt-1">{post.location.address}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ratings */}
                    <div className="mb-7 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-800">Ratings & Reviews</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 cursor-pointer ${
                                star <= (hoverRating || Math.round(averageRating)) 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              onClick={() => handleRate(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            />
                          ))}
                          <span className="ml-3 text-gray-800 font-bold text-lg">
                            {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 flex items-center">
                        <span className="font-medium">{totalRatings}</span> 
                        <span className="mx-2">•</span>
                        <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}</span>
                      </p>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Posted By</p>
                        <p className="font-bold text-gray-800 text-lg">{post.postedBy?.name || "Anonymous"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Posted On</p>
                        <p className="font-bold text-gray-800 text-lg">{formatDate(post.datePosted)}</p>
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
              <div className="p-5 border-t border-gray-200 bg-white/30 backdrop-blur-sm shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-5">
                    <motion.button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all relative ${
                        liked 
                          ? "bg-red-100 text-red-600 shadow-sm" 
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
                      <span className="font-bold relative z-10">{likeCount}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleComment}
                      className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-bold">{post.comments?.length || 0}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleBookmark}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                        bookmarked
                          ? "bg-yellow-100 text-yellow-600 shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bookmark
                        className={`w-6 h-6 ${bookmarked ? "fill-current" : ""}`}
                      />
                    </motion.button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={handleShare}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 bg-white px-5 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share className="w-5 h-5" />
                      <span className="font-medium">Share</span>
                    </motion.button>
                    <motion.button
                      onClick={handleGetDirections}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 bg-white px-5 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="font-medium">Get Directions</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostWindow;