const mongoose = require('mongoose');

// Webhook message ids already handled (ZR/Svix may deliver the same message twice).
// Kept 30 days, then MongoDB deletes them.
const webhookEventSchema = new mongoose.Schema({
    _id: { type: String }, // svix-id header
    type: { type: String },
    receivedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
