const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateSlug } = require('../utils/slugify');
const { uploadToCloudinary } = require('../middleware/upload');

const MAX_LIMIT = 50;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

const parseTags = (value) => {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const estimateReadTimeMinutes = (content = '') => {
  const words = String(content)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
};

const parseDateInput = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'Published date must be a valid date');
  }

  return date;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildAuthorSearchIds = async (search) => {
  if (!search) return [];

  const authors = await User.find({
    name: { $regex: escapeRegex(search), $options: 'i' },
  }).select('_id');

  return authors.map((author) => author._id);
};

const buildListFilter = async ({ search, category, status, publishedOnly = false }) => {
  const filter = {};

  if (publishedOnly) {
    filter.isPublished = true;
  } else if (status === 'published' || status === 'draft') {
    filter.isPublished = status === 'published';
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    const authorIds = await buildAuthorSearchIds(search);
    filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { excerpt: { $regex: safeSearch, $options: 'i' } },
      { category: { $regex: safeSearch, $options: 'i' } },
    ];

    if (authorIds.length > 0) {
      filter.$or.push({ author: { $in: authorIds } });
    }
  }

  return filter;
};

const serializeBlog = (blog) => {
  if (!blog) return null;

  const author = blog.author && typeof blog.author === 'object'
    ? {
        id: String(blog.author._id || blog.author.id || ''),
        name: blog.author.name || 'Admin',
        avatar: blog.author.avatar || null,
      }
    : {
        id: blog.author ? String(blog.author) : '',
        name: 'Admin',
        avatar: null,
      };

  const tags = Array.isArray(blog.tags) ? blog.tags.filter(Boolean) : [];

  return {
    id: String(blog._id || blog.id || ''),
    title: blog.title || '',
    slug: blog.slug || '',
    excerpt: blog.excerpt || '',
    content: blog.content || '',
    coverImage: blog.coverImage || null,
    category: blog.category || '',
    tags,
    status: blog.isPublished ? 'published' : 'draft',
    author,
    readTimeMinutes: Number(blog.readTimeMinutes || estimateReadTimeMinutes(blog.content)),
    publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
    createdAt: blog.createdAt ? new Date(blog.createdAt).toISOString() : null,
    updatedAt: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : null,
  };
};

