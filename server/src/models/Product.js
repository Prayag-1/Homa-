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
    skinTypes: [{ type: String, enum: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'] }],
    certifications: [String],
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
