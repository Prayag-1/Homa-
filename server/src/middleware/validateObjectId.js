const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError(404, 'Resource not found'));
  }
  next();
};

module.exports = validateObjectId;
