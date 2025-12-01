import React from 'react';
import useCommentUserName from '../../hooks/useCommentUserName';
import { formatDate } from '../../utils/imageUtils'; // Assuming formatDate is still needed

const CommentItem = ({ comment, authToken }) => {
  // Extract user ID properly, handling both object and string formats
  const userId = typeof comment.user === 'object' ? 
    (comment.user._id || comment.user.id) : 
    (typeof comment.user === 'string' ? comment.user : null);
  
  const { userName, isLoading } = useCommentUserName(userId, authToken);

  const displayedUserName = typeof comment.user === 'object' && comment.user.name 
    ? comment.user.name 
    : (isLoading ? 'Loading...' : userName || 'Deleted User');

  return (
    <div key={comment._id || `comment-${Math.random()}`} className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {displayedUserName?.charAt(0)?.toUpperCase() || 'D'} {/* Changed to 'D' for 'Deleted User' */}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800">{displayedUserName}</p>
              <p className="text-xs text-gray-500">{formatDate(comment.createdAt || comment.datePosted)}</p>
            </div>
          </div>
          <p className="mt-2 text-gray-700">{comment.text}</p>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
