const router = require('express').Router();

router.use('/auth',           require('./authRoutes'));
router.use('/blogs',          require('./blogRoutes'));
router.use('/admin/blogs',    require('./adminBlogRoutes'));
router.use('/distributors',   require('./distributorRoutes'));
router.use('/transformations', require('./transformationRoutes'));
router.use('/admin/transformations', require('./adminTransformationRoutes'));
router.use('/admin/products', require('./adminProductRoutes'));
router.use('/brands',         require('./brandRoutes'));
router.use('/categories',     require('./categoryRoutes'));
router.use('/products',       require('./productRoutes'));
router.use('/user/wishlist',  require('./wishlistRoutes'));
router.use('/orders',         require('./orderRoutes'));

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'HOMA API is running', timestamp: new Date().toISOString() }));

module.exports = router;
