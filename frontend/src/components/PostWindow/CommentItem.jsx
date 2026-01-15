import React from 'react';
import useCommentUserName from '../../hooks/useCommentUserName';
import { formatDate, getImageUrl } from '../../utils/imageUtils';
import { User } from 'lucide-react';

const CommentItem = ({ comment, authToken }) => {
  // Extract user ID properly
  const userId = typeof comment.user === 'object' ? 
    (comment.user._id || comment.user.id) : 
    (typeof comment.user === 'string' ? comment.user : null);
  
  const { userName, isLoading } = useCommentUserName(userId, authToken);

  const displayedUserName = typeof comment.user === 'object' && comment.user.name 
    ? comment.user.name 
    : (isLoading ? '...' : userName || 'Anonymous');

  const avatarUrl = typeof comment.user === 'object' && comment.user.avatar ? getImageUrl(comment.user.avatar) : null;

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
      <div className="shrink-0">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayedUserName} 
            className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 border border-gray-200">
             <span className="font-bold text-sm">{displayedUserName.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold text-gray-900 text-sm">{displayedUserName}</h5>
          <span className="text-xs text-gray-400 font-medium">{formatDate(comment.createdAt || comment.datePosted)}</span>
        </div>
        <div className="bg-gray-50 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-sm text-gray-700 leading-relaxed font-medium">
          {comment.text}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
