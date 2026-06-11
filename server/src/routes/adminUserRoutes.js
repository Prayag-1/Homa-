const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { adminGetUsers } = require('../controllers/authController');

router.get('/', protect, adminOnly, adminGetUsers);

module.exports = router;
