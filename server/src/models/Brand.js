const mongoose = require('mongoose');
const { generateSlug } = require('../utils/slugify');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500 },
    logo: { url: String, publicId: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

brandSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  }
  next();
});

brandSchema.index({ slug: 1 });
brandSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Brand', brandSchema);
