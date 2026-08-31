const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);

router.post('/', authorize('buyer', 'farmer'), ctrl.createOrder);
router.get('/mine', authorize('buyer', 'farmer'), ctrl.myOrders);
router.get('/seller/mine', authorize('seller'), ctrl.sellerOrders);
router.get('/:id', ctrl.getOrder);
router.put('/:id/status', authorize('seller', 'admin'), ctrl.updateOrderStatus);

module.exports = router;
