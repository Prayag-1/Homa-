const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const validate = require('../middleware/validate');
const { uploadTransformationStoryImages, validateImageBuffer } = require('../middleware/upload');
const ctrl = require('../controllers/transformationController');
const { transformationSchema, transformationUpdateSchema } = require('../validators/transformationValidator');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetTransformationStories);
router.get('/:id', validateObjectId(), ctrl.adminGetTransformationStory);
router.post('/', uploadTransformationStoryImages, validateImageBuffer, validate(transformationSchema), ctrl.adminCreateTransformationStory);
router.put('/:id', validateObjectId(), uploadTransformationStoryImages, validateImageBuffer, validate(transformationUpdateSchema), ctrl.adminUpdateTransformationStory);
router.delete('/:id', validateObjectId(), ctrl.adminDeleteTransformationStory);
router.patch('/:id/publish', validateObjectId(), ctrl.adminTogglePublishTransformationStory);

module.exports = router;
