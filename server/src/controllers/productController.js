const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const ALLOWED_SORTS = new Set(['-createdAt', 'createdAt', 'price', '-price', '-ratings.average']);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getProducts = async (req, res, next) => {
  try {
    const { brand, skinType, category, minPrice, maxPrice, search, page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const filter = { isActive: true };

    if (brand) {
      filter.brand = { $regex: escapeRegex(String(brand)), $options: 'i' };
    }

    if (skinType) {
      filter.skinTypes = { $in: [skinType] };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (Number.isFinite(min) && min >= 0) filter.price.$gte = min;
      if (Number.isFinite(max) && max >= 0) filter.price.$lte = max;
      if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    if (search) {
      const safeSearch = escapeRegex(String(search));
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { brand: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(Math.floor(Number(page) || 1), 1);
    const safeLimit = Math.max(Math.floor(Math.min(Number(limit) || 12, 50)), 1);
    const skip = (pageNum - 1) * safeLimit;

    const safeSort = ALLOWED_SORTS.has(sort) ? sort : '-createdAt';

    const products = await Product.find(filter)
      .select('-__v -createdAt')
      .sort(safeSort)
      .skip(skip)
      .limit(safeLimit);

    const total = await Product.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        items: products,
        total,
        page: pageNum,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findOne({ _id: req.params.id, isActive: true }).select('-__v');

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return next(new ApiError(404, 'Product not found'));
    }
    next(err);
  }
};

exports.getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ isNewArrival: true, isActive: true })
      .limit(8)
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .limit(8)
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

exports.searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    // Minimum 2 characters
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const safeQuery = escapeRegex(String(q));
    const suggestions = await Product.find(
      {
        isActive: true,
        $or: [
          { name: { $regex: safeQuery, $options: 'i' } },
          { brand: { $regex: safeQuery, $options: 'i' } },
        ],
      },
      {
        _id: 1,
        name: 1,
        brand: 1,
        price: 1,
        slug: 1,
        images: { $slice: 1 },
      }
    ).limit(5);

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    next(err);
  }
};
