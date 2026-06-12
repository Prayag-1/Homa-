const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSalesOverview,
  getDailyRevenue,
  getCategoryRevenue,
  getPaymentMethodStats,
  exportCSV,
} = require('../controllers/reportsController');

// Rate limiter for CSV export — max 10 per hour per admin
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user._id.toString(),
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes: protected + admin only
router.use(protect, adminOnly);

router.get('/overview', getSalesOverview);
router.get('/daily', getDailyRevenue);
router.get('/by-category', getCategoryRevenue);
router.get('/payments', getPaymentMethodStats);
router.get('/export', exportLimiter, exportCSV);

module.exports = router;
