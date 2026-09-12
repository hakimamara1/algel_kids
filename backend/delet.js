const mongoose = require('mongoose');
const Order = require('./models/orderModel.js');
require('dotenv').config({ quiet: true }); // adjust path/Users/mac/Desktop/Projects/malak/malaksitweb/backend/models/orderModel.js

async function deleteOldOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find the newest order
        const latestOrder = await Order.findOne()
            .sort({ createdAt: -1 })
            .select('_id createdAt');

        if (!latestOrder) {
            console.log('No orders found.');
            return;
        }

        console.log('Keeping latest order:', latestOrder._id);
        console.log('Created at:', latestOrder.createdAt);

        // Delete every order except the latest one
        const result = await Order.deleteMany({
            _id: { $ne: latestOrder._id }
        });

        console.log(`Deleted ${result.deletedCount} old orders.`);
        console.log('Latest order was kept.');

    } catch (error) {
        console.error('Error deleting orders:', error);
    } finally {
        await mongoose.disconnect();
    }
}

deleteOldOrders();