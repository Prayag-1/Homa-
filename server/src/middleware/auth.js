const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return next(new ApiError(401, 'Authentication required'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Session expired. Please log in again.'));
      }
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      return next(new ApiError(401, 'User account not found'));
    }
    if (!user.isActive) {
      return next(new ApiError(401, 'Account has been deactivated'));
    }
    if (!user.isVerified) {
      return next(new ApiError(403, 'Account not verified'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};

module.exports = { protect, adminOnly };
