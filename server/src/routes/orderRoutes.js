const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { paymentLimiter } = require('../middleware/rateLimiters');
const { uploadPaymentProofImage, validateImageBuffer } = require('../middleware/upload');
const {
  createOrder,
  verifyEsewaPayment,
  getMyOrders,
  getOrderDetails,
  downloadInvoice,
  adminGetOrders,
  adminUpdateOrderStatus,
  validateCoupon,
} = require('../controllers/orderController');

// User Order Routes
router.post('/', paymentLimiter, protect, uploadPaymentProofImage, validateImageBuffer, createOrder);
router.post('/verify-esewa', paymentLimiter, protect, verifyEsewaPayment);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, validateObjectId(), getOrderDetails);
router.get('/:id/invoice', protect, validateObjectId(), downloadInvoice);

// Admin Order Routes
router.get('/admin/all', protect, adminOnly, adminGetOrders);
router.put('/:id/status', protect, adminOnly, validateObjectId(), adminUpdateOrderStatus);

module.exports = router;

