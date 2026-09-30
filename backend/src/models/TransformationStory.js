const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const transformationStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    customerName: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    coverImage: { type: imageSchema, default: null },
    beforeImage: { type: imageSchema, default: null },
    afterImage: { type: imageSchema, default: null },
    readTimeMinutes: { type: Number, default: 1 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransformationStory', transformationStorySchema);
