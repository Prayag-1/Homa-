const router = require('express').Router();
const ctrl = require('../controllers/transformationController');

router.get('/', ctrl.getTransformationStories);
router.get('/:slug/related', ctrl.getRelatedTransformationStories);
router.get('/:slug', ctrl.getTransformationStoryBySlug);

module.exports = router;
