const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getNewArrivals,
  getBestSellers,
  searchSuggestions,
} = require('../controllers/productController');
const {
  getProductReviews,
  submitReview,
} = require('../controllers/reviewController');

// Rate limiter for review submission
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many review submissions. Try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', getProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/search', searchSuggestions);
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, reviewLimiter, submitReview);
router.get('/:id', getProduct);

module.exports = router;
