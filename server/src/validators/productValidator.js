const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const SKIN_TYPES = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
const CATEGORIES = ['Moisturiser', 'Serum', 'Toner', 'Sunscreen', 'Cleanser', 'Eye Care', 'Mask', 'Essence'];
const ARRAY_FIELDS = ['benefits', 'skinTypes', 'certifications', 'keepImages'];

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  sku: Joi.string().trim().uppercase().min(2).max(50).required(),
  brand: Joi.string().trim().min(1).max(100).required(),
  category: Joi.string().valid(...CATEGORIES).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  ingredients: Joi.string().trim().max(5000).optional().allow(''),
  benefits: Joi.array().items(Joi.string().trim().max(200)).max(20).optional(),
  howToUse: Joi.string().trim().max(2000).optional().allow(''),
  price: Joi.number().positive().max(999999).required(),
  comparePrice: Joi.number().positive().max(999999).optional().allow(null),
  stock: Joi.number().integer().min(0).max(99999).required(),
  skinTypes: Joi.array().items(Joi.string().valid(...SKIN_TYPES)).min(1).required(),
  certifications: Joi.array().items(Joi.string().trim().max(100)).max(10).optional(),
  isNewArrival: Joi.boolean().optional(),
  isBestSeller: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  keepImages: Joi.array().items(Joi.string().trim()).optional(),
}).options({ stripUnknown: true });

const updateProductSchema = createProductSchema.fork(
  ['name', 'sku', 'brand', 'category', 'description', 'price', 'stock', 'skinTypes'],
  (field) => field.optional(),
);

const parseArrayFields = (body) => {
  const parsed = { ...body };

  for (const field of ARRAY_FIELDS) {
    if (typeof parsed[field] !== 'string') continue;

    try {
      parsed[field] = JSON.parse(parsed[field]);
    } catch {
      parsed[field] = [];
    }
  }

  return parsed;
};

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(parseArrayFields(req.body), { abortEarly: false });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(', ');
    return next(new ApiError(400, message));
  }

  req.body = value;
  next();
};

module.exports = { createProductSchema, updateProductSchema, validate };
