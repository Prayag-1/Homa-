const crypto = require('crypto');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 500 * 1024;
const MAX_IMAGE_SIZE_LABEL = '500KB';

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
    }

    next();
  } catch (err) {
    next(err);
  }
};

const uploadToCloudinary = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const generatedPublicId = `homa-${folder}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `homa/${folder}`,
        public_id: publicId || generatedPublicId,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        resource_type: 'image',
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: 'limit',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

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

const uploadProductImages = (req, res, next) => {
  productImagesUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `Each image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'A maximum of 8 images are allowed'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadBlogCoverImage = (req, res, next) => {
  blogCoverImageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `The cover image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one cover image can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadAnnouncementImage = (req, res, next) => {
  announcementImageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `The announcement image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one announcement image can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadBannerImage = (req, res, next) => {
  bannerImageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `The banner image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one banner image can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadPaymentQrImage = (req, res, next) => {
  paymentQrImageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `The payment QR image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one payment QR image can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadPaymentProofImage = (req, res, next) => {
  paymentProofImageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `The payment proof image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only one payment proof image can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

const uploadTransformationStoryImages = (req, res, next) => {
  transformationStoryImagesUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, `Each image must be ${MAX_IMAGE_SIZE_LABEL} or less`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'Only three images can be uploaded'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
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
  uploadToCloudinary,
};
