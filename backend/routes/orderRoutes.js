const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { orderIpLimiter, orderPhoneLimiter } = require('../middleware/rateLimits');
const { createOrder, listOrders, updateOrderStatus, sendToDelivery } = require('../controllers/orderController');

const router = express.Router();

router.route('/')
    .post(orderIpLimiter, orderPhoneLimiter, createOrder)
    .get(requireAdmin, listOrders);

router.put('/:id/status', requireAdmin, updateOrderStatus);
router.post('/:id/delivery', requireAdmin, sendToDelivery);

module.exports = router;
