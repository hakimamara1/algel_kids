const mongoose = require('mongoose');

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
        deliveryType: { type: String, enum: ['home', 'desk'], default: 'home' }
    },
    pricing: {
        itemPrice: { type: Number, required: true },
        shippingPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
