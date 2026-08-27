const router = require('express').Router();
const mongoose = require('mongoose');
const { generalLimiter } = require('../middleware/rateLimiters');
const { version } = require('../../package.json');

router.use(generalLimiter);

router.use('/auth', require('./authRoutes'));
router.use('/blogs', require('./blogRoutes'));
router.use('/admin/blogs', require('./adminBlogRoutes'));
router.use('/distributors', require('./distributorRoutes'));
router.use('/transformations', require('./transformationRoutes'));
router.use('/admin/transformations', require('./adminTransformationRoutes'));
router.use('/admin/products', require('./adminProductRoutes'));
router.use('/brands', require('./brandRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/user', require('./userRoutes'));
router.use('/user/wishlist', require('./wishlistRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin/orders', require('./adminOrderRoutes'));
router.use('/returns', require('./returnRoutes'));
router.use('/admin/reports', require('./reportsRoutes'));
router.use('/admin/customers', require('./adminCustomerRoutes'));
router.use('/admin/contact-inquiries', require('./adminContactRoutes'));
router.use('/admin/email-settings', require('./adminEmailSettingsRoutes'));
router.use('/settings', require('./siteSettingsRoutes'));
router.use('/banners', require('./bannerRoutes'));
router.use('/uploads', require('./uploadRoutes'));

router.get('/health', (req, res) => res.json({
  success: true,
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  version,
}));

module.exports = router;
