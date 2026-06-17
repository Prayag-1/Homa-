const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const {
  PRODUCT_SORT_WHITELIST,
  sanitizeString,
  validatePagination,
  validateSort,
} = require('../utils/queryHelpers');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getProducts = async (req, res, next) => {
  try {
    const { brand, skinType, category, minPrice, maxPrice, search, page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const filter = { isActive: true };
    const safeBrand = sanitizeString(brand, 100);
    const safeSkinType = sanitizeString(skinType, 50);
    const safeCategory = sanitizeString(category, 100);
    const safeSearch = sanitizeString(search, 100) || '';

    if (safeBrand) {
      filter.brand = { $regex: escapeRegex(safeBrand), $options: 'i' };
    }

    if (safeSkinType) {
      filter.skinTypes = { $in: [safeSkinType] };
    }

    if (safeCategory) {
      filter.category = safeCategory;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (Number.isFinite(min) && min >= 0) filter.price.$gte = min;
      if (Number.isFinite(max) && max >= 0) filter.price.$lte = max;
      if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    const hasTextSearch = safeSearch.length >= 2;

    if (hasTextSearch) {
      filter.$text = { $search: safeSearch };
    }

    const { safePage, safeLimit, skip } = validatePagination(page, limit, 50, 12);
    const safeSort = validateSort(sort, PRODUCT_SORT_WHITELIST);
    const sortByRelevance = hasTextSearch && (!sort || sort === '-createdAt');

    let query = Product.find(filter)
      .select('name slug brand category price comparePrice stock images skinTypes ratings isNewArrival isBestSeller isActive');

    query = sortByRelevance
      ? query.sort({ score: { $meta: 'textScore' } })
      : query.sort(safeSort);

    const [products, total] = await Promise.all([
      query
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.set('Cache-Control', 'public, max-age=60');
    return res.json({
      success: true,
      data: {
        items: products,
        total,
        page: safePage,
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
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).select('-__v');

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    res.set('Cache-Control', 'public, max-age=120');
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
      .select('-__v')
      .limit(8)
      .sort({ createdAt: -1 })
      .lean();

    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=30');
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
      .select('-__v')
      .limit(8)
      .sort({ createdAt: -1 })
      .lean();

    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=30');
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
    const q = sanitizeString(req.query.q, 100);

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
    )
      .limit(5)
      .lean();

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    next(err);
  }
};
