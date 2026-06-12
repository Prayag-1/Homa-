const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const {
  validate,
  createProductSchema,
  updateProductSchema,
} = require('../validators/productValidator');
const ctrl = require('../controllers/adminProductController');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetProducts);
router.get('/:id', ctrl.adminGetProduct);
router.post(
  '/',
  uploadProductImages,
  validate(createProductSchema),
  ctrl.adminCreateProduct,
);
router.put(
  '/:id',
  uploadProductImages,
  validate(updateProductSchema),
  ctrl.adminUpdateProduct,
);
router.delete('/:id', ctrl.adminDeleteProduct);
router.patch('/:id/toggle-active', ctrl.adminToggleActive);
router.patch('/:id/stock', ctrl.adminUpdateStock);
router.patch('/:id/featured', ctrl.adminToggleFeatured);

module.exports = router;
