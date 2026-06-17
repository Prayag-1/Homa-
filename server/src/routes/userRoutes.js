const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { me, updateProfile } = require('../controllers/authController');
const { updateProfileSchema } = require('../validators/authValidators');

router.get('/profile', protect, me);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);

module.exports = router;
