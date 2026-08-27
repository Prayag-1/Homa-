const crypto = require('crypto');
const { Readable } = require('stream');
const mongoose = require('mongoose');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const MAX_IMAGE_SIZE_MB = parsePositiveInteger(process.env.IMAGE_UPLOAD_MAX_MB, 10);
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = `${MAX_IMAGE_SIZE_MB}MB`;
const IMAGE_ROUTE_BASE = (process.env.PUBLIC_IMAGE_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api/v1/uploads`)
  .replace(/\/+$/, '');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed'), false);
  }

  cb(null, true);
};

const limits = {
  fileSize: MAX_IMAGE_SIZE_BYTES,
  files: 8,
  fields: 20,
  fieldSize: 10 * 1024,
};

const getUploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }
  return [];
};

const validateImageBuffer = async (req, res, next) => {
  try {
    const files = getUploadedFiles(req);
    if (files.length === 0) return next();

    const { fileTypeFromBuffer } = await import('file-type');
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);
      if (!type || !ALLOWED_MIMETYPES.has(type.mime)) {
        return next(new ApiError(
          400,
          'Invalid file content. Only real JPEG, PNG, and WebP images are allowed.',
        ));
      }

      file.mimetype = type.mime;
      file.detectedExtension = ALLOWED_EXTENSIONS[type.mime];
    }

    next();
  } catch (err) {
    next(err);
  }
};

const getGridFsBucket = () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new ApiError(503, 'Image storage is not ready. MongoDB is not connected.');
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'images',
  });
};

const buildImageUrl = (id) => `${IMAGE_ROUTE_BASE}/${id}`;

const uploadToMongo = async (buffer, folder = 'uploads', publicId = null, originalFile = {}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(400, 'No image file provided');
  }

  const { fileTypeFromBuffer } = await import('file-type');
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_MIMETYPES.has(type.mime)) {
    throw new ApiError(400, 'Invalid image file. Only JPEG, PNG, and WebP images are allowed.');
  }

  const bucket = getGridFsBucket();
  const extension = ALLOWED_EXTENSIONS[type.mime];
  const filename = `${folder}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: type.mime,
      metadata: {
        folder,
        legacyPublicId: publicId || '',
        originalName: originalFile.originalname || '',
        uploadedAt: new Date(),
      },
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      const id = uploadStream.id.toString();
      resolve({
        url: buildImageUrl(id),
        publicId: id,
        filename,
      });
    });

    Readable.from(buffer).pipe(uploadStream);
  });
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const imageIdFromValue = (value) => {
  if (!value || typeof value !== 'string') return '';

  if (isObjectId(value)) return value;

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const candidate = parts[parts.length - 1];
    return isObjectId(candidate) ? candidate : '';
  } catch {
    const parts = value.split('/').filter(Boolean);
    const candidate = parts[parts.length - 1];
    return isObjectId(candidate) ? candidate : '';
  }
};

const deleteUploadedFile = async (publicIdOrUrl) => {
  const imageId = imageIdFromValue(publicIdOrUrl);
  if (!imageId) return false;

  const bucket = getGridFsBucket();
  try {
    await bucket.delete(new mongoose.Types.ObjectId(imageId));
    return true;
  } catch (err) {
    if (err.message && err.message.includes('FileNotFound')) return false;
    throw err;
  }
};

const getStoredImage = async (id) => {
  if (!isObjectId(id)) {
    throw new ApiError(404, 'Image not found');
  }

  const objectId = new mongoose.Types.ObjectId(id);
  const file = await mongoose.connection.db
    .collection('images.files')
    .findOne({ _id: objectId });

  if (!file) {
    throw new ApiError(404, 'Image not found');
  }

  return {
    file,
    stream: getGridFsBucket().openDownloadStream(objectId),
  };
};

const productImagesUpload = multer({ storage, limits, fileFilter }).array('images', 8);
const blogCoverImageUpload = multer({ storage, limits, fileFilter }).single('coverImageFile');
const announcementImageUpload = multer({ storage, limits, fileFilter }).single('announcementImageFile');
const bannerImageUpload = multer({ storage, limits, fileFilter }).single('bannerImageFile');
const paymentQrImageUpload = multer({ storage, limits, fileFilter }).single('paymentQrImageFile');
const paymentProofImageUpload = multer({ storage, limits, fileFilter }).single('paymentProofFile');
const transformationStoryImagesUpload = multer({ storage, limits, fileFilter }).fields([
  { name: 'coverImageFile', maxCount: 1 },
  { name: 'beforeImageFile', maxCount: 1 },
  { name: 'afterImageFile', maxCount: 1 },
]);

const handleUploadError = (err, next, messages) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, messages.fileSize));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, messages.fileCount));
    }
    return next(new ApiError(400, err.message));
  }

  return next(err);
};

const uploadProductImages = (req, res, next) => {
  productImagesUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `Each image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'A maximum of 8 images are allowed',
  }));
};

const uploadBlogCoverImage = (req, res, next) => {
  blogCoverImageUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `The cover image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only one cover image can be uploaded',
  }));
};

const uploadAnnouncementImage = (req, res, next) => {
  announcementImageUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `The announcement image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only one announcement image can be uploaded',
  }));
};

const uploadBannerImage = (req, res, next) => {
  bannerImageUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `The banner image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only one banner image can be uploaded',
  }));
};

const uploadPaymentQrImage = (req, res, next) => {
  paymentQrImageUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `The payment QR image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only one payment QR image can be uploaded',
  }));
};

const uploadPaymentProofImage = (req, res, next) => {
  paymentProofImageUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `The payment proof image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only one payment proof image can be uploaded',
  }));
};

const uploadTransformationStoryImages = (req, res, next) => {
  transformationStoryImagesUpload(req, res, (err) => handleUploadError(err, next, {
    fileSize: `Each image must be ${MAX_IMAGE_SIZE_LABEL} or less`,
    fileCount: 'Only three images can be uploaded',
  }));
};

module.exports = {
  uploadProductImages,
  uploadBlogCoverImage,
  uploadAnnouncementImage,
  uploadBannerImage,
  uploadPaymentQrImage,
  uploadPaymentProofImage,
  uploadTransformationStoryImages,
  validateImageBuffer,
  uploadToMongo,
  deleteUploadedFile,
  getStoredImage,
  MAX_IMAGE_SIZE_LABEL,
};
