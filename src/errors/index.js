class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Custom error for validation errors
class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

// Custom error for not found resources
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

// Custom error for unauthorized access
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized Access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

// Custom error for forbidden access
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden Access') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// Custom error for duplicate resources
class DuplicateResourceError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} already exists`, 409);
    this.name = 'DuplicateResourceError';
  }
}

// Custom error for bad requests
class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DuplicateResourceError,
  BadRequestError
};