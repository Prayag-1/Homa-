const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { uploadBannerImage, validateImageBuffer } = require('../middleware/upload');
const ctrl = require('../controllers/bannerController');

router.get('/public', ctrl.getPublicBanners);

router.use('/admin', protect, adminOnly);
router.get('/admin', ctrl.getAdminBanners);
router.post('/admin', uploadBannerImage, validateImageBuffer, ctrl.createBanner);
router.put('/admin/:id', validateObjectId(), uploadBannerImage, validateImageBuffer, ctrl.updateBanner);
router.delete('/admin/:id', validateObjectId(), ctrl.deleteBanner);

module.exports = router;
