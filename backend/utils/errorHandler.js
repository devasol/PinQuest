/**
 * Standardized response utility
 */

/**
 * Creates a standard error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of validation errors (optional)
 * @param {string} errorType - Type of error for logging purposes
 */
const sendErrorResponse = (res, statusCode, message, errors = [], errorType = 'general') => {
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      timestamp: new Date().toISOString(),
      type: errorType
    })
  });
};

/**
 * Creates a standard success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {Object} meta - Additional metadata (optional)
 */
const sendSuccessResponse = (res, statusCode, data, meta = {}) => {
  res.status(statusCode).json({
    status: 'success',
    data,
    ...(Object.keys(meta).length > 0 && { meta })
  });
};

/**
 * Creates a standard response with custom structure
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} status - Response status ('success', 'error', 'fail')
 * @param {any} data - Response data
 * @param {string} message - Custom message
 * @param {Object} meta - Additional metadata
 */
const sendResponse = (res, statusCode, status, data = null, message = null, meta = {}) => {
  const response = { status };
  
  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (Object.keys(meta).length > 0) response.meta = meta;

  res.status(statusCode).json(response);
};

module.exports = {
  sendErrorResponse,
  sendSuccessResponse,
  sendResponse
};