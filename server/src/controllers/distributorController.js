const Distributor = require('../models/Distributor');
const ApiError = require('../utils/ApiError');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeText = (value) => String(value || '').trim();

const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const getPagination = (query, defaultLimit = 50) => {
  const safePage = Math.max(Number(query.page) || 1, 1);
  const safeLimit = Math.min(Number(query.limit) || defaultLimit, 50);
  return { safePage, safeLimit, skip: (safePage - 1) * safeLimit };
};

const serializeDistributor = (distributor) => ({
  id: String(distributor._id || distributor.id || ''),
  name: distributor.name || '',
  address: distributor.address || '',
  phone: distributor.phone || '',
  email: distributor.email || '',
  coverageArea: distributor.coverageArea || '',
  representative: distributor.representative || '',
  isActive: Boolean(distributor.isActive),
  createdAt: distributor.createdAt ? new Date(distributor.createdAt).toISOString() : null,
  updatedAt: distributor.updatedAt ? new Date(distributor.updatedAt).toISOString() : null,
});

const buildFilter = ({ search, isActive } = {}) => {
  const filter = {};

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { address: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { coverageArea: { $regex: safeSearch, $options: 'i' } },
      { representative: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  return filter;
};

const buildPayload = (body = {}, includeStatus = false) => {
  const payload = {
    name: normalizeText(body.name),
    address: normalizeText(body.address),
    phone: normalizeText(body.phone),
    email: normalizeEmail(body.email),
    coverageArea: normalizeText(body.coverageArea),
    representative: normalizeText(body.representative),
  };

  if (includeStatus && typeof body.isActive !== 'undefined') {
    payload.isActive = body.isActive === true || body.isActive === 'true';
  }

  return payload;
};

const ensureUniqueName = async (name, excludeId = null) => {
  if (!name) return;

  const existing = await Distributor.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    _id: { $ne: excludeId },
  }).select('_id');

  if (existing) {
    throw new ApiError(400, 'Distributor already exists');
  }
};

exports.getPublicDistributors = async (req, res, next) => {
  try {
    const { safeLimit, skip } = getPagination(req.query);
    const distributors = await Distributor.find({ isActive: true })
      .select('name address phone email coverageArea representative isActive createdAt updatedAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    res.set('Cache-Control', 'public, max-age=300');
    return res.json({
      success: true,
      data: distributors.map(serializeDistributor),
    });
  } catch (err) {
    next(err);
  }
};

exports.adminGetDistributors = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const { safeLimit, skip } = getPagination(req.query);
    const filter = buildFilter({
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    const distributors = await Distributor.find(filter)
      .select('name address phone email coverageArea representative isActive createdAt updatedAt')
      .sort({ isActive: -1, name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    return res.json({
      success: true,
      data: distributors.map(serializeDistributor),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminGetDistributor = async (req, res, next) => {
  try {
    const distributor = await Distributor.findById(req.params.id)
      .select('name address phone email coverageArea representative isActive createdAt updatedAt')
      .lean();

    if (!distributor) {
      return next(new ApiError(404, 'Distributor not found'));
    }

    return res.json({
      success: true,
      data: serializeDistributor(distributor),
      message: '',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminCreateDistributor = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body, true);

    if (!payload.name) {
      return next(new ApiError(400, 'Name is required'));
    }

    await ensureUniqueName(payload.name);

    const distributor = await Distributor.create({
      ...payload,
      isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
    });

    return res.status(201).json({
      success: true,
      data: serializeDistributor(distributor.toObject()),
      message: 'Distributor created successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateDistributor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const distributor = await Distributor.findById(id);

    if (!distributor) {
      return next(new ApiError(404, 'Distributor not found'));
    }

    const payload = buildPayload(req.body, true);

    if (payload.name) {
      await ensureUniqueName(payload.name, distributor._id);
    }

    Object.assign(distributor, payload);
    await distributor.save();

    return res.json({
      success: true,
      data: serializeDistributor(distributor.toObject()),
      message: 'Distributor updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.adminToggleDistributorActive = async (req, res, next) => {
  try {
    const distributor = await Distributor.findById(req.params.id);

    if (!distributor) {
      return next(new ApiError(404, 'Distributor not found'));
    }

    distributor.isActive = !distributor.isActive;
    await distributor.save();

    return res.json({
      success: true,
      data: serializeDistributor(distributor.toObject()),
      message: `Distributor ${distributor.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteDistributor = async (req, res, next) => {
  try {
    const distributor = await Distributor.findById(req.params.id);

    if (!distributor) {
      return next(new ApiError(404, 'Distributor not found'));
    }

    await Distributor.deleteOne({ _id: distributor._id });

    return res.json({
      success: true,
      data: null,
      message: 'Distributor deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
