const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const { orderIpLimiter, orderPhoneLimiter } = require('../middleware/rateLimits');
const {
    createOrder,
    listOrders,
    updateOrder,
    updateOrderStatus,
    sendToDelivery,
    sendConfirmedToDelivery,
    cancelDelivery,
    refreshDelivery,
    printLabels,
} = require('../controllers/orderController');

const router = express.Router();

router.route('/')
    .post(orderIpLimiter, orderPhoneLimiter, createOrder)
    .get(requireAdmin, listOrders);

// ZR Express (admin)
router.post('/delivery/bulk', requireAdmin, sendConfirmedToDelivery);
router.post('/delivery/labels', requireAdmin, printLabels);
router.route('/:id/delivery')
    .post(requireAdmin, sendToDelivery)
    .delete(requireAdmin, cancelDelivery);
router.post('/:id/delivery/refresh', requireAdmin, refreshDelivery);

router.put('/:id/status', requireAdmin, updateOrderStatus);
// After the confirmation call: color/size or address
router.patch('/:id', requireAdmin, updateOrder);

module.exports = router;
