const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const TransformationStory = require('../models/TransformationStory');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateSlug } = require('../utils/slugify');
const { uploadToCloudinary } = require('../middleware/upload');

const MAX_LIMIT = 50;

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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
      { customerName: { $regex: safeSearch, $options: 'i' } },
    ];

    if (authorIds.length > 0) {
      filter.$or.push({ author: { $in: authorIds } });
    }
  }

  return filter;
};

const serializeImage = (image) => {
  if (!image) return null;
  return {
    url: image.url || '',
    publicId: image.publicId || null,
  };
};

const serializeStory = (story) => {
  if (!story) return null;

  const author = story.author && typeof story.author === 'object'
    ? {
        id: String(story.author._id || story.author.id || ''),
        name: story.author.name || 'Admin',
        avatar: story.author.avatar || null,
      }
    : {
        id: story.author ? String(story.author) : '',
        name: 'Admin',
        avatar: null,
      };

  return {
    id: String(story._id || story.id || ''),
    title: story.title || '',
    slug: story.slug || '',
    excerpt: story.excerpt || '',
    content: story.content || '',
    category: story.category || '',
    customerName: story.customerName || '',
    tags: Array.isArray(story.tags) ? story.tags.filter(Boolean) : [],
    coverImage: serializeImage(story.coverImage),
    beforeImage: serializeImage(story.beforeImage),
    afterImage: serializeImage(story.afterImage),
    status: story.isPublished ? 'published' : 'draft',
    author,
    readTimeMinutes: Number(story.readTimeMinutes || estimateReadTimeMinutes(story.content)),
    publishedAt: story.publishedAt ? new Date(story.publishedAt).toISOString() : null,
    createdAt: story.createdAt ? new Date(story.createdAt).toISOString() : null,
    updatedAt: story.updatedAt ? new Date(story.updatedAt).toISOString() : null,
  };
};

const getFiles = (req) => req.files || {};
const getFile = (files, fieldName) => (files[fieldName] && files[fieldName][0]) || null;

