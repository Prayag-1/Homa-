const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const { generateUniqueSlug } = require('../utils/slugify');
const {
  sanitizeString,
  validatePagination,
} = require('../utils/queryHelpers');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const publicCategoryFilter = () => ({ isActive: { $ne: false } });

exports.getPublicCategories = async (req, res, next) => {
  try {
    const { safeLimit, skip } = validatePagination(req.query.page, req.query.limit, 50, 50);
    const categories = await Category.find(publicCategoryFilter())
      .select('name slug description image sortOrder')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.adminGetCategories = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const { safeLimit, skip } = validatePagination(req.query.page, req.query.limit, 50, 50);
    const filter = {};
    const safeSearch = sanitizeString(search, 100);

    if (safeSearch) {
      filter.name = { $regex: escapeRegex(safeSearch), $options: 'i' };
    }
    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateCategory = async (req, res, next) => {
  try {
    const name = req.body.name;
    const exists = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    });

    if (exists) return next(new ApiError(400, 'Category already exists'));

    const slug = await generateUniqueSlug(name, Category);
    const category = await Category.create({ ...req.body, slug });

    return res.status(201).json({
      success: true,
      data: category,
      message: 'Category created',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new ApiError(404, 'Category not found'));

    const updateData = { ...req.body };

    if (updateData.name && updateData.name !== category.name) {
      const exists = await Category.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(updateData.name)}$`, 'i') },
        _id: { $ne: category._id },
      });

      if (exists) return next(new ApiError(400, 'Category already exists'));
      updateData.slug = await generateUniqueSlug(updateData.name, Category, category._id);
    }

    const updatedCategory = await Category.findByIdAndUpdate(category._id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleCategoryActive = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new ApiError(404, 'Category not found'));

    category.isActive = !category.isActive;
    await category.save();

    return res.json({
      success: true,
      data: { isActive: category.isActive },
      message: `Category ${category.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new ApiError(404, 'Category not found'));

    await Category.deleteOne({ _id: category._id });

    return res.json({
      success: true,
      data: null,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
