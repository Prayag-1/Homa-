const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const brandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  sortOrder: Joi.number().integer().min(0).max(9999).optional(),
  isActive: Joi.boolean().optional(),
}).options({ stripUnknown: true });

const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).optional().allow(''),
  sortOrder: Joi.number().integer().min(0).max(9999).optional(),
  isActive: Joi.boolean().optional(),
}).options({ stripUnknown: true });

const brandUpdateSchema = brandSchema.fork(['name'], (field) => field.optional());
const categoryUpdateSchema = categorySchema.fork(['name'], (field) => field.optional());

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return next(new ApiError(400, message));
  }

  req.body = value;
  next();
};

module.exports = {
  brandSchema,
  brandUpdateSchema,
  categorySchema,
  categoryUpdateSchema,
  validate,
};
