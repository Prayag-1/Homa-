const Joi = require('joi');
const Banner = require('../models/Banner');
const ApiError = require('../utils/ApiError');
const { deleteUploadedFile, uploadToMongo } = require('../middleware/upload');
const { sanitizeString } = require('../utils/sanitize');

const bannerLinkSchema = Joi.alternatives()
  .try(
    Joi.string().uri(),
    Joi.string().pattern(/^\/[^\s]*$/),
  )
  .optional()
  .allow('');

const serializeBanner = (banner) => ({
  id: String(banner._id || banner.id || ''),
  title: banner.title || '',
  imageUrl: banner.imageUrl || '',
  publicId: banner.publicId || '',
  link: banner.link || '',
  isActive: banner.isActive !== false,
  sortOrder: Number(banner.sortOrder || 0),
  createdAt: banner.createdAt ? new Date(banner.createdAt).toISOString() : null,
  updatedAt: banner.updatedAt ? new Date(banner.updatedAt).toISOString() : null,
});

const getPublicBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: banners.map(serializeBanner),
      message: 'Banners retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getAdminBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

    res.json({
      success: true,
      data: banners.map(serializeBanner),
      message: 'Admin banners retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const schema = Joi.object({
      title: Joi.string().max(80).allow('').optional(),
      link: bannerLinkSchema,
      isActive: Joi.boolean().default(true),
      sortOrder: Joi.number().integer().default(0),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    if (!req.file) {
      return next(new ApiError(400, 'Banner image is required'));
    }

    const uploaded = await uploadToMongo(req.file.buffer, 'banners');
    const banner = await Banner.create({
      title: sanitizeString(value.title) || '',
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      link: value.link || '',
      isActive: value.isActive,
      sortOrder: value.sortOrder,
    });

    res.status(201).json({
      success: true,
      data: serializeBanner(banner),
      message: 'Banner created successfully',
    });
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return next(new ApiError(404, 'Banner not found'));

    const schema = Joi.object({
      title: Joi.string().max(80).allow('').optional(),
      link: bannerLinkSchema,
      isActive: Joi.boolean().optional(),
      sortOrder: Joi.number().integer().optional(),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    if (req.file) {
      const uploaded = await uploadToMongo(req.file.buffer, 'banners');
      if (banner.publicId || banner.imageUrl) {
        await deleteUploadedFile(banner.publicId || banner.imageUrl);
      }
      banner.imageUrl = uploaded.url;
      banner.publicId = uploaded.publicId;
    }

    if (value.title !== undefined) banner.title = sanitizeString(value.title) || '';
    if (value.link !== undefined) banner.link = value.link || '';
    if (typeof value.isActive === 'boolean') banner.isActive = value.isActive;
    if (typeof value.sortOrder === 'number') banner.sortOrder = value.sortOrder;

    await banner.save();

    res.json({
      success: true,
      data: serializeBanner(banner),
      message: 'Banner updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return next(new ApiError(404, 'Banner not found'));

    if (banner.publicId || banner.imageUrl) {
      await deleteUploadedFile(banner.publicId || banner.imageUrl);
    }

    await banner.deleteOne();

    res.json({
      success: true,
      data: null,
      message: 'Banner deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
