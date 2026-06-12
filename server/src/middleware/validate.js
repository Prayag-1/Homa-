const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
};

module.exports = validate;
