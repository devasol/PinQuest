import { useState, useEffect, useCallback } from 'react';
import { postApi, userApi } from '../services/api';

// Custom hook to manage post interactions (likes, bookmarks) with server synchronization
const usePostInteractions = (post, currentUser, authToken, isAuthenticated) => {
  const [liked, setLiked] = useState(() => {
    if (post?.likes && Array.isArray(post.likes) && currentUser && currentUser._id) {
      return post.likes.some((like) => {
        const userId = typeof like.user === 'object' ? like.user._id : like.user;
        return userId && userId === currentUser._id;
      });
    }
    return false;
  });

  const [likeCount, setLikeCount] = useState(post?.likesCount || (post?.likes ? post?.likes.length : 0) || 0);

  const [bookmarked, setBookmarked] = useState(() => {
    if (post?.isBookmarked !== undefined) {
      return post.isBookmarked;
    } else if (currentUser && currentUser.favorites && Array.isArray(currentUser.favorites)) {
      return currentUser.favorites.some((fav) => {
        const favPostId = typeof fav.post === 'object' ? fav.post._id : fav.post;
        return favPostId && favPostId === post._id;
      });
    }
    return false;
  });

  // Function to refresh post status from the server
  const refreshPostStatus = useCallback(async () => {
    if (!post?._id || !authToken || !isAuthenticated || !currentUser) {
      setLiked(false);
      setBookmarked(false);
      return;
    }

    try {
      // Fetch updated post data to get accurate like status
      const response = await postApi.getPostById(post._id, authToken);
      if (response.success && response.data) {
        const updatedPost = response.data;

        // Update like status
        if (updatedPost.likes && Array.isArray(updatedPost.likes) && currentUser._id) {
          const isLiked = updatedPost.likes.some(like => {
            const userId = typeof like.user === 'object' ? like.user._id : like.user;
            return userId && userId === currentUser._id;
          });
          setLiked(isLiked);
        } else {
          setLiked(false);
        }

        // Update like count
        setLikeCount(updatedPost.likesCount || (updatedPost.likes ? updatedPost.likes.length : 0) || 0);
      }

      // Check if this post is bookmarked by fetching user's favorites
      const bookmarkResponse = await userApi.getFavorites(authToken);
      if (bookmarkResponse.success && bookmarkResponse.data?.favorites) {
        const isBookmarked = bookmarkResponse.data.favorites.some(fav => {
          const favPostId = typeof fav.post === 'object' ? fav.post._id : fav.post;
          return favPostId && favPostId === post._id;
        });
        setBookmarked(isBookmarked);
      } else {
        setBookmarked(false);
      }
    } catch (error) {
      console.error('Error refreshing post status:', error);
      // Fallback to props data if API call fails
      if (post?.likes && Array.isArray(post.likes) && currentUser && currentUser._id) {
        const isLiked = post.likes.some(like => {
          const userId = typeof like.user === 'object' ? like.user._id : like.user;
          return userId && userId === currentUser._id;
        });
        setLiked(isLiked);
      } else {
        setLiked(false);
      }

      if (currentUser && currentUser.favorites && Array.isArray(currentUser.favorites)) {
        const isBookmarked = currentUser.favorites.some(fav => {
          const favPostId = typeof fav.post === 'object' ? fav.post._id : fav.post;
          return favPostId && favPostId === post._id;
        });
        setBookmarked(isBookmarked);
      } else {
        setBookmarked(false);
      }
    }
  }, [post?._id, authToken, isAuthenticated, currentUser?._id, post?.likes, post?.likesCount, currentUser?.favorites]);

  // Refresh status when dependencies change (only when authentication state or post changes)
  useEffect(() => {
    refreshPostStatus();
  }, [isAuthenticated, post?._id, currentUser?._id, authToken]);

  // Handle like/unlike action
  const handleLike = useCallback(async () => {
    if (!authToken || !post?._id) {
      alert("Please login to like posts or the post data is not available");
      return;
    }

    // Optimistically update UI
    const newLikedState = !liked;
    const newLikeCount = liked ? likeCount - 1 : likeCount + 1;
    
    setLiked(newLikedState);
    setLikeCount(newLikeCount);

    const result = await (liked 
      ? postApi.unlikePost(post._id, authToken)
      : postApi.likePost(post._id, authToken)
    );

    if (result.success) {
      // Update the like count from server response to ensure accuracy
      const serverLikeCount = result.data?.likesCount;
      if (serverLikeCount !== undefined) {
        setLikeCount(serverLikeCount);
        // Ensure the liked state matches server state (double-check)
        setLiked(newLikedState);
      }
    } else {
      // If the API call fails, revert the optimistic update
      console.error('Failed to update like status:', result.error || result.message);
      setLiked(liked); // Revert to original state
      setLikeCount(likeCount); // Revert to original count
      
      // Handle specific error messages
      if (result.error && (result.error.includes('already') || result.error.includes('Already'))) {
        // If it says "already liked", it means the server state was already liked
        if (result.error.includes('liked')) {
          if (!liked) { // User tried to like an already liked post
            setLiked(true);
            setLikeCount(prev => prev + 1);
          }
        } else if (result.error.includes('unliked')) {
          // If it says "already unliked", it means the server state was already unliked
          if (liked) { // User tried to unlike an already unliked post
            setLiked(false);
            setLikeCount(prev => prev - 1);
          }
        }
      } else {
        // For other errors, show a general message and revert state
        alert('An error occurred. Please try again.');
      }
    }
  }, [authToken, liked, likeCount, post?._id]);

  // Handle bookmark/unbookmark action
  const handleBookmark = useCallback(async () => {
    if (!authToken || !post?._id) {
      alert("Please login to bookmark posts or the post data is not available");
      return;
    }

    // Store the previous state to revert if needed
    const previousBookmarked = bookmarked;
    
    // Optimistically update the UI
    setBookmarked(prev => !prev);

    let result;
    if (bookmarked) {
      // Remove from favorites
      result = await userApi.removeFavorite(post._id, authToken);
      if (!result.success) {
        console.error('Failed to remove bookmark:', result.error || result.message);
        // Revert the UI state if the API call failed
        setBookmarked(previousBookmarked);
        
        // Handle specific error messages
        if (result.error && (result.error.includes('already') || result.error.includes('Already'))) {
          // If it says "already unfavorited", it means the server state was already unfavorited
          if (result.error.includes('favorited')) {
            setBookmarked(true);
          } else {
            setBookmarked(false);
          }
        } else {
          alert('An error occurred while removing bookmark. Please try again.');
        }
      }
    } else {
      // Add to favorites
      result = await userApi.addFavorite(post._id, authToken);
      if (!result.success) {
        console.error('Failed to add bookmark:', result.error || result.message);
        // Revert the UI state if the API call failed
        setBookmarked(previousBookmarked);
        
        // Handle specific error messages
        if (result.error && (result.error.includes('already') || result.error.includes('Already'))) {
          // If it says "already favorited", it means the server state was already favorited
          if (result.error.includes('favorited')) {
            setBookmarked(true);
          } else {
            setBookmarked(false);
          }
        } else {
          alert('An error occurred while saving bookmark. Please try again.');
        }
      }
    }
  }, [authToken, bookmarked, post?._id]);

  return {
    liked,
    likeCount,
    bookmarked,
    refreshPostStatus,
    handleLike,
    handleBookmark
  };
};

export default usePostInteractions;