const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    imageUrl: String,
    publicId: String,
    link: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
