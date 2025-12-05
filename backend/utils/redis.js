const redis = require("redis");
const logger = require("./logger");

let redisClient = null;
let isRedisConnected = false;
let isInitialized = false; // Flag to prevent multiple initializations

// Initialize Redis client with error handling
const initializeRedis = async () => {
  // Prevent multiple initializations
  if (isInitialized) {
    return redisClient;
  }

  isInitialized = true;

  try {
    // Check if we should use Redis based on environment variable
    // Only enable Redis if USE_REDIS is explicitly set to 'true'
    const useRedis = process.env.USE_REDIS === "true";
    if (!useRedis) {
      logger.info("Redis disabled via environment variable or default");
      return null;
    }

    // Use REDIS_URL from environment or default to localhost
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

    redisClient = redis.createClient({
      url: redisUrl,
      retry_strategy: (times) => {
        // Stop retrying after 3 attempts to avoid constant reconnections
        if (times >= 3) {
          logger.warn(
            "Maximum Redis connection attempts reached, stopping retries"
          );
          return null;
        }
        // Retry after 2 seconds
        return 2000;
      },
    });

    redisClient.on("error", (err) => {
      logger.warn(
        "Redis Client Error (continuing without Redis):",
        err.message
      );
      isRedisConnected = false;

      // Prevent continuous reconnection attempts after max retries
      redisClient.quit().catch(console.error);
    });

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
      isRedisConnected = true;
    });

    redisClient.on("reconnecting", () => {
      logger.info("Reconnecting to Redis...");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client is ready");
      isRedisConnected = true;
    });

    // Connect to Redis
    await redisClient.connect().catch((err) => {
      logger.warn(
        "Could not connect to Redis, continuing without cache:",
        err.message
      );
      redisClient = null;
      isRedisConnected = false;
      isInitialized = false; // Reset flag to allow re-initialization if needed
      return null;
    });

    return redisClient;
  } catch (error) {
    logger.warn(
      "Could not connect to Redis, continuing without cache:",
      error.message
    );
    redisClient = null;
    isRedisConnected = false;
    isInitialized = false; // Reset flag to allow re-initialization if needed
    return null; // Return null to indicate Redis is not available
  }
};

// Cache operations with fallback
const set = async (key, value, expiration = 3600) => {
  // Default to 1 hour
  if (!redisClient || !isRedisConnected) {
    // Silently fail if Redis is not available
    return Promise.resolve();
  }

  try {
    await redisClient.setEx(key, expiration, JSON.stringify(value));
  } catch (error) {
    logger.warn(
      "Error setting cache (continuing without Redis):",
      error.message
    );
    // Don't throw error, just continue without cache
  }
};

const get = async (key) => {
  if (!redisClient || !isRedisConnected) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn(
      "Error getting from cache (continuing without Redis):",
      error.message
    );
    return null;
  }
};

const del = async (key) => {
  if (!redisClient || !isRedisConnected) {
    return Promise.resolve();
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.warn(
      "Error deleting from cache (continuing without Redis):",
      error.message
    );
  }
};

const keys = async (pattern) => {
  if (!redisClient || !isRedisConnected) {
    return [];
  }

  try {
    // Use KEYS command with pattern
    return await redisClient.keys(pattern);
  } catch (error) {
    logger.warn(
      "Error getting keys from cache (continuing without Redis):",
      error.message
    );
    return [];
  }
};

// Initialize Redis when module is loaded (only in environments that support Redis)
// Skip initialization in modules that are imported multiple times
// The consumer of this module should call initializeRedis() explicitly when needed
// initializeRedis();

module.exports = {
  redisClient,
  set,
  get,
  del,
  keys,
  initializeRedis,
  isRedisConnected: () => isRedisConnected,
};
