// Simple in-memory cache implementation
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map(); // Store timeout references for expiration
  }

  // Set a value in cache with optional expiration (in seconds)
  set(key, value, ttl = 300) { // Default TTL: 5 minutes
    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    // Set the value
    this.cache.set(key, value);

    // Set expiration if TTL is provided
    if (ttl > 0) {
      const timeout = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);

      this.timeouts.set(key, timeout);
    }
  }

  // Get a value from cache
  get(key) {
    return this.cache.get(key);
  }

  // Check if a key exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Delete a value from cache
  delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
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

// Create a singleton instance
const cache = new InMemoryCache();

module.exports = cache;