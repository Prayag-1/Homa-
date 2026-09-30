const Joi = require('joi');

const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'string.length': 'Invalid product ID format',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

const shippingAddressSchema = Joi.object({
  street: Joi.string().trim().min(3).max(120).required().messages({
    'string.empty': 'Street address is required',
  }),
  city: Joi.string().trim().min(2).max(80).required().messages({
    'string.empty': 'City is required',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{9,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid phone number',
      'string.empty': 'Phone number is required',
    }),
});

const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required in the order',
    'any.required': 'Order items are required',
  }),
  shippingAddress: shippingAddressSchema.required().messages({
    'any.required': 'Shipping address is required',
  }),
  paymentMethod: Joi.string().valid('qr', 'esewa', 'fonepay', 'cod').required().messages({
    'any.only': 'Invalid payment method selected',
    'any.required': 'Payment method is required',
  }),
  couponCode: Joi.string().trim().uppercase().allow('', null),
  notes: Joi.string().trim().max(500).allow('', null),
});

module.exports = {
  createOrderSchema,
};
