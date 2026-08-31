const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/farm.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate, authorize('farmer'));
router.get('/dashboard-summary', ctrl.dashboardSummary);
router.get('/', ctrl.listMyFarms);
router.post('/', ctrl.createFarm);
router.get('/:id', ctrl.getFarm);
router.put('/:id', ctrl.updateFarm);
router.delete('/:id', ctrl.deleteFarm);

module.exports = router;
