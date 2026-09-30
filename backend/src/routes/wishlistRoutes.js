const router = require('express').Router();
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  getWishlist,
  toggleWishlist,
} = require('../controllers/wishlistController');

router.get('/', protect, getWishlist);
router.post('/:productId', protect, validateObjectId('productId'), toggleWishlist);

module.exports = router;
