const mongoose = require('mongoose');

// Visitors and order-form steps per page per day (Algeria time), counted from the page beacons.
// `landing` is a landing page slug, or "p-<productId>" for a product page.
const landingStatSchema = new mongoose.Schema({
    landing: { type: String, required: true },
    day: { type: String, required: true }, // "2026-09-17"
    views: { type: Number, default: 0 },
    checkouts: { type: Number, default: 0 }, // started filling the order form
    wilaya: { type: Number, default: 0 }, // chose a wilaya (saw the delivery price)
    submit: { type: Number, default: 0 } // pressed the order button
});

landingStatSchema.index({ landing: 1, day: 1 }, { unique: true });
landingStatSchema.index({ day: 1 });

module.exports = mongoose.model('LandingStat', landingStatSchema);
