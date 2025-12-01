import React, { useState, useEffect } from 'react';
import { postApi } from '../services/api';

const RatingsAndComments = ({ postId, isAuthenticated: authState, user }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState(null); // Track the current user's rating
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  // Track optimistic updates to preserve them during server refreshes
  const [optimisticLikes, setOptimisticLikes] = useState(new Map()); // Map of commentId -> new likes count (will be removed)
  






  // Fetch existing ratings and comments by getting the full post data
  useEffect(() => {
    const fetchPostDetails = async (showLoading = true) => {
      if (!postId) return;
      
      try {
        if (showLoading) setLoading(true);
        
        // First, try to load from local storage as fallback data
        const localStorageKey = `post_${postId}_ratings`;
        const storedData = localStorage.getItem(localStorageKey);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            // Set the comments with proper formatting
            const formattedComments = (parsedData.comments || []).map(comment => {
              // Check if the current user has liked this comment
              const hasUserLiked = (comment.likes || []).some(like => {
                const likeUserId = typeof like.user === 'object' ? like.user._id : like.user;
                const currentUserId = typeof user === 'object' ? (user._id || user.id) : user;
                return likeUserId && currentUserId && likeUserId.toString() === currentUserId.toString();
              }) || false;

              return {
                ...comment,
                likes: comment.likes || [],
                userHasLiked: hasUserLiked // Add the userHasLiked property
              };
            });
            setComments(formattedComments);
            setAverageRating(parsedData.averageRating || 0);
            setTotalRatings(parsedData.totalRatings || 0);
            setUserRating(parsedData.userRating || null);
          } catch (err) {
            console.error('Error parsing stored data:', err);
          }
        }

        // Get token from local storage
        const token = localStorage.getItem('token');
        
        // Fetch the entire post to get any existing ratings or comments
        const result = await postApi.getPostById(postId, token);
        
        if (result.success) {
          const post = result.data;
          
          let average = 0; // Initialize to 0 to ensure it's defined
          let total = 0;
          let currentUserRating = null; // Initialize here to avoid 'not defined' error
          
          // Extract ratings data if it exists in the post
          if (post.ratings) {
            const ratings = post.ratings;
            total = ratings.length;
            average = total > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / total : 0;
            
            // Check if current user has rated this post
            if (authState && user && post.ratings && Array.isArray(post.ratings)) {
              const userRatingObj = post.ratings.find(r => {
                // Check if rating.user is an object with _id or just the ObjectId string
                const ratingUserId = typeof r.user === 'object' ? r.user._id : r.user;
                const currentUserId = typeof user === 'object' ? (user._id || user.id) : user;
                return ratingUserId && currentUserId && ratingUserId.toString() === currentUserId.toString();
              });
              
              if (userRatingObj) {
                currentUserRating = userRatingObj.rating;
                setRating(currentUserRating); // Set the rating state to the user's existing rating
              }
            }
            
            setAverageRating(average);
            setTotalRatings(total);
            setUserRating(currentUserRating);
          } else if (post.averageRating !== undefined) {
            setAverageRating(post.averageRating);
            setTotalRatings(post.totalRatings || 0);
            // We don't have user-specific rating data here, so we need to fetch it separately
            // or rely on local storage
            average = post.averageRating;
            total = post.totalRatings || 0;
          }

          // Extract comments data if it exists in the post - handle different data structures
          let loadedComments = (post.comments || post.userComments || []).map(comment => {
            // Check if the current user has liked this comment
            const hasUserLiked = (comment.likes || []).some(like => {
              const likeUserId = typeof like.user === 'object' ? like.user._id : like.user;
              const currentUserId = typeof user === 'object' ? (user._id || user.id) : user;
              return likeUserId && currentUserId && likeUserId.toString() === currentUserId.toString();
            }) || false;

            // Check if comment.user is an object with an _id but no name field
            let processedUser = comment.user;
            if (comment.user && typeof comment.user === 'object') {
              // If user object has name fields, use it as is
              if (comment.user.name || comment.user.displayName) {
                processedUser = comment.user;
              } else if (comment.username) {
                // If user object exists but lacks name, but username is available, prioritize username
                processedUser = { name: comment.username };
              } else if (comment.postedBy) {
                // Else, use postedBy
                processedUser = { name: comment.postedBy };
              } else {
                // Otherwise, try to get a name from the user object
                processedUser = {
                  name: comment.user.name || comment.user.displayName || comment.user.email?.split('@')[0] || 
                        (comment.user._id ? `User_${comment.user._id.substring(0, 8)}` : 'Anonymous'),
                  ...comment.user
                };
              }
            } else if (!comment.user && (comment.username || comment.postedBy)) {
              // If no user object but username/postedBy exist, create a simple user object
              processedUser = { name: comment.username || comment.postedBy };
            } else if (!comment.user) {
              // Otherwise, default to anonymous
              processedUser = { name: 'Anonymous' };
            }
            
            return {
              ...comment,
              _id: comment._id || comment.id,
              text: comment.text || comment.content,
              user: processedUser,
              date: comment.date || comment.createdAt || comment.datePosted,
              likes: comment.likes || [],
              likesCount: comment.likesCount || (comment.likes && Array.isArray(comment.likes) ? comment.likes.length : 0) || 0,
              userHasLiked: hasUserLiked // Add the userHasLiked property
            };
          });
          
          // Apply optimistic updates to the server comments
          loadedComments = loadedComments.map(comment => {
            const commentId = comment._id?.toString() || comment.id?.toString();
            if (!commentId) return comment;
            
            let updatedComment = { ...comment };
            
            // Apply optimistic like updates if any
            if (optimisticLikes.has(commentId)) {
              const optimisticLikeDelta = optimisticLikes.get(commentId);
              updatedComment.likesCount = (updatedComment.likesCount || 0) + optimisticLikeDelta;
            }
            
            return updatedComment;
          });
          
          setComments(loadedComments);
          
          // Store in local storage for persistence
          const localStorageKey = `post_${postId}_ratings`;
          
          // Store fresh server data in localStorage (without optimistic updates to avoid duplication)
          const dataToStore = {
            comments: loadedComments,
            averageRating: average,
            totalRatings: total,
            userRating: currentUserRating
          };
          localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
        } else {
          // If API call fails but we have stored data, continue with that
          if (!storedData) {
            // Fallback to defaults if API call fails and no stored data
            setComments([]);
            setAverageRating(0);
            setTotalRatings(0);
            setUserRating(null);
          }
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        // Fallback to stored data or defaults if there's an error
        const localStorageKey = `post_${postId}_ratings`;
        const storedData = localStorage.getItem(localStorageKey);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            setComments(parsedData.comments || []);
            setAverageRating(parsedData.averageRating || 0);
            setTotalRatings(parsedData.totalRatings || 0);
            setUserRating(parsedData.userRating || null);
            // Set rating to user's previous rating if they had one
            if (parsedData.userRating) {
              setRating(parsedData.userRating);
            }
          } catch (parseErr) {
            console.error('Error parsing stored data:', parseErr);
            setComments([]);
            setAverageRating(0);
            setTotalRatings(0);
            setUserRating(null);
          }
        } else {
          setComments([]);
          setAverageRating(0);
          setTotalRatings(0);
          setUserRating(null);
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchPostDetails();

    // Set up interval to periodically refresh comments (simulating real-time updates)
    const refreshInterval = setInterval(() => {
      // Only refresh if the comments modal is open to avoid unnecessary API calls
      if (showCommentsModal) {
        fetchPostDetails(false); // Don't show loading indicator for auto-refresh
      }
    }, 60000); // Refresh every 60 seconds to reduce conflicts with user interactions and give more time for server to sync

    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [postId, authState, user, showCommentsModal]);

  // Apply optimistic updates to the current comments when optimistic data changes
  useEffect(() => {
    if (!comments.length) return; // Skip if no comments yet
    
    setComments(prevComments => {
      return prevComments.map(comment => {
        const commentId = comment._id?.toString() || comment.id?.toString();
        if (!commentId) return comment;
        
        let updatedComment = { ...comment };
        
        // Apply optimistic like updates if any
        if (optimisticLikes.has(commentId)) {
          const optimisticLikeDelta = optimisticLikes.get(commentId);
          updatedComment.likesCount = (updatedComment.likesCount || 0) + optimisticLikeDelta;
        }
        

        
        // Preserve the userHasLiked property (don't change it with optimistic updates)
        updatedComment.userHasLiked = comment.userHasLiked;
        
        return updatedComment;
      });
    });
  }, [optimisticLikes, comments.length]); // Only run when optimistic data or initial comments change

  const handleRatingSubmit = async () => {
    if (!authState || !user || rating <= 0) {
      setError('You must be logged in to rate');
      return;
    }

    setRatingSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Submit the rating using the API service
      const result = await postApi.addRating(postId, { rating }, token);

      if (result.success) {
        const newAverageRating = result.data.averageRating || rating;
        const newTotalRatings = result.data.totalRatings || 1;

        // Update state
        setAverageRating(newAverageRating);
        setTotalRatings(newTotalRatings);
        setUserRating(rating); // Set the user's current rating
        setError(null);

        // Save to local storage to persist after refresh
        const localStorageKey = `post_${postId}_ratings`;
        const currentStored = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
        const dataToStore = {
          comments: currentStored.comments || comments,
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
          userRating: rating
        };
        localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
      } else {
        // If submission fails, calculate locally
        const newTotalRatings = totalRatings + 1;
        const newAverageRating = ((averageRating * totalRatings) + rating) / newTotalRatings;
        
        setAverageRating(newAverageRating);
        setTotalRatings(newTotalRatings);
        setUserRating(rating);
        setError(null);
      }

    } catch (err) {
      setError(err.message || 'Failed to submit rating');
      console.error('Error submitting rating:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!authState || !user || !comment.trim()) {
      setError('You must be logged in to comment');
      return;
    }

    setCommentSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Submit the comment using the API service
      const result = await postApi.addComment(postId, { 
        content: comment.trim(),
      }, token);

      let newComment;
      let updatedComments;

      if (result.success && result.data && result.data.comment) {
        // Add the new comment to the list from response - handle different data structures
        newComment = {
          ...result.data.comment,
          _id: result.data.comment._id || result.data.comment.id,
          text: result.data.comment.text || result.data.comment.content,
          user: result.data.comment.user || { name: user.name || user.displayName || user.email?.split('@')[0] },
          date: result.data.comment.date || result.data.comment.createdAt || result.data.comment.datePosted || new Date().toISOString(),
          likesCount: result.data.comment.likesCount || (result.data.comment.likes && Array.isArray(result.data.comment.likes) ? result.data.comment.likes.length : 0) || 0,
          likes: result.data.comment.likes || [],
          userHasLiked: false // New comment by user hasn't been liked by the same user yet
        };
      } else {
        // If submission fails, create locally
        newComment = {
          _id: `new_comment_${Date.now()}`,
          text: comment.trim(),
          user: { name: user.name || user.displayName || user.email?.split('@')[0] },
          date: new Date().toISOString(),
          likesCount: 0,
          likes: [],
          userHasLiked: false // New comment by user hasn't been liked by the same user yet
        };
      }

      updatedComments = [...comments, newComment];
      setComments(updatedComments);
      setComment('');
      setError(null);

      // Save to local storage to persist after refresh
      const localStorageKey = `post_${postId}_ratings`;
      const currentStored = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
      const dataToStore = {
        comments: updatedComments,
        averageRating: currentStored.averageRating || averageRating,
        totalRatings: currentStored.totalRatings || totalRatings
      };
      localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
      
      // Refresh comments to get the latest from server
      if (showCommentsModal) {
        refreshComments();
      }

    } catch (err) {
      setError(err.message || 'Failed to submit comment');
      console.error('Error submitting comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Function to refresh comments from server
  const refreshComments = async () => {
    if (postId) {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch the entire post to get updated ratings and comments
        const result = await postApi.getPostById(postId, token);
        
        if (result.success && result.data) {
          const post = result.data;
          
          let average = 0; // Initialize to 0 to ensure it's defined
          let total = 0;
          let currentUserRating = null; // Initialize here to avoid 'not defined' error
          
          // Extract ratings data if it exists in the post
          if (post.ratings) {
            const ratings = post.ratings;
            total = ratings.length;
            average = total > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / total : 0;
            
            // Check if current user has rated this post
            if (authState && user && post.ratings && Array.isArray(post.ratings)) {
              const userRatingObj = post.ratings.find(r => {
                // Check if rating.user is an object with _id or just the ObjectId string
                const ratingUserId = typeof r.user === 'object' ? r.user._id : r.user;
                const currentUserId = typeof user === 'object' ? (user._id || user.id) : user;
                return ratingUserId && currentUserId && ratingUserId.toString() === currentUserId.toString();
              });
              
              if (userRatingObj) {
                currentUserRating = userRatingObj.rating;
                setRating(currentUserRating); // Set the rating state to the user's existing rating
              }
            }
            
            setAverageRating(average);
            setTotalRatings(total);
            setUserRating(currentUserRating);
          } else if (post.averageRating !== undefined) {
            setAverageRating(post.averageRating);
            setTotalRatings(post.totalRatings || 0);
            // We don't have user-specific rating data here, so we need to fetch it separately
            // or rely on local storage
            average = post.averageRating;
            total = post.totalRatings || 0;
          }

          // Extract comments data if it exists in the post - handle different data structures
          let loadedComments = (post.comments || post.userComments || []).map(comment => {
            // Check if the current user has liked this comment
            const hasUserLiked = (comment.likes || []).some(like => {
              const likeUserId = typeof like.user === 'object' ? like.user._id : like.user;
              const currentUserId = typeof user === 'object' ? (user._id || user.id) : user;
              return likeUserId && currentUserId && likeUserId.toString() === currentUserId.toString();
            }) || false;

            // Check if comment.user is an object with an _id but no name field
            let processedUser = comment.user;
            if (comment.user && typeof comment.user === 'object') {
              // If user object has name fields, use it as is
              if (comment.user.name || comment.user.displayName) {
                processedUser = comment.user;
              } else if (comment.username) {
                // If user object exists but lacks name, but username is available, prioritize username
                processedUser = { name: comment.username };
              } else if (comment.postedBy) {
                // Else, use postedBy
                processedUser = { name: comment.postedBy };
              } else {
                // Otherwise, try to get a name from the user object
                processedUser = {
                  name: comment.user.name || comment.user.displayName || comment.user.email?.split('@')[0] || 
                        (comment.user._id ? `User_${comment.user._id.substring(0, 8)}` : 'Anonymous'),
                  ...comment.user
                };
              }
            } else if (!comment.user && (comment.username || comment.postedBy)) {
              // If no user object but username/postedBy exist, create a simple user object
              processedUser = { name: comment.username || comment.postedBy };
            } else if (!comment.user) {
              // Otherwise, default to anonymous
              processedUser = { name: 'Anonymous' };
            }
            
            return {
              ...comment,
              _id: comment._id || comment.id,
              text: comment.text || comment.content,
              user: processedUser,
              date: comment.date || comment.createdAt || comment.datePosted,
              likes: comment.likes || [],
              likesCount: comment.likesCount || (comment.likes && Array.isArray(comment.likes) ? comment.likes.length : 0) || 0,
              userHasLiked: hasUserLiked // Add the userHasLiked property
            };
          });
          
          // Apply optimistic updates to the server comments
          loadedComments = loadedComments.map(comment => {
            const commentId = comment._id?.toString() || comment.id?.toString();
            if (!commentId) return comment;
            
            let updatedComment = { ...comment };
            
            // Apply optimistic like updates if any
            if (optimisticLikes.has(commentId)) {
              const optimisticLikeDelta = optimisticLikes.get(commentId);
              updatedComment.likesCount = (updatedComment.likesCount || 0) + optimisticLikeDelta;
            }
            
            return updatedComment;
          });
          
          setComments(loadedComments);
          
          // Store in local storage for persistence
          const localStorageKey = `post_${postId}_ratings`;
          
          // Store fresh server data in localStorage (without optimistic updates to avoid duplication)
          const dataToStore = {
            comments: loadedComments,
            averageRating: average,
            totalRatings: total,
            userRating: currentUserRating
          };
          localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
        }
      } catch (err) {
        console.error('Error refreshing comments:', err);
      }
    }
  };

  if (!authState) {
    return (
      <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
        <div className="flex items-center justify-center mb-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-red-700 font-semibold">
              Authentication Required
            </p>
            <p className="text-red-600 text-sm">Login to rate and comment</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => {
              // Navigate to login page using JavaScript
              window.location.href = '/login';
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Login to Access
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="mt-4 text-center py-4">
      <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-2 text-sm text-gray-600">Loading ratings and comments...</p>
    </div>;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Rating Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Rate this place
        </h4>
        <div className="flex items-center justify-between">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-all duration-200 transform hover:scale-110`}
                onClick={() => {
                  if (authState && !ratingSubmitting) {
                    setRating(star);
                  }
                }}
                onMouseEnter={() => {
                  if (authState && !ratingSubmitting) {
                    setHoverRating(star);
                  }
                }}
                onMouseLeave={() => setHoverRating(0)}
                disabled={!authState || ratingSubmitting}
              >
                ★
              </button>
            ))}
          </div>
          <button
            onClick={handleRatingSubmit}
            disabled={rating <= 0 || ratingSubmitting}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm ${
              rating > 0 && !ratingSubmitting 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-yellow-200' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {ratingSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : userRating !== null ? `Update Rating (${userRating}★)` : 'Submit Rating'}
          </button>
        </div>
        <div className="mt-2 flex items-center">
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-700 mr-2">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
            </span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 ml-2">({totalRatings} ratings)</span>
          
          {userRating !== null && (
            <span className="text-xs text-green-600 ml-2 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your rating: {userRating}★
            </span>
          )}
        </div>
      </div>

      {/* Comments Section - Button to open modal */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </h4>
          <button
            onClick={() => setShowCommentsModal(true)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Comment input - only shown when authenticated */}
        {authState && (
          <form onSubmit={handleCommentSubmit} className="mt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience or thoughts about this place..."
              className="w-full p-2 border-0 border-b-2 border-purple-400 bg-transparent mb-2 resize-none focus:ring-0 focus:border-purple-600 transition-all duration-300 text-sm text-gray-700 placeholder-gray-400 outline-none"
              rows="2"
              disabled={!authState || commentSubmitting}
            />
            <button
              type="submit"
              disabled={!comment.trim() || commentSubmitting}
              className={`w-full py-1.5 rounded-lg font-medium transition-all duration-300 text-sm ${
                comment.trim() && !commentSubmitting 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {commentSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </span>
              ) : 'Post Comment'}
            </button>
          </form>
        )}

        {/* Show login message if not authenticated */}
        {!authState && (
          <div className="mt-3 text-center py-2">
            <p className="text-sm text-gray-600">
              <span className="text-red-500">🔒</span> Login to comment
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {comments.length}
                </span>
              </h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event from bubbling up to the parent popup
                  setShowCommentsModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6">
              {comments.length > 0 ? (
                <div className="space-y-5">
                  {comments.map((comment, index) => {
                    // Generate a simple avatar based on username - handle the different data structures
                    let username = 'Anonymous';
                    // Check various possible locations for user name in the comment object
                    if (comment.user && typeof comment.user === 'object') {
                      // If user is an object, check for name fields
                      if (comment.user.name) {
                        username = comment.user.name;
                      } else if (comment.user.displayName) {
                        username = comment.user.displayName;
                      } else if (comment.user.firstName && comment.user.lastName) {
                        username = `${comment.user.firstName} ${comment.user.lastName}`;
                      } else if (comment.user.firstName) {
                        username = comment.user.firstName;
                      } else if (comment.user.lastName) {
                        username = comment.user.lastName;
                      } else if (comment.user.email) {
                        username = comment.user.email.split('@')[0];
                      } else if (comment.user.username) {
                        username = comment.user.username;
                      }
                    }
                    // If still anonymous, check if user is a string ID and if we have other name fields
                    if (username === 'Anonymous' && comment.user && typeof comment.user === 'string') {
                      // String user ID exists, check for other name fields
                      if (comment.username) {
                        username = comment.username;
                      } else if (comment.postedBy) {
                        username = comment.postedBy;
                      }
                    }
                    // If still anonymous, try other possible name fields that might not be in user object
                    if (username === 'Anonymous') {
                      if (comment.username) {
                        username = comment.username;
                      } else if (comment.postedBy) {
                        username = comment.postedBy;
                      } else if (comment.user && typeof comment.user === 'object' && comment.user._id) {
                        // As absolute last resort, if we have only an ID and no other name data, 
                        // still keep Anonymous rather than showing the ID
                        username = 'Anonymous';
                      }
                    }
                    const initials = username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const colorClasses = [
                      'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
                      'bg-gradient-to-r from-purple-400 to-purple-600 text-white', 
                      'bg-gradient-to-r from-green-400 to-green-600 text-white',
                      'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
                      'bg-gradient-to-r from-red-400 to-red-600 text-white',
                      'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white',
                      'bg-gradient-to-r from-pink-400 to-pink-600 text-white',
                      'bg-gradient-to-r from-teal-400 to-teal-600 text-white',
                    ];
                    const bgColor = colorClasses[index % colorClasses.length];
                    
                    const commentId = comment._id?.toString() || comment.id?.toString() || `comment-${index}`;
                    // Handle different like count fields from backend
                    const currentLikes = comment.likesCount || (comment.likes && Array.isArray(comment.likes) ? comment.likes.length : 0) || 0;
                    
                    return (
                      <div 
                        key={commentId} 
                        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] transition-all duration-300"
                      >
                        <div className="flex items-start space-x-4">
                          {/* User Avatar */}
                          <div className={`${bgColor} w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm`}>
                            {initials}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between">
                              <h5 className="font-semibold text-gray-800 text-base">
                                {username}
                              </h5>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {new Date(comment.date || comment.createdAt || comment.datePosted || comment.timestamp || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-gray-700 text-base leading-relaxed">
                                {comment.text || comment.content}
                              </p>
                            </div>
                            


                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No comments yet</h3>
                  <p className="text-gray-600 max-w-xs mx-auto">Be the first to share your experience and thoughts about this place!</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer - Only show if authenticated */}
            {authState && (
              <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentSubmit(e);
                  // Auto close the modal after posting if desired, otherwise keep it open
                }} className="flex space-x-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-3 border-0 border-b-2 border-pink-400 bg-transparent focus:ring-0 focus:border-pink-600 transition-all duration-300 text-sm text-gray-700 placeholder-gray-400 outline-none"
                    disabled={commentSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim() || commentSubmitting}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm ${
                      comment.trim() && !commentSubmitting 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-200' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {commentSubmitting ? '...' : 'Post'}
                  </button>
                </form>
              </div>
            )}
            
            {!authState && (
              <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl text-center">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="text-red-500">🔒</span> Login to comment
                </p>
                <button 
                  onClick={() => {
                    setShowCommentsModal(false);
                    window.location.href = '/login';
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-6 rounded-lg font-medium text-sm transition-all duration-300 shadow-md"
                >
                  Login to Comment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RatingsAndComments;