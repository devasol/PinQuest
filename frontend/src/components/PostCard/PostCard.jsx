// src/components/PostCard/PostCard.jsx
import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MapPin,
  User,
} from "lucide-react";
import OptimizedImage from "../OptimizedImage";

// API base URL - should be consistent with other components
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const PostCard = ({ post, currentUser, authToken, onLike, onComment }) => {
  const [liked, setLiked] = useState(
    post.likes && post.likes.some((like) => like.user === currentUser?._id)
  );
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(
    currentUser?.favorites?.some((fav) => fav.post === post._id)
  );

  const handleLike = async () => {
    if (!authToken) {
      alert("Please login to like posts");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${post._id}/${liked ? "unlike" : "like"}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLiked(!liked);
        setLikeCount(data.data.likesCount);
        onLike && onLike(post._id, !liked);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleBookmark = async () => {
    if (!authToken) {
      alert("Please login to bookmark posts");
      return;
    }

    try {
      if (bookmarked) {
        // Remove from favorites
        const response = await fetch(
          `${API_BASE_URL}/users/favorites/${post._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          setBookmarked(false);
        }
      } else {
        // Add to favorites
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId: post._id }),
        });

        if (response.ok) {
          const data = await response.json();
          setBookmarked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleComment = () => {
    onComment && onComment(post._id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Extract the base server URL from the API base URL for image paths
  const getServerBaseUrl = () => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    // Remove the /api/v1 part to get the base server URL
    return apiBaseUrl.replace("/api/v1", "");
  };

  // Helper function to get the correct image URL
  const getImageUrl = (imageObj) => {
    if (!imageObj) return "";
    const serverBaseUrl = getServerBaseUrl();
    if (typeof imageObj === "string") {
      return imageObj.startsWith("http")
        ? imageObj
        : `${serverBaseUrl}${imageObj}`;
    }
    if (imageObj.url) {
      return imageObj.url.startsWith("http")
        ? imageObj.url
        : `${serverBaseUrl}${imageObj.url}`;
    }
    return "";
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-200">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.postedBy?.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <OptimizedImage
                src={post.postedBy.avatar.url}
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
      {post.image?.url || (post.images && post.images.length > 0) ? (
        <div className="relative">
          {/* Display first image from multiple images or single image */}
          <div className="w-full h-64">
            <OptimizedImage
              src={getImageUrl(
                post.images && post.images.length > 0
                  ? post.images[0]
                  : post.image
              )}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Show image count indicator if there are multiple images */}
          {post.images && post.images.length > 1 && (
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
              className={`flex items-center space-x-1 ${
                bookmarked
                  ? "text-yellow-500"
                  : "text-gray-600 hover:text-yellow-500"
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
