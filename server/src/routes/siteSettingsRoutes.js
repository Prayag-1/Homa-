const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPublicSettings,
  getAdminSettings,
  updateWhatsApp,
  updateAnnouncementBar,
  updateFooter,
} = require('../controllers/siteSettingsController');

// Public endpoint — NO auth required
router.get('/public', getPublicSettings);

// Admin endpoints — protected + admin only
router.get('/admin', protect, adminOnly, getAdminSettings);
router.patch('/admin/whatsapp', protect, adminOnly, updateWhatsApp);
router.patch('/admin/announcement', protect, adminOnly, updateAnnouncementBar);
router.patch('/admin/footer', protect, adminOnly, updateFooter);

module.exports = router;
