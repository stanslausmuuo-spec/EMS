class AppError extends Error {
  constructor(statusCode, code, message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = options.errors || undefined;
    this.details = options.details || undefined;
    this.isOperational = true;
  }

  static badRequest(message = 'Bad request', options) {
    return new AppError(400, 'BAD_REQUEST', message, options);
  }

  static unauthorized(message = 'Not authorized', options) {
    return new AppError(401, 'UNAUTHORIZED', message, options);
  }

  static forbidden(message = 'Forbidden', options) {
    return new AppError(403, 'FORBIDDEN', message, options);
  }

  static notFound(message = 'Resource not found', options) {
    return new AppError(404, 'NOT_FOUND', message, options);
  }

  static conflict(message = 'Resource conflict', options) {
    return new AppError(409, 'CONFLICT', message, options);
  }

  static validation(message = 'Validation failed', options) {
    return new AppError(400, 'VALIDATION_ERROR', message, options);
  }

  static tooManyRequests(message = 'Too many requests', options) {
    return new AppError(429, 'RATE_LIMITED', message, options);
  }

  static internal(message = 'Something went wrong. Please try again.', options) {
    return new AppError(500, 'INTERNAL_ERROR', message, options);
  }
}

module.exports = AppError;