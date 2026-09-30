const router = require('express').Router();
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { reviewLimiter } = require('../middleware/rateLimiters');
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

router.get('/', getProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/search', searchSuggestions);
router.get('/:productId/reviews', validateObjectId('productId'), getProductReviews);
router.post('/:productId/reviews', reviewLimiter, protect, validateObjectId('productId'), submitReview);
router.get('/:id', validateObjectId(), getProduct);

module.exports = router;
