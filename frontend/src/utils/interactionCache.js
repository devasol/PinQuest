// Utility to cache post interactions (likes, bookmarks) per user
// This helps maintain interaction states across component mounts/unmounts and page refreshes

const INTERACTION_CACHE_KEY = 'pinquest_interaction_cache';

// Get the interaction cache from localStorage
const getInteractionCache = () => {
  try {
    const cache = localStorage.getItem(INTERACTION_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.error('Error reading interaction cache:', error);
    return {};
  }
};

// Save the interaction cache to localStorage
const saveInteractionCache = (cache) => {
  try {
    localStorage.setItem(INTERACTION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving interaction cache:', error);
  }
};

// Get interaction state for a specific user and post
export const getInteractionState = (userId, postId) => {
  const cache = getInteractionCache();
  const userCache = cache[userId] || {};
  return userCache[postId] || {};
};

// Update interaction state for a specific user and post
export const updateInteractionState = (userId, postId, interactionData) => {
  if (!userId || !postId) return;
  
  const cache = getInteractionCache();
  if (!cache[userId]) {
    cache[userId] = {};
  }
  
  cache[userId][postId] = {
    ...cache[userId][postId],
    ...interactionData,
    updatedAt: Date.now()
  };
  
  saveInteractionCache(cache);
};

// Clear interaction state for a specific user and post
export const clearInteractionState = (userId, postId) => {
  const cache = getInteractionCache();
  if (cache[userId] && cache[userId][postId]) {
    delete cache[userId][postId];
    saveInteractionCache(cache);
  }
};

// Clear all interaction states for a user
export const clearUserInteractions = (userId) => {
  const cache = getInteractionCache();
  if (cache[userId]) {
    delete cache[userId];
    saveInteractionCache(cache);
  }
};

// Clear expired cache entries (older than 24 hours)
export const cleanupExpiredCache = () => {
  const cache = getInteractionCache();
  const now = Date.now();
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  let hasChanges = false;
  
  for (const userId in cache) {
    for (const postId in cache[userId]) {
      const entry = cache[userId][postId];
      if (entry.updatedAt && (now - entry.updatedAt) > EXPIRY_TIME) {
        delete cache[userId][postId];
        hasChanges = true;
      }
    }
    
    // Clean up empty user objects
    if (Object.keys(cache[userId]).length === 0) {
      delete cache[userId];
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    saveInteractionCache(cache);
  }
};

// Run cleanup on module load
cleanupExpiredCache();