const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadTransformationStoryImages } = require('../middleware/upload');
const ctrl = require('../controllers/transformationController');
const { transformationSchema, transformationUpdateSchema } = require('../validators/transformationValidator');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetTransformationStories);
router.get('/:id', ctrl.adminGetTransformationStory);
router.post('/', uploadTransformationStoryImages, validate(transformationSchema), ctrl.adminCreateTransformationStory);
router.put('/:id', uploadTransformationStoryImages, validate(transformationUpdateSchema), ctrl.adminUpdateTransformationStory);
router.delete('/:id', ctrl.adminDeleteTransformationStory);
router.patch('/:id/publish', ctrl.adminTogglePublishTransformationStory);

module.exports = router;
