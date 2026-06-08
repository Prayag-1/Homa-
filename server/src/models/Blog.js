const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    category: String,
    tags: [{ type: String, trim: true }],
    content: String,
    excerpt: String,
    coverImage: String,
    readTimeMinutes: { type: Number, default: 1 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
