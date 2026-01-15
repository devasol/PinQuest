const logger = require('./logger');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new Error(message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(['"])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new Error(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new Error(message);
};

const handleJWTError = () =>
  new Error('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new Error('Your token has expired! Please log in again.');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

const sendSuccessResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const sendErrorResponse = (res, statusCode, message, errors = null) => {
  res.status(statusCode).json({
    status: 'error',
    message,
    errors,
  });
};

// Error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Export the functions and middleware separately
module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  globalErrorHandler
};
