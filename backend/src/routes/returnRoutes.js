const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  createReturnRequest,
  getMyReturnRequests,
  adminGetReturnRequests,
  adminUpdateReturnRequest,
} = require('../controllers/returnRequestController');

// User routes
router.post('/', protect, createReturnRequest);
router.get('/my', protect, getMyReturnRequests);

// Admin routes
router.get('/admin/all', protect, adminOnly, adminGetReturnRequests);
router.put('/admin/:id', protect, adminOnly, validateObjectId(), adminUpdateReturnRequest);

module.exports = router;
