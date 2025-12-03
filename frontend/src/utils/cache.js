// frontend/src/utils/cache.js
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  // Set a value in cache with TTL (time-to-live) in seconds
  set(key, value, ttl = 300) { // Default 5 minutes
    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    // Store the value
    this.cache.set(key, value);

    // Set timeout to remove the key after TTL
    const timeout = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timeouts.set(key, timeout);
  }

  // Get a value from cache
  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  // Check if a key exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Delete a key from cache
  delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

// Create a single instance for the app
const cacheManager = new CacheManager();

export default cacheManager;