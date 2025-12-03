const redis = require('redis');
const logger = require('./logger');

let redisClient;

// Initialize Redis client with error handling
const initializeRedis = async () => {
  try {
    // Use REDIS_URL from environment or default to localhost
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      legacyMode: true, // Use legacy mode for compatibility
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection refused. Continuing without Redis cache.');
          return null; // Don't retry if connection is refused
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted. Disconnecting.');
          return null;
        }
        // Exponential backoff
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });

    // Connect to Redis (only if we're not skipping it due to connection issues)
    await redisClient.connect().catch(err => {
      logger.warn('Could not connect to Redis, continuing without cache:', err.message);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.error('Error initializing Redis:', error);
    return null; // Return null to indicate Redis is not available
  }
};

// Cache operations with fallback
const set = async (key, value, expiration = 3600) => { // Default to 1 hour
  if (!redisClient) return;

  try {
    await redisClient.setEx(key, expiration, JSON.stringify(value));
  } catch (error) {
    logger.error('Error setting cache:', error);
  }
};

const get = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error getting from cache:', error);
    return null;
  }
};

const del = async (key) => {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Error deleting from cache:', error);
  }
};

const keys = async (pattern) => {
  if (!redisClient) return [];

  try {
    return await redisClient.keys(pattern);
  } catch (error) {
    logger.error('Error getting keys from cache:', error);
    return [];
  }
};

// Initialize Redis when module is loaded
initializeRedis();

module.exports = {
  redisClient,
  set,
  get,
  del,
  keys,
  initializeRedis
};