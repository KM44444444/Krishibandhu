const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/crop.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

router.get('/', ctrl.listCrops);

// Admin manage crop DB
router.post('/', authorize('admin'), ctrl.createCrop);

// Farmer calendar — must be BEFORE /:id
router.get('/calendar/mine', authorize('farmer'), ctrl.myCalendar);
router.post('/calendar/mine', authorize('farmer'), ctrl.addActivity);
router.post('/calendar/apply-template', authorize('farmer'), ctrl.applyCropTemplate);
router.put('/calendar/mine/:id', authorize('farmer'), ctrl.updateActivityStatus);

// Recommendations — must be BEFORE /:id
router.get('/recommendation/crop', authorize('farmer'), ctrl.getCropRecommendation);
router.get('/recommendation/fertilizer', authorize('farmer'), ctrl.getFertilizerRecommendation);

// Dynamic params — AFTER all static routes
router.get('/:id', ctrl.getCrop);
router.put('/:id', authorize('admin'), ctrl.updateCrop);
router.delete('/:id', authorize('admin'), ctrl.deleteCrop);

module.exports = router;
