const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const ctrl = require('../controllers/categoryController');
const {
  categorySchema,
  categoryUpdateSchema,
  validate,
} = require('../validators/brandCategoryValidator');

router.get('/', ctrl.getPublicCategories);
router.use('/admin', protect, adminOnly);
router.get('/admin', ctrl.adminGetCategories);
router.post('/admin', validate(categorySchema), ctrl.adminCreateCategory);
router.put('/admin/:id', validateObjectId(), validate(categoryUpdateSchema), ctrl.adminUpdateCategory);
router.delete('/admin/:id', validateObjectId(), ctrl.adminDeleteCategory);
router.patch('/admin/:id/toggle', validateObjectId(), ctrl.adminToggleCategoryActive);

module.exports = router;
