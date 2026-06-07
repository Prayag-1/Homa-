const mongoose = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../middleware/upload');
const { generateUniqueSlug } = require('../utils/slugify');
const ApiError = require('../utils/ApiError');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseField = (field, fallback = []) => {
  if (Array.isArray(field)) return field;
  if (typeof field === 'undefined') return fallback;

  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const uploadProductFiles = async (files = []) => {
  const uploadedImages = [];

  for (const file of files) {
    const result = await uploadToCloudinary(
      file.buffer,
      'products',
      `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    uploadedImages.push({ url: result.url, publicId: result.publicId });
  }

  return uploadedImages;
};

exports.adminGetProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      isActive,
      isNewArrival,
      isBestSeller,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filter = {};

    if (search) {
      const safeSearch = escapeRegex(String(search));
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { brand: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: escapeRegex(String(brand)), $options: 'i' };
    if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';
    if (isNewArrival === 'true' || isNewArrival === 'false') filter.isNewArrival = isNewArrival === 'true';
    if (isBestSeller === 'true' || isBestSeller === 'false') filter.isBestSeller = isBestSeller === 'true';

    const pageNum = Math.max(Math.floor(Number(page) || 1), 1);
    const safeLimit = Math.max(Math.floor(Math.min(Number(limit) || 20, 50)), 1);
    const skip = (pageNum - 1) * safeLimit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(safeLimit),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: products,
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

exports.adminGetProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    return res.json({ success: true, data: product, message: '' });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateProduct = async (req, res, next) => {
  try {
    const sku = req.body.sku.toUpperCase();
    const skuExists = await Product.findOne({ sku });

    if (skuExists) {
      return next(new ApiError(400, `SKU ${req.body.sku} already exists`));
    }

    const uploadedImages = await uploadProductFiles(req.files);
    const slug = await generateUniqueSlug(req.body.name, Product);

    const product = await Product.create({
      ...req.body,
      slug,
      sku,
      images: uploadedImages,
      benefits: parseField(req.body.benefits),
      skinTypes: parseField(req.body.skinTypes),
      certifications: parseField(req.body.certifications),
    });

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    const updateData = { ...req.body };

    if (updateData.sku && updateData.sku.toUpperCase() !== product.sku) {
      const skuExists = await Product.findOne({
        sku: updateData.sku.toUpperCase(),
        _id: { $ne: product._id },
      });

      if (skuExists) {
        return next(new ApiError(400, `SKU ${updateData.sku} already exists`));
      }

      updateData.sku = updateData.sku.toUpperCase();
    }

    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = await generateUniqueSlug(updateData.name, Product, product._id);
    }

    if (typeof updateData.benefits !== 'undefined') {
      updateData.benefits = parseField(updateData.benefits);
    }
    if (typeof updateData.skinTypes !== 'undefined') {
      updateData.skinTypes = parseField(updateData.skinTypes);
    }
    if (typeof updateData.certifications !== 'undefined') {
      updateData.certifications = parseField(updateData.certifications);
    }

    const keepImagesProvided = Object.prototype.hasOwnProperty.call(req.body, 'keepImages');
    const keepImages = keepImagesProvided
      ? parseField(req.body.keepImages)
      : product.images.map((image) => image.publicId);
    const keptImages = product.images.filter((image) => keepImages.includes(image.publicId));

    for (const img of product.images) {
      if (!keepImages.includes(img.publicId)) {
        await cloudinary.uploader.destroy(img.publicId);
      }
    }

    const uploadedImages = await uploadProductFiles(req.files);

    if (keepImagesProvided || uploadedImages.length > 0) {
      updateData.images = [...keptImages, ...uploadedImages];
    }

    delete updateData.keepImages;

    const updatedProduct = await Product.findByIdAndUpdate(product._id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleActive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.json({
      success: true,
      data: { isActive: product.isActive },
      message: `Product ${product.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateStock = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const stock = Number(req.body.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      return next(new ApiError(400, 'Stock must be an integer greater than or equal to 0'));
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true },
    );

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    return res.json({
      success: true,
      data: { stock: product.stock },
      message: 'Stock updated',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleFeatured = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const { field } = req.body;
    const allowedFields = ['isNewArrival', 'isBestSeller'];

    if (!allowedFields.includes(field)) {
      return next(new ApiError(400, 'Field must be isNewArrival or isBestSeller'));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    product[field] = !product[field];
    await product.save();

    return res.json({
      success: true,
      data: {
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
      },
      message: `${field} updated`,
    });
  } catch (err) {
    next(err);
  }
};
