const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/distributorController');
const { distributorSchema, distributorUpdateSchema } = require('../validators/distributorValidator');

router.get('/', ctrl.getPublicDistributors);

router.use('/admin', protect, adminOnly);
router.get('/admin', ctrl.adminGetDistributors);
router.get('/admin/:id', validateObjectId(), ctrl.adminGetDistributor);
router.post('/admin', validate(distributorSchema), ctrl.adminCreateDistributor);
router.put('/admin/:id', validateObjectId(), validate(distributorUpdateSchema), ctrl.adminUpdateDistributor);
router.delete('/admin/:id', validateObjectId(), ctrl.adminDeleteDistributor);
router.patch('/admin/:id/toggle', validateObjectId(), ctrl.adminToggleDistributorActive);

module.exports = router;
