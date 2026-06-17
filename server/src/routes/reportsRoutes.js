const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/rateLimiters');
const {
  getSalesOverview,
  getDailyRevenue,
  getCategoryRevenue,
  getPaymentMethodStats,
  exportCSV,
} = require('../controllers/reportsController');

// Rate limiter for CSV export — max 10 per hour per admin
// All routes: protected + admin only
router.use(protect, adminOnly);

router.get('/overview', getSalesOverview);
router.get('/daily', getDailyRevenue);
router.get('/by-category', getCategoryRevenue);
router.get('/payments', getPaymentMethodStats);
router.get('/export', exportLimiter, exportCSV);

module.exports = router;
