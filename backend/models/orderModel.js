const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];

// A Meta event that failed and waits to be sent again (see services/metaEvents.js)
const metaRetrySchema = new mongoose.Schema({
    kind: { type: String },
    eventTime: { type: Date },
    attempts: { type: Number, default: 1 },
    lastError: { type: String }
});

// One piece of the order: a pack of 2 sets has 2 items, each with its own color and size
const itemSchema = new mongoose.Schema({
    color: { type: String },
    size: { type: String },
    // True while this piece is taken from stock (see services/stock.js)
    stockTaken: { type: Boolean }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    items: [itemSchema],
    // The first item (older orders only have this; kept for them and for the orders list)
    variant: {
        color: { type: String },
        size: { type: String }
    },
    // Where the order was placed: a landing page slug, or "p-<productId>" for the product page
    source: {
        landing: { type: String }
    },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        wilaya: { type: String, required: true },
        commune: { type: String, required: true },
        address: { type: String }, // Optional if picking up from desk, but good to have
        deliveryType: { type: String, enum: ['home', 'desk'], default: 'home' },
        wilayaCode: { type: String }, // e.g. "16", set by the server; delivery companies need it
        // Places chosen in the ZR Express lists (ids of ZR's wilaya, commune and office)
        zr: {
            wilayaId: { type: String },
            communeId: { type: String },
            communeName: { type: String },
            postalCode: { type: String },
            hubId: { type: String },
            hubName: { type: String }
        }
    },
    pricing: {
        itemPrice: { type: Number, required: true }, // all the pieces (the pack price)
        shippingPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ORDER_STATUSES,
        default: 'Pending'
    },
    // True while stock is taken for this order (see services/stock.js)
    stockReserved: { type: Boolean, default: false },
    // The parcel at ZR Express, kept up to date by ZR's webhooks (see services/zrParcels.js)
    delivery: {
        provider: { type: String },
        parcelId: { type: String },
        trackingNumber: { type: String },
        state: {
            id: { type: String },
            name: { type: String },
            color: { type: String }
        },
        situation: {
            name: { type: String },
            slug: { type: String }
        },
        sentAt: { type: Date },
        lastEventAt: { type: Date },
        sending: { type: Boolean }
    },
    // Browser details saved when the order is placed, reused for Meta events sent later.
    // Erased about 30 days after the order is closed.
    tracking: {
        fbp: { type: String },
        fbc: { type: String },
        ip: { type: String },
        userAgent: { type: String },
        sourceUrl: { type: String }
    },
    // When each Meta Conversions API event was sent (each one only once), and failed ones to retry
    metaEvents: {
        lead: { type: Date },
        purchase: { type: Date },
        delivered: { type: Date },
        returned: { type: Date },
        cancelled: { type: Date },
        retry: [metaRetrySchema]
    },
    createdAt: { type: Date, default: Date.now }
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1, createdAt: -1 });
orderSchema.index({ 'delivery.parcelId': 1 }, { sparse: true });

const Order = mongoose.model('Order', orderSchema);
Order.ORDER_STATUSES = ORDER_STATUSES;

module.exports = Order;
