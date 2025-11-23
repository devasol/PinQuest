import React, { useState, useEffect } from 'react';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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

  // Fetch existing ratings and comments by getting the full post data
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        
        // First, try to load from local storage as fallback data
        const localStorageKey = `post_${postId}_ratings`;
        const storedData = localStorage.getItem(localStorageKey);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            setComments(parsedData.comments || []);
            setAverageRating(parsedData.averageRating || 0);
            setTotalRatings(parsedData.totalRatings || 0);
            setUserRating(parsedData.userRating || null);
          } catch (err) {
            console.error('Error parsing stored data:', err);
          }
        }

        // Create headers with auth token if available
        const headers = {
          'Content-Type': 'application/json',
        };
        
        const token = localStorage.getItem('token');
        if (token) {
          const trimmedToken = token.trim(); // Ensure token is properly trimmed
          // Validate token format (basic JWT format check)
          if (trimmedToken && trimmedToken.split('.').length === 3) {
            headers['Authorization'] = `Bearer ${trimmedToken}`;
          } else {
            console.error('Invalid token format in RatingsAndComments');
            localStorage.removeItem('token');
          }
        }

        // Fetch the entire post to get any existing ratings or comments
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
          headers
        });
        
        if (response.ok) {
          const postData = await response.json();
          
          if (postData.status === 'success' && postData.data) {
            const post = postData.data;
            
            // Extract ratings data if it exists in the post
            if (post.ratings) {
              const ratings = post.ratings;
              const total = ratings.length;
              const average = total > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / total : 0;
              
              // Check if current user has rated this post
              let currentUserRating = null;
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
            }

            // Extract comments data if it exists in the post
            const loadedComments = post.comments || post.userComments || [];
            setComments(loadedComments);
            
            // Store in local storage for persistence
            const localStorageKey = `post_${postId}_ratings`;
            const dataToStore = {
              comments: loadedComments,
              averageRating: average || post.averageRating || 0,
              totalRatings: totalRatings || post.totalRatings || 0,
              userRating: currentUserRating
            };
            localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
          } else {
            // Fallback to defaults if no post data
            setComments([]);
            setAverageRating(0);
            setTotalRatings(0);
            setUserRating(null);
          }
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
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, authState, user]);

  const handleRatingSubmit = async () => {
    if (!authState || !user || rating <= 0) {
      setError('You must be logged in to rate');
      return;
    }

    setRatingSubmitting(true);
    try {
      // Create headers with auth token if available
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        const trimmedToken = token.trim(); // Ensure token is properly trimmed
        // Validate token format (basic JWT format check)
        if (trimmedToken && trimmedToken.split('.').length === 3) {
          headers['Authorization'] = `Bearer ${trimmedToken}`;
        } else {
          console.error('Invalid token format in handleRatingSubmit');
          localStorage.removeItem('token');
          throw new Error('Invalid token. Please login again.');
        }
      } else {
        throw new Error('No authentication token found. Please login again.');
      }

      // Try to submit the rating to backend
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating }),
      });

      let newAverageRating, newTotalRatings;

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success') {
          newAverageRating = data.averageRating || rating;
          newTotalRatings = data.totalRatings || 1;
        } else {
          // If backend response format is unexpected, calculate locally
          newTotalRatings = totalRatings + 1;
          newAverageRating = ((averageRating * totalRatings) + rating) / newTotalRatings;
        }
      } else {
        // If the backend API doesn't exist or failed, calculate locally
        newTotalRatings = totalRatings + 1;
        newAverageRating = ((averageRating * totalRatings) + rating) / newTotalRatings;
      }

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
      // Create headers with auth token if available
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        const trimmedToken = token.trim(); // Ensure token is properly trimmed
        // Validate token format (basic JWT format check)
        if (trimmedToken && trimmedToken.split('.').length === 3) {
          headers['Authorization'] = `Bearer ${trimmedToken}`;
        } else {
          console.error('Invalid token format in handleCommentSubmit');
          localStorage.removeItem('token');
          throw new Error('Invalid token. Please login again.');
        }
      } else {
        throw new Error('No authentication token found. Please login again.');
      }

      // Try to submit the comment to backend
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: comment.trim(),
        }),
      });

      let newComment;
      let updatedComments;

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success') {
          // Add the new comment to the list from response
          newComment = {
            ...data.comment,
            username: user.name || user.displayName || user.email?.split('@')[0],
            createdAt: new Date().toISOString()
          };
        } else {
          // If backend response format is unexpected, create locally
          newComment = {
            content: comment.trim(),
            username: user.name || user.displayName || user.email?.split('@')[0],
            createdAt: new Date().toISOString()
          };
        }
      } else {
        // If the backend API doesn't exist or failed, create locally
        newComment = {
          content: comment.trim(),
          username: user.name || user.displayName || user.email?.split('@')[0],
          createdAt: new Date().toISOString()
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

    } catch (err) {
      setError(err.message || 'Failed to submit comment');
      console.error('Error submitting comment:', err);
    } finally {
      setCommentSubmitting(false);
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
                className={`text-2xl ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-all duration-200 transform hover:scale-110 ${
                  userRating !== null && !ratingSubmitting ? 'cursor-default' : ''
                }`}
                onClick={() => {
                  if (userRating === null || ratingSubmitting) {
                    setRating(star);
                  }
                }}
                onMouseEnter={() => {
                  if (userRating === null || ratingSubmitting) {
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
              You rated: {userRating}★
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
              className="w-full p-2 border border-gray-300 rounded-lg mb-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-800 text-sm">
                        {comment.username || comment.postedBy || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(comment.createdAt || comment.datePosted || comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer - Only show if authenticated */}
            {authState && (
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
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
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm bg-white"
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
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl text-center">
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