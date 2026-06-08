const Brand = require('../models/Brand');
const ApiError = require('../utils/ApiError');
const { generateUniqueSlug } = require('../utils/slugify');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getPublicBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select('name slug description logo sortOrder')
      .sort({ sortOrder: 1, name: 1 });

    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ success: true, data: brands });
  } catch (err) {
    next(err);
  }
};

exports.adminGetBrands = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: escapeRegex(String(search)), $options: 'i' };
    }
    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }

    const brands = await Brand.find(filter).sort({ sortOrder: 1, name: 1 });
    return res.json({ success: true, data: brands });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateBrand = async (req, res, next) => {
  try {
    const name = req.body.name;
    const exists = await Brand.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    });

    if (exists) return next(new ApiError(400, 'Brand already exists'));

    const slug = await generateUniqueSlug(name, Brand);
    const brand = await Brand.create({ ...req.body, slug });

    return res.status(201).json({
      success: true,
      data: brand,
      message: 'Brand created',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return next(new ApiError(404, 'Brand not found'));

    const updateData = { ...req.body };

    if (updateData.name && updateData.name !== brand.name) {
      const exists = await Brand.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(updateData.name)}$`, 'i') },
        _id: { $ne: brand._id },
      });

      if (exists) return next(new ApiError(400, 'Brand already exists'));
      updateData.slug = await generateUniqueSlug(updateData.name, Brand, brand._id);
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brand._id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      data: updatedBrand,
      message: 'Brand updated',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleBrandActive = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return next(new ApiError(404, 'Brand not found'));

    brand.isActive = !brand.isActive;
    await brand.save();

    return res.json({
      success: true,
      data: { isActive: brand.isActive },
      message: `Brand ${brand.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};
