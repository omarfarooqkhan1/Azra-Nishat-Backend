const logger = require('../utils/logger');
const { AppError } = require('../errors');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Application Error', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : null
  });

  // If operational error, send error to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors || undefined,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: err.timestamp
    });
  } else {
    // Programming or unknown error - don't leak error details
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

module.exports = errorHandler;