const attachCoverImage = async (req) => {
  if (!req.file) return null;
  if (!hasCloudinaryConfig) {
    throw new ApiError(400, 'Image upload is not configured. Use a cover image URL instead.');
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    'blogs',
    `blog-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  return result.url;
};

const ensureUniqueSlug = async (slug, excludeId = null) => {
  const existing = await Blog.findOne({
    slug,
    _id: { $ne: excludeId },
  }).select('_id');

  if (existing) {
    throw new ApiError(400, `Slug "${slug}" already exists`);
  }
};

const resolveSlug = async (title, providedSlug, excludeId = null) => {
  const baseSlug = String(providedSlug || '').trim() || generateSlug(title || '');
  const slug = baseSlug || generateSlug(`blog-${Date.now()}`);
  await ensureUniqueSlug(slug, excludeId);
  return slug;
};

const buildBlogPayload = async (req, existingBlog = null) => {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const status = req.body.status === 'published' ? 'published' : 'draft';
  const slug = await resolveSlug(title, req.body.slug, existingBlog?._id || null);
  const publishedAt = status === 'published'
    ? (parseDateInput(req.body.publishedAt) || existingBlog?.publishedAt || new Date())
    : (parseDateInput(req.body.publishedAt) || existingBlog?.publishedAt || null);
  const coverImage = req.file
    ? await attachCoverImage(req)
    : String(req.body.coverImage || existingBlog?.coverImage || '').trim() || null;

  return {
    title,
    slug,
    excerpt: String(req.body.excerpt || '').trim(),
    content,
    category: String(req.body.category || '').trim(),
    tags: parseTags(req.body.tags),
    coverImage,
    readTimeMinutes: estimateReadTimeMinutes(content),
    isPublished: status === 'published',
    publishedAt: status === 'published' ? publishedAt : null,
    author: req.user?._id || existingBlog?.author,
  };
};

exports.getBlogs = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 10, sort = '-publishedAt' } = req.query;

    const filter = await buildListFilter({
      search,
      category,
      status,
      publishedOnly: true,
    });

    const pageNum = toPositiveInt(page, 1);
    const safeLimit = Math.max(Math.min(toPositiveInt(limit, 10), MAX_LIMIT), 1);
    const skip = (pageNum - 1) * safeLimit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: blogs.map(serializeBlog),
        total,
        page: pageNum,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
      message: '',
    });
  } catch (err) {
    if (err?.statusCode !== 400) {
      console.error('Blog create failed:', err);
    }
    next(err);
  }
};

exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'name avatar')
      .lean();

    if (!blog) {
      return next(new ApiError(404, 'Blog not found'));
    }

    return res.json({
      success: true,
      data: serializeBlog(blog),
      message: '',
    });
  } catch (err) {
    if (err?.statusCode !== 400) {
      console.error('Blog update failed:', err);
    }
    next(err);
  }
};

exports.adminGetBlogs = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const filter = await buildListFilter({
      search,
      category,
      status,
      publishedOnly: false,
    });

    const pageNum = toPositiveInt(page, 1);
    const safeLimit = Math.max(Math.min(toPositiveInt(limit, 10), MAX_LIMIT), 1);
    const skip = (pageNum - 1) * safeLimit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: blogs.map(serializeBlog),
        total,
        page: pageNum,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminGetBlog = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Blog not found'));
    }

    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name avatar')
      .lean();

    if (!blog) {
      return next(new ApiError(404, 'Blog not found'));
    }

    return res.json({
      success: true,
      data: serializeBlog(blog),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateBlog = async (req, res, next) => {
  try {
    const payload = await buildBlogPayload(req);

    if (!payload.title) {
      return next(new ApiError(400, 'Title is required'));
    }

    if (!payload.slug) {
      return next(new ApiError(400, 'Slug is required'));
    }

    if (!payload.excerpt) {
      return next(new ApiError(400, 'Excerpt is required'));
    }

    if (!payload.content) {
      return next(new ApiError(400, 'Content is required'));
    }

    const blog = await Blog.create(payload);
    const populated = await Blog.findById(blog._id).populate('author', 'name avatar').lean();

    return res.status(201).json({
      success: true,
      data: serializeBlog(populated),
      message: 'Blog created successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateBlog = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Blog not found'));
    }

    const existingBlog = await Blog.findById(req.params.id);

    if (!existingBlog) {
      return next(new ApiError(404, 'Blog not found'));
    }

    const payload = await buildBlogPayload(req, existingBlog);

    if (!payload.title) {
      return next(new ApiError(400, 'Title is required'));
    }

    if (!payload.slug) {
      return next(new ApiError(400, 'Slug is required'));
    }

    if (!payload.excerpt) {
      return next(new ApiError(400, 'Excerpt is required'));
    }

    if (!payload.content) {
      return next(new ApiError(400, 'Content is required'));
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate('author', 'name avatar').lean();

    return res.json({
      success: true,
      data: serializeBlog(updated),
      message: 'Blog updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteBlog = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Blog not found'));
    }

    const deleted = await Blog.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return next(new ApiError(404, 'Blog not found'));
    }

    return res.json({
      success: true,
      data: null,
      message: 'Blog deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminTogglePublish = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Blog not found'));
    }

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return next(new ApiError(404, 'Blog not found'));
    }

    blog.isPublished = !blog.isPublished;
    if (blog.isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    await blog.save();

    const populated = await Blog.findById(blog._id).populate('author', 'name avatar').lean();

    return res.json({
      success: true,
      data: serializeBlog(populated),
      message: `Blog ${blog.isPublished ? 'published' : 'unpublished'}`,
    });
  } catch (err) {
    next(err);
  }
};
