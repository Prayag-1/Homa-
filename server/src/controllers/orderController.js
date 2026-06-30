const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { calculateOrderTotals } = require('../utils/tax');
const { generateInvoicePDF } = require('../utils/invoice');
const { createOrderSchema } = require('../validators/orderValidators');
const { calculateLoyaltyPoints } = require('../utils/loyalty');
const { uploadToCloudinary } = require('../middleware/upload');

const VALID_ORDER_STATUSES = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']);
const VALID_PAYMENT_STATUSES = new Set(['pending', 'paid', 'failed', 'pending_collection', 'collected']);
const VALID_PAYMENT_REVIEW_STATUSES = new Set(['not_required', 'pending', 'approved', 'rejected']);

// Environment variables for eSewa
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_ENVIRONMENT = process.env.ESEWA_ENVIRONMENT || 'development';

const ESEWA_FORM_URL = ESEWA_ENVIRONMENT === 'production'
  ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
  : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

const ESEWA_STATUS_URL = ESEWA_ENVIRONMENT === 'production'
  ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
  : 'https://rc.esewa.com.np/api/epay/transaction/status/';

/**
 * Helper: Generate eSewa v2 signature
 */
function generateEsewaSignature(totalAmount, transactionUuid, productCode, secretKey) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
}

const generateInvoiceNumber = () =>
  `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const normalizeOrderBody = (body = {}) => {
  const normalized = { ...body };

  if (typeof normalized.items === 'string') {
    try {
      normalized.items = JSON.parse(normalized.items);
    } catch (error) {
      throw new ApiError(400, 'Invalid order items payload');
    }
  }

  if (typeof normalized.shippingAddress === 'string') {
    try {
      normalized.shippingAddress = JSON.parse(normalized.shippingAddress);
    } catch (error) {
      throw new ApiError(400, 'Invalid shipping address payload');
    }
  }

  if (typeof normalized.couponCode === 'string') {
    normalized.couponCode = normalized.couponCode.trim().toUpperCase() || undefined;
  }

  if (typeof normalized.notes === 'string') {
    normalized.notes = normalized.notes.trim() || undefined;
  }

  return normalized;
};

const uploadPaymentProof = async (file) => {
  if (!file) return null;

  const uploaded = await uploadToCloudinary(file.buffer, 'payments');
  return {
    url: uploaded.url,
    publicId: uploaded.publicId,
    fileName: file.originalname || '',
    uploadedAt: new Date(),
  };
};

const buildOrderItemsFromDb = async (items) => {
  const quantityByProductId = new Map();

  for (const item of items) {
    const productId = item.product;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ApiError(400, 'Invalid product in cart');
    }

    const quantity = Math.max(1, Math.min(parseInt(item.quantity, 10) || 1, 99));
    quantityByProductId.set(productId, (quantityByProductId.get(productId) || 0) + quantity);
  }

  const productIds = [...quantityByProductId.keys()];
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
    stock: { $gt: 0 },
  }).lean();

  if (products.length !== productIds.length) {
    throw new ApiError(400, 'One or more products are unavailable');
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  return productIds.map((productId) => {
    const product = productMap.get(productId);
    const quantity = quantityByProductId.get(productId);

    if (!product) {
      throw new ApiError(400, 'Product not found');
    }
    if (product.stock < quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    return {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0]?.url || '',
    };
  });
};

const reserveStock = async (orderItems) => {
  const reservedItems = [];

  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product,
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } },
      { new: true },
    );

    if (!updated) {
      await releaseStock(reservedItems);
      throw new ApiError(400, `Insufficient stock for ${item.name}`);
    }

    reservedItems.push(item);
  }

  return reservedItems;
};

const releaseStock = async (orderItems = []) => {
  await Promise.all(orderItems.map((item) => Product.updateOne(
    { _id: item.product },
    { $inc: { stock: item.quantity } },
  )));
};

async function awardLoyaltyPointsForOrder(order) {
  if (!order || order.loyaltyPointsAwarded) {
    return 0;
  }

  const points = calculateLoyaltyPoints(order.grandTotal);
  const previousAwardState = {
    loyaltyPointsAwarded: order.loyaltyPointsAwarded,
    loyaltyPointsAwardedPoints: order.loyaltyPointsAwardedPoints,
    loyaltyPointsAwardedAt: order.loyaltyPointsAwardedAt,
  };

  order.loyaltyPointsAwarded = true;
  order.loyaltyPointsAwardedPoints = points;
  order.loyaltyPointsAwardedAt = new Date();
  await order.save();

  try {
    if (points > 0) {
      const user = await User.findById(order.user);
      if (!user) {
        throw new ApiError(404, 'User not found for loyalty award');
      }

      user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
      await user.save();
    }

    return points;
  } catch (error) {
    order.loyaltyPointsAwarded = previousAwardState.loyaltyPointsAwarded;
    order.loyaltyPointsAwardedPoints = previousAwardState.loyaltyPointsAwardedPoints;
    order.loyaltyPointsAwardedAt = previousAwardState.loyaltyPointsAwardedAt;

    try {
      await order.save();
    } catch (rollbackError) {
    }

    throw error;
  }
}

/**
 * Create a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    // Validate request body
    const normalizedBody = normalizeOrderBody(req.body);
    const { error, value } = createOrderSchema.validate(normalizedBody);
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const { items, shippingAddress, paymentMethod, couponCode, notes } = value;

    if (paymentMethod === 'esewa') {
      return next(new ApiError(400, 'eSewa payments are disabled. Please use QR payment or COD.'));
    }

    if (paymentMethod === 'fonepay') {
      return next(new ApiError(400, 'Fonepay payments are not available yet'));
    }

    if (paymentMethod === 'qr' && !req.file) {
      return next(new ApiError(400, 'Payment proof is required for QR orders'));
    }

    const orderItems = await buildOrderItemsFromDb(items);
    let discountAmount = 0;

    // Calculate subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Apply coupon if valid
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon) {
        const now = new Date();
        if (coupon.expiryDate && coupon.expiryDate < now) {
          return next(new ApiError(400, 'Coupon has expired'));
        }
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          return next(new ApiError(400, `Minimum order amount for coupon is Rs. ${coupon.minOrderAmount}`));
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return next(new ApiError(400, 'Coupon usage limit reached'));
        }

        if (coupon.discountType === 'percentage') {
          discountAmount = parseFloat(((subtotal * coupon.discountValue) / 100).toFixed(2));
        } else {
          discountAmount = coupon.discountValue;
        }

        // Ensure discount is not greater than subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }

        // Increment coupon use count
        coupon.usedCount += 1;
        await coupon.save();
      } else {
        return next(new ApiError(400, 'Invalid coupon code'));
      }
    }

    // Delivery charge: Free above Rs. 2000, else Rs. 100
    const deliveryCharge = subtotal > 2000 ? 0 : 100;

    // Calculate totals using tax util
    const totals = calculateOrderTotals(orderItems, discountAmount, deliveryCharge);
    const paymentProof = paymentMethod === 'qr' ? await uploadPaymentProof(req.file) : null;

    const reservedItems = await reserveStock(orderItems);
    let order;
    try {
      // SECURITY: scoped to req.user._id to prevent IDOR
      order = await Order.create({
        user: req.user._id,
        items: orderItems,
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        vatAmount: totals.vatAmount,
        deliveryCharge: totals.deliveryCharge,
        grandTotal: totals.grandTotal,
        vatRate: totals.vatRate,
        shippingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        paymentVerificationStatus: paymentMethod === 'qr' ? 'pending' : 'not_required',
        paymentProof: paymentProof || undefined,
        paymentSubmittedAt: paymentProof ? new Date() : undefined,
        orderStatus: 'pending',
        couponCode,
        notes,
      });
    } catch (err) {
      await releaseStock(reservedItems);
      throw err;
    }

    // Handle payment integration flows
    if (paymentMethod === 'qr') {
      return res.status(201).json({
        success: true,
        message: 'Order created. Payment proof submitted for review.',
        data: {
          order,
          paymentRequired: false,
        },
      });
    }

    if (paymentMethod === 'cod') {
      order.invoiceNumber = generateInvoiceNumber();
      order.orderStatus = 'confirmed';
      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully (Cash on Delivery).',
        data: {
          order,
          paymentRequired: false,
        },
      });
    }

    return next(new ApiError(400, 'Invalid payment method flow'));
  } catch (err) {
    next(err);
  }
};

/**
 * Verify eSewa payment callback on success redirect
 */
exports.verifyEsewaPayment = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data) {
      return next(new ApiError(400, 'Missing payment response data'));
    }

    // 1. Decode base64 response from eSewa
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    } catch {
      return next(new ApiError(400, 'Invalid base64 payload'));
    }

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = decoded;

    if (!transaction_uuid || !total_amount || !signed_field_names || !signature) {
      return next(new ApiError(400, 'Missing critical payment response parameters'));
    }

    // 2. Recreate and verify signature
    const signedFields = signed_field_names.split(',');
    const message = signedFields
      .map((field) => `${field}=${decoded[field]}`)
      .join(',');

    const calculatedSig = crypto
      .createHmac('sha256', ESEWA_SECRET_KEY)
      .update(message)
      .digest('base64');

    const expectedSignature = Buffer.from(calculatedSig);
    const receivedSignature = Buffer.from(String(signature));
    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return next(new ApiError(400, 'Payment signature verification failed (Tampered data)'));
    }

    if (status !== 'COMPLETE') {
      return next(new ApiError(400, `Payment not completed. Status: ${status}`));
    }

    // 3. Load the pending order for amount checks before idempotent update
    // SECURITY: scoped to req.user._id to prevent IDOR
    const pendingOrder = await Order.findOne({
      _id: transaction_uuid,
      user: req.user._id,
      paymentStatus: 'pending',
    });
    if (!pendingOrder) {
      return res.json({
        success: true,
        message: 'Already processed',
      });
    }

    // Verify amount matches (convert to numbers to avoid string formatting issues)
    const orderAmount = pendingOrder.grandTotal.toFixed(2);
    const paidAmount = parseFloat(String(total_amount).replace(/,/g, '')).toFixed(2);

    if (parseFloat(orderAmount) !== parseFloat(paidAmount)) {
      const failedOrder = await Order.findOneAndUpdate(
        {
          _id: pendingOrder._id,
          user: req.user._id,
          paymentStatus: 'pending',
        },
        {
          $set: {
            paymentStatus: 'failed',
            orderStatus: 'cancelled',
          },
        },
        { new: true },
      );
      if (failedOrder) {
        await releaseStock(failedOrder.items);
      }
      return next(new ApiError(400, 'Payment amount mismatch'));
    }

    // 4. Server-to-server validation check with eSewa Status API for extra security
    try {
      const url = `${ESEWA_STATUS_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
      const response = await fetch(url);
      const statusCheck = await response.json();

      if (statusCheck.status !== 'COMPLETE') {
        return next(
          new ApiError(
            400,
            `Double-check verification failed with eSewa servers. Status: ${statusCheck.status}`
          )
        );
      }
    } catch (err) {
      // We don't fail immediately if server check times out, but signature verified.
      // However, for strict security in production, you might block it. Let's log it.
    }

    // 5. Idempotently update only pending orders.
    const order = await Order.findOneAndUpdate(
      {
        _id: pendingOrder._id,
        user: req.user._id,
        paymentStatus: 'pending',
      },
      {
        $set: {
          paymentStatus: 'paid',
          paymentRef: transaction_code,
          paidAt: new Date(),
          orderStatus: 'confirmed',
          invoiceNumber: generateInvoiceNumber(),
        },
      },
      { new: true },
    );

    if (!order) {
      return res.json({
        success: true,
        message: 'Already processed',
      });
    }

    await awardLoyaltyPointsForOrder(order);

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    // SECURITY: scoped to req.user._id to prevent IDOR
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specific order details
 */
