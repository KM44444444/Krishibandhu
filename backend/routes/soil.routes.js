const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/soil.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

// Farmer
router.post('/requests', authorize('farmer'), ctrl.createRequest);
router.get('/requests/mine', authorize('farmer'), ctrl.myRequests);
router.get('/reports/latest', authorize('farmer'), ctrl.myLatestReport);

// Government
router.get('/requests', authorize('government', 'admin'), ctrl.listAllRequests);
router.put('/requests/:id/status', authorize('government', 'admin'), ctrl.updateRequestStatus);
router.post('/requests/:requestId/report', authorize('government'), ctrl.submitReport);

// Shared
router.get('/requests/:id', authorize('farmer', 'government', 'admin'), ctrl.getRequestDetail);

module.exports = router;
