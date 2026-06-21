const router = require('express').Router();
const { generalLimiter } = require('../middleware/rateLimiters');

router.use(generalLimiter);

// Public auth routes plus protected /me endpoint inside authRoutes.
router.use('/auth',           require('./authRoutes'));
// Public blog routes.
router.use('/blogs',          require('./blogRoutes'));
// Admin-only blog routes.
router.use('/admin/blogs',    require('./adminBlogRoutes'));
// Public distributor routes.
router.use('/distributors',   require('./distributorRoutes'));
// Public transformation routes.
router.use('/transformations', require('./transformationRoutes'));
// Admin-only transformation routes.
router.use('/admin/transformations', require('./adminTransformationRoutes'));
// Admin-only product routes.
router.use('/admin/products', require('./adminProductRoutes'));
// Public brand routes plus admin-only /brands/admin sub-routes.
router.use('/brands',         require('./brandRoutes'));
// Public category routes plus admin-only /categories/admin sub-routes.
router.use('/categories',     require('./categoryRoutes'));
// Public product routes plus protected review submission.
router.use('/products',       require('./productRoutes'));
// Protected user profile routes.
router.use('/user',           require('./userRoutes'));
// Protected user wishlist routes.
router.use('/user/wishlist',  require('./wishlistRoutes'));
// Protected user order routes plus admin-only status endpoint.
router.use('/orders',         require('./orderRoutes'));
// Admin-only order routes.
router.use('/admin/orders',   require('./adminOrderRoutes'));
// Admin-only reporting routes.
router.use('/admin/reports',   require('./reportsRoutes'));
// Admin-only customer routes.
router.use('/admin/customers', require('./adminCustomerRoutes'));
// Public settings route plus admin-only settings routes.
router.use('/settings',        require('./siteSettingsRoutes'));
// Public banner routes plus admin banner manager routes.
router.use('/banners',         require('./bannerRoutes'));

// Health check
router.get('/health', (req, res) => res.json({ success: true, message: 'HOMA API is running', timestamp: new Date().toISOString() }));

module.exports = router;
