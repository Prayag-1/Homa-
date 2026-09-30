const router = require('express').Router();
const ctrl = require('../controllers/blogController');

router.get('/', ctrl.getBlogs);
router.get('/:slug', ctrl.getBlogBySlug);

module.exports = router;
