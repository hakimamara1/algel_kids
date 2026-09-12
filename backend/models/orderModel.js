const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant: {
        color: { type: String },
        size: { type: String }
    },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        wilaya: { type: String, required: true },
        commune: { type: String, required: true },
        address: { type: String }, // Optional if picking up from desk, but good to have
        deliveryType: { type: String, enum: ['home', 'desk'], default: 'home' },
        wilayaCode: { type: String } // e.g. "16", set by the server; delivery companies need it
    },
    pricing: {
        itemPrice: { type: Number, required: true },
        shippingPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ORDER_STATUSES,
        default: 'Pending'
    },
    // True while one unit of the ordered color/size is taken from stock (see services/stock.js)
    stockReserved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
Order.ORDER_STATUSES = ORDER_STATUSES;

module.exports = Order;
