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
// @desc    Get all orders (for admin - simple implementation)
// @access  Public (Should be protected in prod)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('product', 'title price images');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
