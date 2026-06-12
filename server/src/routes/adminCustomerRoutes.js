const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getCustomers,
  getCustomer,
  toggleCustomerActive,
} = require('../controllers/adminCustomerController');

// All routes: protected + admin only
router.use(protect, adminOnly);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.patch('/:id/toggle', toggleCustomerActive);

module.exports = router;
