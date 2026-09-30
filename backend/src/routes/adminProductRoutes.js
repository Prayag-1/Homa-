const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { uploadProductImages, validateImageBuffer } = require('../middleware/upload');
const {
  validate,
  createProductSchema,
  updateProductSchema,
} = require('../validators/productValidator');
const ctrl = require('../controllers/adminProductController');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetProducts);
router.get('/:id', validateObjectId(), ctrl.adminGetProduct);
router.post(
  '/',
  uploadProductImages,
  validateImageBuffer,
  validate(createProductSchema),
  ctrl.adminCreateProduct,
);
router.put(
  '/:id',
  validateObjectId(),
  uploadProductImages,
  validateImageBuffer,
  validate(updateProductSchema),
  ctrl.adminUpdateProduct,
);
router.delete('/:id', validateObjectId(), ctrl.adminDeleteProduct);
router.patch('/:id/toggle-active', validateObjectId(), ctrl.adminToggleActive);
router.patch('/:id/stock', validateObjectId(), ctrl.adminUpdateStock);
router.patch('/:id/featured', validateObjectId(), ctrl.adminToggleFeatured);

module.exports = router;
