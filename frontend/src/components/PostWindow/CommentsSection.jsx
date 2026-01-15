import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { postApi } from '../../services/api';
import { useModal } from '../../contexts/ModalContext';
import ImprovedCommentItem from './ImprovedCommentItem';

const CommentsSection = ({
  post,
  currentUser,
  authToken,
  isOpen,
  onClose,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  comments = []
}) => {
  // Use the comments from props directly, don't maintain local state
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showModal } = useModal();

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    if (!authToken) {
      showModal({
        title: "Authentication Required",
        message: "Please login to comment",
        type: 'info',
        confirmText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the parent's add comment function
      const result = await onAddComment(post._id, newComment);

      if (result.success) {
        setNewComment('');
      } else {
        throw new Error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to add comment',
        type: 'error',
        confirmText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, authToken, post._id, onAddComment, showModal]);

  const handleUpdateComment = useCallback(async (commentId, newText) => {
    try {
      const result = await onUpdateComment(commentId, newText);
      if (result.success) {
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId ? result.comment : comment
          )
        );
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to update comment',
        type: 'error',
        confirmText: 'OK'
      });
    }
  }, [onUpdateComment, showModal]);

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      const result = await onDeleteComment(commentId);
      if (result.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showModal({
        title: "Error",
        message: error.message || 'Failed to delete comment',
        type: 'error',
        confirmText: 'OK'
      });
    }
  }, [onDeleteComment, showModal]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting) {
        handleSubmitComment();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg">Comments</h3>
            <span className="text-sm text-gray-500">({comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <ImprovedCommentItem
                  key={comment._id}
                  comment={comment}
                  authToken={authToken}
                  currentUser={currentUser}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              ))
            ) : (
              <motion.div
                className="text-center py-8 text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No comments yet. Be the first to comment!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="2"
              maxLength={500}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
            />
            <motion.button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`self-end px-4 py-3 rounded-xl transition-colors ${
                !newComment.trim() || isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsSection;