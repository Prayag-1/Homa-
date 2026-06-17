const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const ctrl = require('../controllers/brandController');
const {
  brandSchema,
  brandUpdateSchema,
  validate,
} = require('../validators/brandCategoryValidator');

router.get('/', ctrl.getPublicBrands);
router.use('/admin', protect, adminOnly);
router.get('/admin', ctrl.adminGetBrands);
router.post('/admin', validate(brandSchema), ctrl.adminCreateBrand);
router.put('/admin/:id', validateObjectId(), validate(brandUpdateSchema), ctrl.adminUpdateBrand);
router.patch('/admin/:id/toggle', validateObjectId(), ctrl.adminToggleBrandActive);

module.exports = router;
