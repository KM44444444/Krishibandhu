const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

router.get('/users', authorize('admin'), ctrl.listUsers);
router.put('/users/:id/status', authorize('admin'), ctrl.updateUserStatus);
router.delete('/users/:id', authorize('admin'), ctrl.deleteUser);
router.get('/stats', authorize('admin'), ctrl.systemStats);

router.get('/consultations', authorize('admin'), ctrl.listConsultations);

router.get('/alerts', ctrl.listAlerts);
router.post('/alerts', authorize('government', 'admin'), ctrl.createAlert);

module.exports = router;
