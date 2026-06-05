const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');

// Placeholder controllers for now
const getProducts = (req, res) => res.json({ success: true, data: [] });
const getNewArrivals = (req, res) => res.json({ success: true, data: [] });
const getBestSellers = (req, res) => res.json({ success: true, data: [] });
const getProduct = (req, res) => res.json({ success: true, data: {} });
const createProduct = (req, res) => res.json({ success: true, message: 'Product created' });
const updateProduct = (req, res) => res.json({ success: true, message: 'Product updated' });
const deleteProduct = (req, res) => res.json({ success: true, message: 'Product deleted' });

router.get('/', getProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
