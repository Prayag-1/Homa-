const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const ctrl = require('../controllers/adminContactController');

router.use(protect, adminOnly);

router.get('/', ctrl.getContactInquiries);
router.get('/:id', validateObjectId(), ctrl.getContactInquiry);
router.patch('/:id/status', validateObjectId(), ctrl.adminUpdateContactInquiryStatus);
router.delete('/:id', validateObjectId(), ctrl.adminDeleteContactInquiry);

module.exports = router;
