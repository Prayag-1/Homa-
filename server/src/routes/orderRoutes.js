const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
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
router.post('/', protect, createOrder);
router.post('/verify-esewa', protect, verifyEsewaPayment);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderDetails);
router.get('/:id/invoice', protect, downloadInvoice);

// Admin Order Routes
router.get('/admin/all', protect, adminOnly, adminGetOrders);
router.put('/:id/status', protect, adminOnly, adminUpdateOrderStatus);

module.exports = router;

