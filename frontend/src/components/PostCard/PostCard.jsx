// src/components/PostCard/PostCard.jsx
import React from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MapPin,
  User,
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { postApi, userApi } from "../../services/api";
import { getImageUrl, formatDate } from "../../utils/imageUtils";
import usePostInteractions from "../../hooks/usePostInteractions";
import { useModal } from "../../contexts/ModalContext";

const PostCard = ({ post, currentUser, authToken, isAuthenticated, onLike, onComment }) => {
  const { showModal } = useModal();
  const {
    liked,
    likeCount,
    bookmarked,
    handleLike,
    handleBookmark,
    refreshPostStatus
  } = usePostInteractions(post, currentUser || null, authToken, isAuthenticated, showModal);

  const handleComment = () => {
    onComment && onComment(post._id);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-200">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.postedBy?.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <OptimizedImage
                src={getImageUrl(post.postedBy.avatar)}
                alt={post.postedBy.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.postedBy?.name || "Anonymous"}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(post.datePosted)}
            </p>
          </div>
        </div>

        {post.location?.latitude && post.location?.longitude && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            <span>Location</span>
          </div>
        )}
      </div>

      {/* Post Images - Handle both single image and multiple images */}
      {(post.image || (post.images && post.images.length > 0)) ? (
        <div className="relative">
          {/* Display first image from multiple images or single image */}
          <div className="w-full h-64">
            <OptimizedImage
              src={getImageUrl(
                post.images && Array.isArray(post.images) && post.images.length > 0
                  ? (typeof post.images[0] === 'object' ? post.images[0] : { url: post.images[0] })
                  : (typeof post.image === 'object' ? post.image : { url: post.image })
              )}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Show image count indicator if there are multiple images */}
          {post.images && Array.isArray(post.images) && post.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {post.images.length} images
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="mx-auto w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No Image Available</p>
              <p className="text-gray-400 text-sm mt-1">
                This post doesn't have any images
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        <p className="text-gray-700 mb-4">{post.description}</p>

        {post.category && (
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-3">
            {post.category}
          </span>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                liked ? "text-red-500" : "text-gray-600 hover:text-red-500"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={handleComment}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all ${
                bookmarked
                  ? "bg-yellow-100 text-yellow-600"
                  : "text-gray-600 hover:bg-yellow-100 hover:text-yellow-500"
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`}
              />
            </button>
          </div>

          <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
