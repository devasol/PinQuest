const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Enhanced health check endpoint
const healthCheck = async (req, res) => {
  try {
    const healthCheck = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Server is running',
      details: {
        database: {
          status: 'UP',
          timestamp: new Date().toISOString()
        },
        server: {
          status: 'UP',
          timestamp: new Date().toISOString()
        }
      }
    };

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      healthCheck.status = 'DOWN';
      healthCheck.details.database.status = 'DOWN';
      healthCheck.details.database.error = 'Database connection failed';
    }

    // Check if we can query the database
    try {
      const User = require('../models/User');
      await User.findOne().select('_id').limit(1); // Just check if we can make a simple query
    } catch (dbError) {
      healthCheck.status = 'DOWN';
      healthCheck.details.database.status = 'DOWN';
      healthCheck.details.database.error = dbError.message;
    }

    res.status(healthCheck.status === 'UP' ? 200 : 503).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Liveness probe - indicates if the application is running and responding
const livenessCheck = async (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    message: 'Application is alive and responding'
  });
};

// Readiness probe - indicates if the application is ready to accept traffic
const readinessCheck = async (req, res) => {
  try {
    // Check if database is ready
    const isDbReady = mongoose.connection.readyState === 1;
    
    const readinessCheck = {
      status: isDbReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: isDbReady ? 'ready' : 'not ready'
      }
    };

    // Add other readiness checks as needed (Redis, external APIs, etc.)
    
    res.status(isDbReady ? 200 : 503).json(readinessCheck);
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Metrics endpoint for basic application metrics
const getMetrics = async (req, res) => {
  try {
    const User = require('../models/User');
    const Post = require('../models/posts');
    
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: {
        usage: process.cpuUsage(),
        platform: process.platform,
        arch: process.arch
      },
      database: {
        userCount,
        postCount
      },
      connections: mongoose.connections.length
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  healthCheck,
  livenessCheck,
  readinessCheck,
  getMetrics
};