const uploadImage = async (file, folder) => {
  if (!file) return null;
  if (!hasCloudinaryConfig) {
    throw new ApiError(400, 'Image upload is not configured. Please use Cloudinary credentials.');
  }

  const result = await uploadToCloudinary(
    file.buffer,
    folder,
    `${folder}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  return {
    url: result.url,
    publicId: result.publicId,
  };
};

const destroyImage = async (image) => {
  if (image?.publicId) {
    await cloudinary.uploader.destroy(image.publicId);
  }
};

const ensureUniqueSlug = async (slug, excludeId = null) => {
  const existing = await TransformationStory.findOne({
    slug,
    _id: { $ne: excludeId },
  }).select('_id');

  if (existing) {
    throw new ApiError(400, `Slug "${slug}" already exists`);
  }
};

const resolveSlug = async (title, providedSlug, excludeId = null) => {
  const baseSlug = String(providedSlug || '').trim() || generateSlug(title || '');
  const slug = baseSlug || generateSlug(`transformation-${Date.now()}`);
  await ensureUniqueSlug(slug, excludeId);
  return slug;
};

const pickResolvedImage = async ({
  file,
  folder,
  existing,
  urlField,
  publicIdField,
  fallbackToExisting = true,
}) => {
  if (file) {
    const uploaded = await uploadImage(file, folder);
    if (existing?.publicId && existing.publicId !== uploaded.publicId) {
      await destroyImage(existing);
    }
    return uploaded;
  }

  const url = String(urlField || '').trim();
  const publicId = String(publicIdField || '').trim() || null;

  if (url) {
    return { url, publicId };
  }

  if (fallbackToExisting && existing) {
    return existing;
  }

  return null;
};

const buildPayload = async (req, existingStory = null) => {
  const files = getFiles(req);
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const status = req.body.status === 'published' ? 'published' : 'draft';
  const slug = await resolveSlug(title, req.body.slug, existingStory?._id || null);
  const publishedAt = status === 'published'
    ? (parseDateInput(req.body.publishedAt) || existingStory?.publishedAt || new Date())
    : (parseDateInput(req.body.publishedAt) || existingStory?.publishedAt || null);

  const beforeImage = await pickResolvedImage({
    file: getFile(files, 'beforeImageFile'),
    folder: 'transformations',
    existing: existingStory?.beforeImage || null,
    urlField: req.body.beforeImageUrl,
    publicIdField: req.body.beforeImagePublicId,
  });

  const afterImage = await pickResolvedImage({
    file: getFile(files, 'afterImageFile'),
    folder: 'transformations',
    existing: existingStory?.afterImage || null,
    urlField: req.body.afterImageUrl,
    publicIdField: req.body.afterImagePublicId,
  });

  const coverImage = await pickResolvedImage({
    file: getFile(files, 'coverImageFile'),
    folder: 'transformations',
    existing: existingStory?.coverImage || null,
    urlField: req.body.coverImageUrl,
    publicIdField: req.body.coverImagePublicId,
    fallbackToExisting: Boolean(existingStory),
  });

  return {
    title,
    slug,
    excerpt: String(req.body.excerpt || '').trim(),
    content,
    category: String(req.body.category || '').trim(),
    customerName: String(req.body.customerName || '').trim(),
    tags: parseTags(req.body.tags),
    coverImage,
    beforeImage,
    afterImage,
    readTimeMinutes: estimateReadTimeMinutes(content),
    isPublished: status === 'published',
    publishedAt: status === 'published' ? publishedAt : null,
    author: req.user?._id || existingStory?.author,
  };
};

const validateRequiredImages = (payload) => {
  if (!payload.beforeImage?.url) {
    throw new ApiError(400, 'Before image is required');
  }
  if (!payload.afterImage?.url) {
    throw new ApiError(400, 'After image is required');
  }
};

exports.getTransformationStories = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 9, sort = '-publishedAt' } = req.query;
    const filter = await buildListFilter({
      search,
      category,
      publishedOnly: true,
    });

    const pageNum = toPositiveInt(page, 1);
    const safeLimit = Math.max(Math.min(toPositiveInt(limit, 9), MAX_LIMIT), 1);
    const skip = (pageNum - 1) * safeLimit;

    const [stories, total] = await Promise.all([
      TransformationStory.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      TransformationStory.countDocuments(filter),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.json({
      success: true,
      data: {
        items: stories.map(serializeStory),
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

exports.getTransformationStoryBySlug = async (req, res, next) => {
  try {
    const story = await TransformationStory.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'name avatar')
      .lean();

    if (!story) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    return res.json({
      success: true,
      data: serializeStory(story),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.getRelatedTransformationStories = async (req, res, next) => {
  try {
    const story = await TransformationStory.findOne({ slug: req.params.slug, isPublished: true }).lean();

    if (!story) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const relatedStories = await TransformationStory.find({
      isPublished: true,
      category: story.category,
      _id: { $ne: story._id },
    })
      .populate('author', 'name avatar')
      .sort('-publishedAt')
      .limit(3)
      .lean();

    return res.json({
      success: true,
      data: relatedStories.map(serializeStory),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminGetTransformationStories = async (req, res, next) => {
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

    const [stories, total] = await Promise.all([
      TransformationStory.find(filter)
        .populate('author', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      TransformationStory.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: stories.map(serializeStory),
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

exports.adminGetTransformationStory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const story = await TransformationStory.findById(req.params.id)
      .populate('author', 'name avatar')
      .lean();

    if (!story) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    return res.json({
      success: true,
      data: serializeStory(story),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateTransformationStory = async (req, res, next) => {
  try {
    const payload = await buildPayload(req);

    if (!payload.title) return next(new ApiError(400, 'Title is required'));
    if (!payload.slug) return next(new ApiError(400, 'Slug is required'));
    if (!payload.excerpt) return next(new ApiError(400, 'Excerpt is required'));
    if (!payload.content) return next(new ApiError(400, 'Content is required'));
    if (!payload.category) return next(new ApiError(400, 'Category is required'));
    validateRequiredImages(payload);

    const story = await TransformationStory.create(payload);
    const populated = await TransformationStory.findById(story._id).populate('author', 'name avatar').lean();

    return res.status(201).json({
      success: true,
      data: serializeStory(populated),
      message: 'Transformation story created successfully',
    });
  } catch (err) {
    if (err?.statusCode !== 400) {
      console.error('Transformation story create failed:', err);
    }
    next(err);
  }
};

exports.adminUpdateTransformationStory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const existingStory = await TransformationStory.findById(req.params.id);

    if (!existingStory) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const payload = await buildPayload(req, existingStory);

    if (!payload.title) return next(new ApiError(400, 'Title is required'));
    if (!payload.slug) return next(new ApiError(400, 'Slug is required'));
    if (!payload.excerpt) return next(new ApiError(400, 'Excerpt is required'));
    if (!payload.content) return next(new ApiError(400, 'Content is required'));
    if (!payload.category) return next(new ApiError(400, 'Category is required'));
    validateRequiredImages(payload);

    const updated = await TransformationStory.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate('author', 'name avatar').lean();

    return res.json({
      success: true,
      data: serializeStory(updated),
      message: 'Transformation story updated successfully',
    });
  } catch (err) {
    if (err?.statusCode !== 400) {
      console.error('Transformation story update failed:', err);
    }
    next(err);
  }
};

exports.adminDeleteTransformationStory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const deleted = await TransformationStory.findByIdAndDelete(req.params.id).lean();

    if (!deleted) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    await Promise.all([
      destroyImage(deleted.coverImage),
      destroyImage(deleted.beforeImage),
      destroyImage(deleted.afterImage),
    ]);

    return res.json({
      success: true,
      data: null,
      message: 'Transformation story deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminTogglePublishTransformationStory = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    const story = await TransformationStory.findById(req.params.id);

    if (!story) {
      return next(new ApiError(404, 'Transformation story not found'));
    }

    story.isPublished = !story.isPublished;
    if (story.isPublished && !story.publishedAt) {
      story.publishedAt = new Date();
    }
    await story.save();

    const populated = await TransformationStory.findById(story._id).populate('author', 'name avatar').lean();

    return res.json({
      success: true,
      data: serializeStory(populated),
      message: `Transformation story ${story.isPublished ? 'published' : 'unpublished'}`,
    });
  } catch (err) {
    next(err);
  }
};
