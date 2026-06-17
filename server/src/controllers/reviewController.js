const mongoose = require('mongoose');
const Joi = require('joi');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { validatePagination } = require('../utils/queryHelpers');
const { sanitizeString } = require('../utils/sanitize');

const strip = (str) => sanitizeString(str);

exports.getProductReviews = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const { safePage, safeLimit, skip } = validatePagination(req.query.page, req.query.limit, 50, 20);
    const filter = {
      product: req.params.productId,
      isApproved: true,
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .select('product user rating title body createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('user', 'name')
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: reviews,
      meta: {
        currentPage: safePage,
        totalPages: Math.ceil(total / safeLimit) || 1,
        totalCount: total,
        limit: safeLimit,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.submitReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title, body } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ApiError(404, 'Product not found'));
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      title: Joi.string().max(100).optional().allow(''),
      body: Joi.string().min(10).max(1000).required(),
    });

    const { error, value } = schema.validate({ rating, title, body });
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    // SECURITY: scoped to req.user._id to prevent IDOR
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      orderStatus: 'delivered',
      'items.product': productId,
    });

    if (!hasPurchased) {
      return next(
        new ApiError(
          403,
          'You can only review products you have purchased and received.',
        ),
      );
    }

    // SECURITY: scoped to req.user._id to prevent IDOR
    const existing = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existing) {
      return next(new ApiError(400, 'You have already reviewed this product.'));
    }

    // SECURITY: scoped to req.user._id to prevent IDOR
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: value.rating,
      title: strip(value.title) || '',
      body: strip(value.body),
      isApproved: false,
    });

    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(productId, {
      'ratings.average': stats[0]?.average.toFixed(1) || 0,
      'ratings.count': stats[0]?.count || 0,
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted and awaiting approval.',
    });
  } catch (err) {
    next(err);
  }
};
