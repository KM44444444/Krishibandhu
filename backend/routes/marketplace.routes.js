const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketplace.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

router.get('/', ctrl.browseProducts);
router.get('/mine', authorize('seller'), ctrl.myProducts);
router.post('/', authorize('seller'), ctrl.createProduct);
router.get('/:id', ctrl.getProduct);
router.put('/:id', authorize('seller'), ctrl.updateProduct);
router.delete('/:id', authorize('seller'), ctrl.deleteProduct);

module.exports = router;
