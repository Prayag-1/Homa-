const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadBlogCoverImage } = require('../middleware/upload');
const ctrl = require('../controllers/blogController');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetBlogs);
router.get('/:id', ctrl.adminGetBlog);
router.post('/', uploadBlogCoverImage, ctrl.adminCreateBlog);
router.put('/:id', uploadBlogCoverImage, ctrl.adminUpdateBlog);
router.delete('/:id', ctrl.adminDeleteBlog);
router.patch('/:id/publish', ctrl.adminTogglePublish);

module.exports = router;
