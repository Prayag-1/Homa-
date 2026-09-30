const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { uploadBlogCoverImage, validateImageBuffer } = require('../middleware/upload');
const ctrl = require('../controllers/blogController');

router.use(protect, adminOnly);

router.get('/', ctrl.adminGetBlogs);
router.get('/:id', validateObjectId(), ctrl.adminGetBlog);
router.post('/', uploadBlogCoverImage, validateImageBuffer, ctrl.adminCreateBlog);
router.put('/:id', validateObjectId(), uploadBlogCoverImage, validateImageBuffer, ctrl.adminUpdateBlog);
router.delete('/:id', validateObjectId(), ctrl.adminDeleteBlog);
router.patch('/:id/publish', validateObjectId(), ctrl.adminTogglePublish);

module.exports = router;
