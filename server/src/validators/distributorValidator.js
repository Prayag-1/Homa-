const Joi = require('joi');

const baseDistributorSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  address: Joi.string().trim().max(255).optional().allow(''),
  phone: Joi.string().trim().max(50).optional().allow(''),
  email: Joi.string().trim().email().max(120).optional().allow(''),
  coverageArea: Joi.string().trim().max(160).optional().allow(''),
  representative: Joi.string().trim().max(120).optional().allow(''),
  isActive: Joi.boolean().optional(),
}).options({ stripUnknown: true });

const distributorSchema = baseDistributorSchema;
const distributorUpdateSchema = baseDistributorSchema.fork(['name'], (field) => field.optional());

module.exports = {
  distributorSchema,
  distributorUpdateSchema,
};
