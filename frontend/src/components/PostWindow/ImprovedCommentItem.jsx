import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Edit3, Heart, MessageCircle } from 'lucide-react';
import { formatDate } from '../../utils/imageUtils';
import { postApi } from '../../services/api';
import { useModal } from '../../contexts/ModalContext';

const CommentItem = ({ 
  comment, 
  authToken, 
  currentUser, 
  onUpdate, 
  onDelete,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { showModal } = useModal();

  const isOwnComment = currentUser && comment.user && 
    (currentUser._id === comment.user._id || currentUser.id === comment.user._id);

  const handleEdit = useCallback(async () => {
    if (!editText.trim()) return;

    try {
      // In a real implementation, you would call an API to update the comment
      // For now, we'll just call the onUpdate callback
      onUpdate(comment._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to update comment',
        type: 'error',
        confirmText: 'OK'
      });
    }
  }, [editText, comment._id, onUpdate, showModal]);

  const handleDelete = useCallback(async () => {
    try {
      // In a real implementation, you would call an API to delete the comment
      // For now, we'll just call the onDelete callback
      onDelete(comment._id);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to delete comment',
        type: 'error',
        confirmText: 'OK'
      });
    }
  }, [comment._id, onDelete, showModal]);

  const handleLike = useCallback(async () => {
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: "Please login to like comments",
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    setIsLiking(true);
    try {
      // In a real implementation, you would call an API to like the comment
      // For now, we'll just show a success message
      showModal({
        title: "Success",
        message: "Comment liked successfully!",
        type: 'success',
        confirmText: 'OK'
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to like comment',
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setIsLiking(false);
    }
  }, [authToken, showModal]);

  const displayedUserName = comment.user?.name || comment.user?.username || 'Unknown User';

  return (
    <motion.div
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {displayedUserName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{displayedUserName}</p>
              <p className="text-xs text-gray-500">{formatDate(comment.createdAt || comment.date)}</p>
            </div>
            
            {/* Actions Menu */}
            {(isOwnComment || comment.user?._id) && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Comment options"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-32"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {isOwnComment && (
                        <>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={handleDelete}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Comment Text */}
          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="3"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.text);
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{comment.text}</p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="mt-3 flex items-center gap-4">
            <motion.button
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors text-sm"
              whileTap={{ scale: 0.95 }}
            >
              <Heart 
                className={`w-4 h-4 ${comment.likesCount > 0 ? 'fill-current text-red-500' : ''}`} 
              />
              <span>{comment.likesCount || 0}</span>
            </motion.button>
            
            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentItem;