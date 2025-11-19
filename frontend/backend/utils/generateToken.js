const jwt = require('jsonwebtoken');
const logger = require('./logger');

const generateToken = (id) => {
  logger.debug('Generating token for user ID:', { userId: id });
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d', // Use the environment variable for expiration
  });
};

module.exports = generateToken;