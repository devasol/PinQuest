import { useState, useEffect, useCallback } from 'react';
import { postApi, userApi } from '../services/api';
import { getInteractionState, updateInteractionState } from '../utils/interactionCache';

// Custom hook to manage post interactions (likes, bookmarks) with server synchronization
const usePostInteractions = (post, currentUser, authToken, isAuthenticated) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostStatus = async () => {
      if (!post?._id || !currentUser?._id || !authToken) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Get cached state for initial optimistic display, but verify with server
        const cachedState = getInteractionState(currentUser._id, post._id);

        // Fetch authoritative data from server
        const [postResponse, favoritesResponse] = await Promise.all([
          postApi.getPostById(post._id, authToken),
          userApi.getFavorites(authToken),
        ]);

        let serverLiked = false;
        let serverLikeCount = 0;
        if (postResponse.success && postResponse.data) {
          const updatedPost = postResponse.data;
          serverLikeCount = updatedPost.likesCount || (updatedPost.likes ? updatedPost.likes.length : 0);
          if (updatedPost.likes && Array.isArray(updatedPost.likes)) {
            serverLiked = updatedPost.likes.some(like => 
              (typeof like.user === 'object' ? like.user._id : like.user) === currentUser._id
            );
          }
        } else {
          // Fallback to cached or prop data if server fails for posts
          serverLiked = cachedState.liked !== undefined ? cachedState.liked : (post.likes?.some(like => (typeof like.user === 'object' ? like.user._id : like.user) === currentUser._id) || false);
          serverLikeCount = cachedState.likeCount !== undefined ? cachedState.likeCount : (post.likes?.length || 0);
        }

        let serverBookmarked = false;
        if (favoritesResponse.success && favoritesResponse.data?.favorites) {
          serverBookmarked = favoritesResponse.data.favorites.some(fav => 
            (typeof fav.post === 'object' ? fav.post._id : fav.post) === post._id
          );
        } else {
          // Fallback to cached or prop data if server fails for favorites
          serverBookmarked = cachedState.bookmarked !== undefined ? cachedState.bookmarked : (currentUser.favorites?.some(fav => (typeof fav.post === 'object' ? fav.post._id : fav.post) === post._id) || false);
        }

        // Set state with authoritative server data
        setLiked(serverLiked);
        setLikeCount(serverLikeCount);
        setBookmarked(serverBookmarked);

        // Update cache with the latest server state
        updateInteractionState(currentUser._id, post._id, {
          liked: serverLiked,
          bookmarked: serverBookmarked,
          likeCount: serverLikeCount,
        });

      } catch (error) {
        console.error('Error refreshing post status:', error);
        // On error, fall back to cached data if available
        const cachedState = getInteractionState(currentUser._id, post._id);
        if (cachedState) {
          setLiked(cachedState.liked || false);
          setLikeCount(cachedState.likeCount || post?.likesCount || 0);
          setBookmarked(cachedState.bookmarked || false);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPostStatus();
    } else {
      setLiked(false);
      setBookmarked(false);
      setLikeCount(post?.likesCount || 0);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id, currentUser?._id, authToken, isAuthenticated]);

  const handleLike = useCallback(async () => {
    if (!authToken || !post?._id || !currentUser?._id) {
      alert("Please login to like posts.");
      return;
    }

    const originalState = { liked, likeCount };
    const newLikedState = !liked;
    const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;

    // Optimistic UI update
    setLiked(newLikedState);
    setLikeCount(newLikeCount);
    updateInteractionState(currentUser._id, post._id, { liked: newLikedState, likeCount: newLikeCount });

    try {
      const result = await (originalState.liked
        ? postApi.unlikePost(post._id, authToken)
        : postApi.likePost(post._id, authToken)
      );

      if (result.success && result.data) {
        // Confirm server state
        const serverLikeCount = result.data.likesCount;
        setLikeCount(serverLikeCount);
        updateInteractionState(currentUser._id, post._id, { liked: newLikedState, likeCount: serverLikeCount });
      } else {
        throw new Error(result.error || 'Failed to update like status.');
      }
    } catch (error) {
      console.error('Failed to update like status:', error);
      // Revert on failure
      setLiked(originalState.liked);
      setLikeCount(originalState.likeCount);
      updateInteractionState(currentUser._id, post._id, { liked: originalState.liked, likeCount: originalState.likeCount });
      alert('An error occurred. Please try again.');
    }
  }, [authToken, post?._id, currentUser?._id, liked, likeCount]);

  const handleBookmark = useCallback(async () => {
    if (!authToken || !post?._id || !currentUser?._id) {
      alert("Please login to bookmark posts.");
      return;
    }

    const originalBookmarked = bookmarked;
    const newBookmarkedState = !bookmarked;

    // Optimistic UI update
    setBookmarked(newBookmarkedState);
    updateInteractionState(currentUser._id, post._id, { bookmarked: newBookmarkedState });

    try {
      const result = await (originalBookmarked
        ? userApi.removeFavorite(post._id, authToken)
        : userApi.addFavorite(post._id, authToken)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update bookmark status.');
      }
      // No need to do anything on success, optimistic update is confirmed
    } catch (error) {
      console.error('Failed to update bookmark status:', error);
      // Revert on failure
      setBookmarked(originalBookmarked);
      updateInteractionState(currentUser._id, post._id, { bookmarked: originalBookmarked });
      alert('An error occurred. Please try again.');
    }
  }, [authToken, post?._id, currentUser?._id, bookmarked]);

  return {
    liked,
    likeCount,
    bookmarked,
    loading,
    handleLike,
    handleBookmark,
  };
};

export default usePostInteractions;