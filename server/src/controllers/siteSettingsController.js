const Joi = require('joi');
const SiteSettings = require('../models/SiteSettings');
const ApiError = require('../utils/ApiError');
const { sanitizeString } = require('../utils/sanitize');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../middleware/upload');

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

// GET /settings/public — NO auth required
const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getInstance();

    const publicData = {
      whatsapp: {
        phoneNumber: settings.whatsapp.isEnabled ? settings.whatsapp.phoneNumber : null,
        prefilledMessage: settings.whatsapp.prefilledMessage,
        isEnabled: settings.whatsapp.isEnabled,
        waUrl:
          settings.whatsapp.isEnabled && settings.whatsapp.phoneNumber
            ? `https://wa.me/${settings.whatsapp.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                settings.whatsapp.prefilledMessage,
              )}`
            : null,
      },
      announcementBar: settings.announcementBar,
      footer: settings.footer,
      version: settings.announcementBar?.lastUpdatedAt
        ? new Date(settings.announcementBar.lastUpdatedAt).toISOString()
        : (settings.updatedAt ? new Date(settings.updatedAt).toISOString() : null),
    };

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({
      success: true,
      data: publicData,
      message: 'Public settings retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /settings/admin — admin only
const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getInstance();

    res.json({
      success: true,
      data: settings,
      version: settings.announcementBar?.lastUpdatedAt
        ? new Date(settings.announcementBar.lastUpdatedAt).toISOString()
        : (settings.updatedAt ? new Date(settings.updatedAt).toISOString() : null),
      message: 'Admin settings retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /settings/admin/whatsapp — admin only
const updateWhatsApp = async (req, res, next) => {
  try {
    const schema = Joi.object({
      phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{6,14}$/)
        .required()
        .messages({
          'string.pattern.base': 'Invalid phone number format (E.164 required)',
        }),
      prefilledMessage: Joi.string().max(200).optional(),
      isEnabled: Joi.boolean().required(),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    // Strip non-numeric characters except leading +
    const cleanPhone = value.phoneNumber.replace(/[^\d+]/g, '');

    const settings = await SiteSettings.getInstance();
    settings.whatsapp = {
      phoneNumber: cleanPhone,
      prefilledMessage: value.prefilledMessage
        ? sanitizeString(value.prefilledMessage)
        : settings.whatsapp.prefilledMessage,
      isEnabled: value.isEnabled,
    };

    await settings.save();

    res.json({
      success: true,
      data: settings.whatsapp,
      message: 'WhatsApp settings updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /settings/admin/announcement — admin only
const updateAnnouncementBar = async (req, res, next) => {
  try {
    const schema = Joi.object({
      text: Joi.string().max(200).allow('').optional(),
      bgColor: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .required()
        .messages({
          'string.pattern.base': 'Invalid hex color format',
        }),
      textColor: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .required()
        .messages({
          'string.pattern.base': 'Invalid hex color format',
        }),
      isActive: Joi.boolean().required(),
      link: Joi.alternatives()
        .try(
          Joi.string().uri(),
          Joi.string().pattern(/^\/[^\s]*$/),
        )
        .optional()
        .allow(''),
      removeImage: Joi.boolean().default(false),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    // SECURITY: Sanitize text — strip all HTML tags
    const sanitizedText = sanitizeString(value.text) || '';

    const settings = await SiteSettings.getInstance();
    const existingImage = settings.announcementBar.image || { url: '', publicId: '' };
    let image = existingImage;

    if (req.file) {
      if (!hasCloudinaryConfig) {
        return next(new ApiError(400, 'Image upload is not configured. Add Cloudinary credentials to enable announcement images.'));
      }

      const uploaded = await uploadToCloudinary(req.file.buffer, 'settings');
      image = {
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
      if (existingImage.publicId && existingImage.publicId !== uploaded.publicId) {
        await cloudinary.uploader.destroy(existingImage.publicId);
      }
    } else if (value.removeImage) {
      if (existingImage.publicId) {
        await cloudinary.uploader.destroy(existingImage.publicId);
      }
      image = { url: '', publicId: '' };
    }

    settings.announcementBar = {
      text: sanitizedText,
      bgColor: value.bgColor,
      textColor: value.textColor,
      isActive: value.isActive,
      link: value.link || '',
      image,
      lastUpdatedAt: new Date(),
    };

    await settings.save();

    res.json({
      success: true,
      data: settings.announcementBar,
      message: 'Announcement bar updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /settings/admin/footer — admin only
const updateFooter = async (req, res, next) => {
  try {
    const linkSchema = Joi.object({
      label: Joi.string().max(50).required(),
      url: Joi.string().max(500).uri().required(),
      sortOrder: Joi.number().default(0),
      isActive: Joi.boolean().default(true),
    });

    const schema = Joi.object({
      tagline: Joi.string().max(200).optional(),
      shopLinks: Joi.array().items(linkSchema).max(10).optional(),
      companyLinks: Joi.array().items(linkSchema).max(10).optional(),
      contact: Joi.object({
        address: Joi.string().max(300).optional(),
        phone: Joi.string().max(20).optional(),
        email: Joi.string().email().max(100).optional(),
        mapUrl: Joi.string().uri().max(500).optional(),
      }).optional(),
      social: Joi.object({
        facebook: Joi.string().uri().allow('').optional(),
        instagram: Joi.string().uri().allow('').optional(),
        tiktok: Joi.string().uri().allow('').optional(),
        youtube: Joi.string().uri().allow('').optional(),
      }).optional(),
      copyright: Joi.string().max(200).optional(),
      showPaymentIcons: Joi.boolean().optional(),
    });

    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    // Validate social URLs start with https:// if provided
    if (value.social) {
      for (const [key, url] of Object.entries(value.social)) {
        if (url && url !== '' && !url.startsWith('https://')) {
          return next(new ApiError(400, `Social ${key} URL must use https://`));
        }
      }
    }

    // SECURITY: Sanitize all text fields (strip HTML)
    const sanitizeText = (text) => sanitizeString(text);

    const settings = await SiteSettings.getInstance();

    if (value.tagline) settings.footer.tagline = sanitizeText(value.tagline);
    if (value.shopLinks) settings.footer.shopLinks = value.shopLinks;
    if (value.companyLinks) settings.footer.companyLinks = value.companyLinks;
    if (value.contact) {
      settings.footer.contact = {
        ...settings.footer.contact,
        ...value.contact,
      };
      if (value.contact.address) settings.footer.contact.address = sanitizeText(value.contact.address);
    }
    if (value.social) {
      settings.footer.social = {
        ...settings.footer.social,
        ...value.social,
      };
    }
    if (value.copyright) settings.footer.copyright = sanitizeText(value.copyright);
    if (typeof value.showPaymentIcons === 'boolean') settings.footer.showPaymentIcons = value.showPaymentIcons;

    await settings.save();

    res.json({
      success: true,
      data: settings.footer,
      message: 'Footer settings updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateWhatsApp,
  updateAnnouncementBar,
  updateFooter,
};
