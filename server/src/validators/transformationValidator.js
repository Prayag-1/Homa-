const Joi = require('joi');

const SLUG_PATTERN = /^[-a-z0-9]+(?:-[-a-z0-9]+)*$/;

const baseSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  slug: Joi.string().trim().min(1).max(220).pattern(SLUG_PATTERN).required(),
  excerpt: Joi.string().trim().min(1).max(300).required(),
  content: Joi.string().trim().min(1).required(),
  category: Joi.string().trim().min(2).max(80).required(),
  customerName: Joi.string().trim().max(120).allow('').optional(),
  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim().max(40)).max(10),
      Joi.string().trim(),
    )
    .optional(),
  status: Joi.string().valid('draft', 'published').default('draft'),
  publishedAt: Joi.alternatives().try(Joi.string().allow(''), Joi.date().iso()).optional(),
  coverImageUrl: Joi.string().trim().uri().allow('').optional(),
  coverImagePublicId: Joi.string().trim().allow('').optional(),
  beforeImageUrl: Joi.string().trim().uri().allow('').optional(),
  beforeImagePublicId: Joi.string().trim().allow('').optional(),
  afterImageUrl: Joi.string().trim().uri().allow('').optional(),
  afterImagePublicId: Joi.string().trim().allow('').optional(),
});

module.exports = {
  transformationSchema: baseSchema,
  transformationUpdateSchema: baseSchema.fork(['title', 'slug', 'excerpt', 'content', 'category'], (field) => field.optional()),
};
