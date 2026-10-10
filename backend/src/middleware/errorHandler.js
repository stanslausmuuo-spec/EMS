const AppError = require('../utils/AppError');

const mapKnownError = (err) => {
  if (err instanceof AppError) return err;
  if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
    return AppError.badRequest('Invalid JSON body');
  }
  if (err && err.name === 'ZodError') {
    return AppError.validation('Validation failed', {
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  if (err && err.name === 'CastError') {
    return AppError.badRequest('Invalid request parameter');
  }
  if (err && err.name === 'ValidationError') {
    const errors = Object.entries(err.errors || {}).map(([path, e]) => ({
      path,
      message: e && e.message ? e.message : 'Invalid value',
    }));
    return AppError.validation('Validation failed', { errors });
  }
  if (err && err.name === 'MongoServerError' && err.code === 11000) {
    return AppError.conflict('A resource with this value already exists');
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return AppError.badRequest('File is too large');
  }
  return null;
};

const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unassigned';
  const mapped = mapKnownError(err) || AppError.internal();

  if (!mapped.isOperational || mapped.statusCode >= 500) {
    console.error(`[${requestId}] ${err.stack || err.message || err}`);
  }

  const body = {
    success: false,
    code: mapped.code,
    message: mapped.message,
  };
  if (mapped.errors) body.errors = mapped.errors;
  if (mapped.details) body.details = mapped.details;

  if (res.headersSent) {
    return next(err);
  }
  return res.status(mapped.statusCode).json(body);
};

module.exports = errorHandler;