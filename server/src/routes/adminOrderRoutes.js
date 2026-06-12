const router = require('express').Router();
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'pending_collection', 'collected'];

router.use(protect, adminOnly);

router.get('/', async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const filter = {};

    if (status) {
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return next(new ApiError(400, 'Invalid order status'));
      }
      filter.orderStatus = status;
    }

    if (paymentStatus) {
      if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        return next(new ApiError(400, 'Invalid payment status'));
      }
      filter.paymentStatus = paymentStatus;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .select('_id user items.name items.quantity items.price items.image subtotal discount vatAmount deliveryCharge grandTotal shippingAddress paymentMethod paymentStatus orderStatus paymentRef createdAt')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: orders,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ApiError(404, 'Order not found'));
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return next(new ApiError(404, 'Order not found'));
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return next(new ApiError(400, 'Invalid order status'));
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ApiError(404, 'Order not found'));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true },
    ).populate('user', 'name email phone');

    if (!order) return next(new ApiError(404, 'Order not found'));

    res.json({
      success: true,
      data: order,
      message: `Order marked as ${status}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