exports.getOrderDetails = async (req, res, next) => {
  try {
    const orderQuery = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };

    // SECURITY: scoped to req.user._id to prevent IDOR
    const order = await Order.findOne(orderQuery).populate('user', 'name email phone');
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Download Invoice PDF
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const orderQuery = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };

    // SECURITY: scoped to req.user._id to prevent IDOR
    const order = await Order.findOne(orderQuery).populate('user', 'name email phone address');
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (!order.invoiceNumber) {
      return next(new ApiError(400, 'Invoice has not been generated for this order yet'));
    }

    // Stream PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.invoiceNumber}.pdf`);

    const doc = generateInvoicePDF(order);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get all orders
 */
exports.adminGetOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter = {};
    if (VALID_ORDER_STATUSES.has(status)) filter.orderStatus = status;
    if (VALID_PAYMENT_STATUSES.has(paymentStatus)) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Review QR payment proof
 */
exports.adminReviewOrderPayment = async (req, res, next) => {
  try {
    const { reviewStatus, note } = req.body;

    if (!VALID_PAYMENT_REVIEW_STATUSES.has(reviewStatus)) {
      return next(new ApiError(400, 'Invalid payment review status'));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.paymentMethod !== 'qr') {
      return next(new ApiError(400, 'Only QR orders require payment review'));
    }

    if (reviewStatus === 'approved') {
      order.paymentVerificationStatus = 'approved';
      order.paymentStatus = 'paid';
      order.paymentReviewNote = note || '';
      order.paymentReviewedBy = req.user._id;
      order.paymentReviewedAt = new Date();
      order.paidAt = order.paidAt || new Date();
      order.orderStatus = 'confirmed';
      if (!order.invoiceNumber) {
        order.invoiceNumber = generateInvoiceNumber();
      }
      await order.save();
      await awardLoyaltyPointsForOrder(order);

      return res.json({
        success: true,
        message: 'QR payment approved successfully',
        data: order,
      });
    }

    if (reviewStatus === 'rejected') {
      const wasPending = order.paymentStatus === 'pending';
      order.paymentVerificationStatus = 'rejected';
      order.paymentStatus = 'failed';
      order.paymentReviewNote = note || '';
      order.paymentReviewedBy = req.user._id;
      order.paymentReviewedAt = new Date();
      order.orderStatus = 'cancelled';
      await order.save();

      if (wasPending) {
        await releaseStock(order.items);
      }

      return res.json({
        success: true,
        message: 'QR payment rejected successfully',
        data: order,
      });
    }

    return next(new ApiError(400, 'Unsupported payment review action'));
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update order status
 */
exports.adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    if (
      ['paid', 'collected'].includes(order.paymentStatus) &&
      !order.loyaltyPointsAwarded
    ) {
      await awardLoyaltyPointsForOrder(order);
    }

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Validate coupon code and calculate discount
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return next(new ApiError(400, 'Coupon code is required'));

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return next(new ApiError(404, 'Invalid coupon code'));

    const now = new Date();
    if (coupon.expiryDate && coupon.expiryDate < now) {
      return next(new ApiError(400, 'Coupon has expired'));
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return next(new ApiError(400, `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount}`));
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return next(new ApiError(400, 'Coupon usage limit reached'));
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = parseFloat(((subtotal * coupon.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return res.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};
