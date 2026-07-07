const ContactInquiry = require('../models/ContactInquiry');
const ApiError = require('../utils/ApiError');
const { sanitizeString, validatePagination } = require('../utils/queryHelpers');

const VALID_STATUSES = new Set(['new', 'open', 'resolved']);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeInquiry = (inquiry) => ({
  id: String(inquiry._id || inquiry.id || ''),
  name: inquiry.name || '',
  email: inquiry.email || '',
  subject: inquiry.subject || '',
  message: inquiry.message || '',
  status: inquiry.status || 'new',
  source: inquiry.source || 'contact-form',
  createdAt: inquiry.createdAt ? new Date(inquiry.createdAt).toISOString() : null,
  updatedAt: inquiry.updatedAt ? new Date(inquiry.updatedAt).toISOString() : null,
});

exports.getContactInquiries = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const { safePage, safeLimit, skip } = validatePagination(page, limit, 50, 20);
    const safeSearch = sanitizeString(search, 120);

    const filter = {};
    if (VALID_STATUSES.has(status)) {
      filter.status = status;
    }

    if (safeSearch) {
      const regex = new RegExp(escapeRegex(safeSearch), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex },
      ];
    }

    const [items, total] = await Promise.all([
      ContactInquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ContactInquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(serializeInquiry),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
      message: 'Contact inquiries retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.getContactInquiry = async (req, res, next) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id).lean();
    if (!inquiry) {
      return next(new ApiError(404, 'Contact inquiry not found'));
    }
    res.json({ success: true, data: serializeInquiry(inquiry) });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateContactInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.has(status)) {
      return next(new ApiError(400, 'Invalid inquiry status'));
    }

    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return next(new ApiError(404, 'Contact inquiry not found'));
    }

    inquiry.status = status;
    await inquiry.save();

    res.json({
      success: true,
      data: serializeInquiry(inquiry.toObject()),
      message: `Inquiry status updated to ${status}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteContactInquiry = async (req, res, next) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return next(new ApiError(404, 'Contact inquiry not found'));
    }

    await inquiry.deleteOne();
    res.json({ success: true, data: null, message: 'Contact inquiry deleted successfully' });
  } catch (err) {
    next(err);
  }
};
