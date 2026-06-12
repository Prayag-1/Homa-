const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
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
router.put('/admin/:id', validate(categoryUpdateSchema), ctrl.adminUpdateCategory);
router.delete('/admin/:id', ctrl.adminDeleteCategory);
router.patch('/admin/:id/toggle', ctrl.adminToggleCategoryActive);

module.exports = router;
