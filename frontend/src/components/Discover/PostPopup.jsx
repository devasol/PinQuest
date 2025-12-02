import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { Star, Heart, Navigation, X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Rating component for interactive rating
const RatingInput = ({ rating, onRatingChange, interactive = true }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`p-1 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => interactive && onRatingChange(star)}
          disabled={!interactive}
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// Comment input component
const CommentInput = ({ onAddComment }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
      <button
        type="submit"
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

// Main popup component
const PostPopup = ({ post, onClose, onSave, isSaved, onGetDirections, onClick }) => {
  const { isAuthenticated } = useAuth();
  const { showModal } = useModal();
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user has already rated this post
  useEffect(() => {
    if (isAuthenticated) {
      // In a real app, you would fetch user's rating for this post
      // For now, we'll keep this simple
    }
  }, [isAuthenticated, post.id]);

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!isAuthenticated) {
      setError('Please login to rate this post');
      return;
    }
    
    if (userRating <= 0) {
      setError('Please select a rating');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: userRating })
      });
      
      if (response.ok) {
        // In a real app, you would update the post with the new rating
        // For now, we'll just show a success message
        showModal({
          title: "Success",
          message: 'Rating submitted successfully!',
          type: 'success',
          confirmText: 'OK'
        });
        setUserRating(0); // Reset rating after submission
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to submit rating');
      }
    } catch (err) {
      setError('Error submitting rating');
    } finally {
      setLoading(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (commentText) => {
    if (!isAuthenticated) {
      setError('Please login to comment');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/posts/${post.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (response.ok) {
        const result = await response.json();
        setComments([...comments, result.data.comment]);
        setError(''); // Clear any previous error
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to add comment');
      }
    } catch (err) {
      setError('Error adding comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup className="post-popup max-w-sm">
      <div className="w-80 max-w-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 truncate max-w-[70%]">{post.title}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-1">By {post.postedBy}</p>
        <p className="text-sm mb-3 text-gray-700">{post.description}</p>
        
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center">
            <RatingInput rating={Math.round(post.averageRating)} interactive={false} />
            <span className="ml-1 text-sm text-gray-600">
              {post.averageRating.toFixed(1)} ({post.totalRatings})
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-3">
          Category: <span className="font-medium">{post.category}</span>
        </p>
        
        {isAuthenticated && (
          <div className="border-t border-gray-200 pt-3">
            {/* Rating Section */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Rate this place:</label>
                <RatingInput 
                  rating={userRating} 
                  onRatingChange={setUserRating} 
                  interactive={true} 
                />
              </div>
              <button
                onClick={handleRatingSubmit}
                disabled={loading || userRating <= 0}
                className="mt-1 w-full bg-blue-500 text-white py-1.5 px-3 rounded text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
            
            {/* Comment Section */}
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-700 block mb-1">Add Comment:</label>
              <CommentInput onAddComment={handleCommentSubmit} />
            </div>
            
            {/* Comments List */}
            {comments.length > 0 && (
              <div className="max-h-32 overflow-y-auto mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Comments:</div>
                {comments.map((comment, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded mb-1">
                    <div className="font-medium">{comment.author || 'User'}:</div>
                    <div>{comment.content}</div>
                    <div className="text-gray-500 mt-1">{new Date(comment.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="text-xs text-gray-500 mb-3 italic">
            Login to rate and comment
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {isAuthenticated && (
            <button 
              onClick={() => onSave(post)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                isSaved 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          
          <button 
            onClick={() => onClick && onClick(post)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded text-sm hover:bg-emerald-200"
          >
            <Star className="w-4 h-4" />
            View Details
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default PostPopup;