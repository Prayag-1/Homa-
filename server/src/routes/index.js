const router = require('express').Router();

router.use('/auth',           require('./authRoutes'));
router.use('/products',       require('./productRoutes'));
router.use('/user/wishlist',  require('./wishlistRoutes'));
router.use('/orders',         require('./orderRoutes'));

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'HOMA API is running', timestamp: new Date().toISOString() }));

module.exports = router;
