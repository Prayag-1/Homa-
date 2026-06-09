const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/distributorController');
const { distributorSchema, distributorUpdateSchema } = require('../validators/distributorValidator');

router.get('/', ctrl.getPublicDistributors);

router.use('/admin', protect, adminOnly);
router.get('/admin', ctrl.adminGetDistributors);
router.get('/admin/:id', ctrl.adminGetDistributor);
router.post('/admin', validate(distributorSchema), ctrl.adminCreateDistributor);
router.put('/admin/:id', validate(distributorUpdateSchema), ctrl.adminUpdateDistributor);
router.patch('/admin/:id/toggle', ctrl.adminToggleDistributorActive);

module.exports = router;
