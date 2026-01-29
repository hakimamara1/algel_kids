const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');

// @route   POST /api/orders
// @desc    Create a new COD order
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { product, variant, customer, pricing } = req.body;

        if (!product || !customer || !pricing) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newOrder = new Order({
            product,
            variant,
            customer,
            pricing
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/orders
// @desc    Get all orders (for admin)
// @access  Public (Should be protected)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('product', 'title price images');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

const deliveryService = require('../services/deliveryService');

// @route   POST /api/orders/:id/delivery
// @desc    Send order to delivery partner
router.post('/:id/delivery', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const result = await deliveryService.createDeliveryOrder(order);

        // Update order with tracking info
        order.status = 'Shipped';
        // In a real schema, we'd add trackingCode field
        await order.save();

        res.json({ message: 'Sent to delivery', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Delivery Service Error' });
    }
});

module.exports = router;
