const ApiError = require('../utils/ApiError');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (error) {
      next(new ApiError(400, error.message));
    }
  };
};

module.exports = validate;
