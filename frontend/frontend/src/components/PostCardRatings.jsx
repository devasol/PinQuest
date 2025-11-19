import React, { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const PostCardRatings = ({ postId, isAuthenticated: authState, user, onOpenComments }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch existing ratings for this post
  useEffect(() => {
    const fetchRatings = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/ratings`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setAverageRating(data.averageRating || 0);
          setTotalRatings(data.totalRatings || 0);
        } else {
          // Use fallback values if the endpoint doesn't exist
          setAverageRating(0);
          setTotalRatings(0);
        }
      } catch (err) {
        // Use fallback values
        setAverageRating(0);
        setTotalRatings(0);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [postId]);

  if (loading) {
    return <div className="flex items-center text-sm text-gray-500">
      <Star className="w-4 h-4 mr-1 text-gray-400" />
      <span>Loading...</span>
    </div>;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= (hoverRating || Math.round(averageRating)) 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-gray-600">
          {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
        </span>
      </div>
      
      <button 
        onClick={onOpenComments}
        className="flex items-center text-gray-600 hover:text-blue-500"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span>Comments</span>
      </button>
    </div>
  );
};

export default PostCardRatings;