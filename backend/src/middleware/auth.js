const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(AppError.unauthorized('Not authorized, user not found'));
      }
      req.user = user;
      return next();
    } catch (error) {
      return next(AppError.unauthorized('Not authorized, token failed'));
    }
  }

  if (!token) {
    return next(AppError.unauthorized('Not authorized, no token'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden(`User role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this route`));
    }
    next();
  };
};

module.exports = { protect, authorize };