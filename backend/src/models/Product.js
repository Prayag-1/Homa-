const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    sku: { type: String, unique: true, required: true },
    brand: String,
    category: String,
    description: String,
    ingredients: [String],
    howToUse: String,
    benefits: [String],
    price: { type: Number, required: true },
    comparePrice: Number,
    stock: { type: Number, default: 0 },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    skinTypes: [{ type: String, enum: ['Oily', 'Normal', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'] }],
    certifications: [String],
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    seo: {
      metaTitle: { type: String, trim: true, maxlength: 60 },
      metaDescription: { type: String, trim: true, maxlength: 160 },
      focusKeyword: { type: String, trim: true, maxlength: 100 },
      keywords: [{ type: String, trim: true, maxlength: 50 }],
      canonicalUrl: { type: String, trim: true, maxlength: 500 },
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Performance index — added for query optimization
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isBestSeller: 1 });
productSchema.index({ isActive: 1, isNewArrival: 1 });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, brand: 1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index(
  { name: 'text', brand: 'text', description: 'text' },
  { weights: { name: 10, brand: 5, description: 1 }, name: 'product_text_search' },
);

module.exports = mongoose.model('Product', productSchema);
