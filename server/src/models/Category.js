const mongoose = require('mongoose');
const { generateSlug } = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { url: String, publicId: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name);
  }
  next();
});

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
