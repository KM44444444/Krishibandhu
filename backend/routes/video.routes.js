const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/video.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/all', authorize('admin'), ctrl.listAll);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
