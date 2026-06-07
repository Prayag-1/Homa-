const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed'), false);
  }

  cb(null, true);
};

const limits = {
  fileSize: 5 * 1024 * 1024,
  files: 8,
};

const uploadToCloudinary = (buffer, folder, publicId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `homa/${folder}`,
        public_id: publicId,
        transformation: [
          {
            width: 800,
            height: 800,
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

const uploadProductImages = (req, res, next) => {
  productImagesUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Each image must be 5MB or less'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'A maximum of 8 images are allowed'));
      }
      return next(new ApiError(400, err.message));
    }

    return next(err);
  });
};

module.exports = {
  uploadProductImages,
  uploadToCloudinary,
};
