const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  getCustomers,
  getCustomer,
  toggleCustomerActive,
} = require('../controllers/adminCustomerController');

// All routes: protected + admin only
router.use(protect, adminOnly);

router.get('/', getCustomers);
router.get('/:id', validateObjectId(), getCustomer);
router.patch('/:id/toggle', validateObjectId(), toggleCustomerActive);

module.exports = router;
