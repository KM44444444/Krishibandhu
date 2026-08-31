const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/consultation.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

router.post('/', authorize('farmer'), ctrl.createConsultation);
router.get('/mine', authorize('farmer'), ctrl.myConsultations);
router.get('/expert/mine', authorize('expert'), ctrl.expertConsultations);
router.put('/:id/accept', authorize('expert'), ctrl.acceptConsultation);
router.put('/:id/status', authorize('expert', 'farmer'), ctrl.updateConsultationStatus);
router.get('/:id/messages', ctrl.getMessages);
router.post('/:id/messages', ctrl.sendMessage);

module.exports = router;
