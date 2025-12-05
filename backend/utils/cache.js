// Simple in-memory cache as fallback when Redis is not available
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  async set(key, value, expiration = 300) { // Default to 5 minutes
    // Clear any existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    // Store the value
    this.cache.set(key, value);

    // Set timeout to remove the key after expiration
    if (expiration > 0) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
      }, expiration * 1000);

      this.timeouts.set(key, timeout);
    }
  }

  async get(key) {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  async del(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
}

const memoryCache = new MemoryCache();

// Enhanced cache manager that uses Redis when available, otherwise falls back to memory
const getCache = async (key) => {
  const redisUtils = require('./redis');
  // Initialize Redis if not already done
  if (process.env.USE_REDIS === 'true' && !redisUtils.isRedisConnected()) {
    await redisUtils.initializeRedis();
  }
  
  if (redisUtils.isRedisConnected()) {
    return await redisUtils.get(key);
  }
  return await memoryCache.get(key);
};

const setCache = async (key, value, expiration = 300) => {
  const redisUtils = require('./redis');
  // Initialize Redis if not already done
  if (process.env.USE_REDIS === 'true' && !redisUtils.isRedisConnected()) {
    await redisUtils.initializeRedis();
  }
  
  if (redisUtils.isRedisConnected()) {
    await redisUtils.set(key, value, expiration);
  } else {
    await memoryCache.set(key, value, expiration);
  }
};

const delCache = async (key) => {
  const redisUtils = require('./redis');
  // Initialize Redis if not already done
  if (process.env.USE_REDIS === 'true' && !redisUtils.isRedisConnected()) {
    await redisUtils.initializeRedis();
  }
  
  if (redisUtils.isRedisConnected()) {
    await redisUtils.del(key);
  } else {
    await memoryCache.del(key);
  }
};

const keysCache = async (pattern) => {
  const redisUtils = require('./redis');
  // Initialize Redis if not already done
  if (process.env.USE_REDIS === 'true' && !redisUtils.isRedisConnected()) {
    await redisUtils.initializeRedis();
  }
  
  if (redisUtils.isRedisConnected()) {
    return await redisUtils.keys(pattern);
  }
  return await memoryCache.keys(pattern);
};

module.exports = {
  get: getCache,
  set: setCache,
  del: delCache,
  keys: keysCache
};