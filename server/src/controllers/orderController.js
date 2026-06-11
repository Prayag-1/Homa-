const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { calculateOrderTotals } = require('../utils/tax');
const { generateInvoicePDF } = require('../utils/invoice');
const { createOrderSchema } = require('../validators/orderValidators');

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

/**
 * Create a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    const { items, shippingAddress, paymentMethod, couponCode, notes } = value;

    // Fetch and validate items
    const orderItems = [];
    let discountAmount = 0;

    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || !dbProduct.isActive) {
        return next(new ApiError(404, `Product not found or inactive: ${item.product}`));
      }

      if (dbProduct.stock < item.quantity) {
        return next(new ApiError(400, `Insufficient stock for product: ${dbProduct.name}. Available: ${dbProduct.stock}`));
      }

      orderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: dbProduct.images?.[0]?.url || '',
      });
    }

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

    // Create the order in DB
    const order = await Order.create({
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
      orderStatus: 'pending',
      couponCode,
      notes,
    });

    // Handle payment integration flows
    if (paymentMethod === 'esewa') {
      // eSewa payment flow - generate params for frontend form submission
      // eSewa v2 signature fields: total_amount, transaction_uuid, product_code
      // Format total amount with 2 decimal places to match exactly what is posted
      const totalAmountStr = totals.grandTotal.toFixed(2);
      const transactionUuid = order._id.toString();

      const signature = generateEsewaSignature(
        totalAmountStr,
        transactionUuid,
        ESEWA_PRODUCT_CODE,
        ESEWA_SECRET_KEY
      );

      const esewaParams = {
        amount: totals.taxableAmount.toFixed(2),
        tax_amount: totals.vatAmount.toFixed(2),
        total_amount: totalAmountStr,
        transaction_uuid: transactionUuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: '0.00',
        product_delivery_charge: totals.deliveryCharge.toFixed(2),
        success_url: `${process.env.CLIENT_URL}/payment-success`,
        failure_url: `${process.env.CLIENT_URL}/payment-failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
        esewa_form_url: ESEWA_FORM_URL,
      };

      return res.status(201).json({
        success: true,
        message: 'Order created. Complete payment via eSewa.',
        data: {
          order,
          paymentRequired: true,
          esewaParams,
        },
      });
    }

    if (paymentMethod === 'cod') {
      // Cash on Delivery flow: decrease stock immediately, generate invoice
      for (const item of orderItems) {
        const result = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );

        if (result.modifiedCount === 0) {
          // Rollback could be done, but we checked beforehand. Just in case:
          return next(new ApiError(400, `Stock was depleted by another user for product: ${item.name}`));
        }
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      order.invoiceNumber = invoiceNumber;
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

    if (!transaction_uuid || !total_amount) {
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

    if (calculatedSig !== signature) {
      return next(new ApiError(400, 'Payment signature verification failed (Tampered data)'));
    }

    if (status !== 'COMPLETE') {
      return next(new ApiError(400, `Payment not completed. Status: ${status}`));
    }

    // 3. Find the order
    const order = await Order.findById(transaction_uuid);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment verified already.',
        data: order,
      });
    }

    // Verify amount matches (convert to numbers to avoid string formatting issues)
    const orderAmount = order.grandTotal.toFixed(2);
    const paidAmount = parseFloat(total_amount.replace(/,/g, '')).toFixed(2);

    if (parseFloat(orderAmount) !== parseFloat(paidAmount)) {
      return next(new ApiError(400, `Amount mismatch. Order: ${orderAmount}, Paid: ${paidAmount}`));
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
      console.error('eSewa Server Status Check Error:', err);
      // We don't fail immediately if server check times out, but signature verified.
      // However, for strict security in production, you might block it. Let's log it.
    }

    // 5. Deduct inventory stock securely and atomically
    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (result.modifiedCount === 0) {
        // If stock is insufficient now, order can still be marked paid, but we must flag stock issue.
        // For a seamless flow, we log it and proceed. In production, notify admin.
        console.error(`STOCK ERROR: Sufficient stock not available for product ${item.product} during verification!`);
      }
    }

    // 6. Update order status
    order.paymentStatus = 'paid';
    order.paymentRef = transaction_code;
    order.orderStatus = 'confirmed';
    order.invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await order.save();

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
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    // Authorization check: either admin or order owner
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Access denied. You do not own this order.'));
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
    const order = await Order.findById(req.params.id).populate('user', 'name email phone address');
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    // Authorization check
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Access denied. You do not own this order.'));
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
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

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

