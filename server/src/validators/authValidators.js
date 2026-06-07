const Joi = require('joi');
const contactMethod = Joi.string().valid('email', 'phone').required();

const phoneNumber = Joi.string()
  .trim()
  .pattern(/^\+?[1-9]\d{9,14}$/)
  .messages({
    'string.pattern.base': 'Phone number must be a valid international phone number',
  });

const email = Joi.string().trim().email().messages({
  'string.email': 'Email must be valid',
});

const password = Joi.string().min(8).max(128).required().messages({
  'string.min': 'Password must be at least 8 characters long',
});

const address = Joi.object({
  line1: Joi.string().trim().min(3).max(120).required(),
  line2: Joi.string().trim().max(120).allow('', null),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().min(2).max(80).required(),
  postalCode: Joi.string().trim().min(3).max(20).required(),
  country: Joi.string().trim().min(2).max(80).required(),
}).required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  verificationMethod: contactMethod.optional(),
  email: email.optional().allow('', null),
  phoneNumber: phoneNumber.required().messages({
    'any.required': 'Phone number is required',
    'string.empty': 'Phone number is required',
  }),
  password,
  birthday: Joi.date().max('now').required().messages({
    'date.max': 'Birthday must be a past date',
  }),
  address,
});

const loginSchema = Joi.object({
  identifier: Joi.string().trim().required(),
  password,
});

const verifySchema = Joi.object({
  verificationMethod: contactMethod.optional(),
  target: Joi.string().trim().required(),
  code: Joi.string().trim().pattern(/^\d{6}$/).required(),
});

const resendSchema = Joi.object({
  verificationMethod: contactMethod.optional(),
  target: Joi.string().trim().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifySchema,
  resendSchema,
};
