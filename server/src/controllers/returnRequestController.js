const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * User: Create a return request for a completed order
 */
exports.createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, reason, details } = req.body;
    if (!orderId || !reason) {
      return next(new ApiError(400, 'Order ID and reason are required'));
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.orderStatus !== 'delivered') {
      return next(new ApiError(400, 'Only delivered orders can be returned'));
    }

    const existingRequest = await ReturnRequest.findOne({ order: orderId });
    if (existingRequest) {
      return next(new ApiError(400, 'A return request already exists for this order'));
    }

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: req.user._id,
      reason,
      details,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      data: returnRequest,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User: Get their return requests
 */
exports.getMyReturnRequests = async (req, res, next) => {
  try {
    const returnRequests = await ReturnRequest.find({ user: req.user._id })
      .populate('order')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: returnRequests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get all return requests
 */
exports.adminGetReturnRequests = async (req, res, next) => {
  try {
    const returnRequests = await ReturnRequest.find()
      .populate('user', 'name email phone')
      .populate('order')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: returnRequests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update return request status (accept/reject)
 */
exports.adminUpdateReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return next(new ApiError(400, 'Invalid status update'));
    }

    const returnRequest = await ReturnRequest.findById(id).populate('order');
    if (!returnRequest) {
      return next(new ApiError(404, 'Return request not found'));
    }

    const prevStatus = returnRequest.status;
    returnRequest.status = status;
    if (adminNotes !== undefined) {
      returnRequest.adminNotes = adminNotes;
    }

    await returnRequest.save();

    // If accepted and was not previously accepted, update order status to 'returned' and restock items
    if (status === 'accepted' && prevStatus !== 'accepted') {
      const order = await Order.findById(returnRequest.order);
      if (order) {
        order.orderStatus = 'returned';
        await order.save();

        // Restock products
        if (order.items && order.items.length > 0) {
          await Promise.all(
            order.items.map((item) =>
              Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } }
              )
            )
          );
        }
      }
    }

    res.json({
      success: true,
      message: `Return request marked as ${status}`,
      data: returnRequest,
    });
  } catch (err) {
    next(err);
  }
};
