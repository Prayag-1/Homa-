const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  listEmailSettings,
  createEmailSetting,
  updateEmailSetting,
  sendTestEmail,
} = require('../controllers/adminEmailSettingsController');

router.use(protect, adminOnly);

router.get('/', listEmailSettings);
router.post('/', createEmailSetting);
router.put('/:id', updateEmailSetting);
router.post('/test', sendTestEmail);

module.exports = router;
