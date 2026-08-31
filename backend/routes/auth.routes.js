const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.put('/me', authenticate, ctrl.updateProfile);

module.exports = router;
