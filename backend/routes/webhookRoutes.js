const express = require('express');
const mongoose = require('mongoose');
const { Webhook } = require('svix');
const Order = require('../models/orderModel');
const WebhookEvent = require('../models/webhookEventModel');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');
const { applyParcelUpdate } = require('../services/zrParcels');

const router = express.Router();

// Our order id travels to ZR as externalId; the parcel id is the fallback
const findOrder = (parcel) => {
    if (parcel.externalId && mongoose.isValidObjectId(parcel.externalId)) return Order.findById(parcel.externalId).lean();
    if (parcel.id) return Order.findOne({ 'delivery.parcelId': parcel.id }).lean();
    return null;
};

// @route   POST /api/webhooks/zr   (called by ZR Express, signed with Svix)
// Mounted before express.json(): the signature is checked on the raw body.
router.post('/zr', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
    if (!env.zr.webhookSecret) throw new HttpError(503, 'ZR webhook secret is not configured');

    const messageId = req.headers['svix-id'];
    const payload = Buffer.from(req.body || '').toString('utf8');
    try {
        // Throws if the signature or timestamp is wrong (svix only checks, it doesn't return the message)
        new Webhook(env.zr.webhookSecret).verify(payload, {
            'svix-id': messageId,
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        });
    } catch {
        req.log.warn({ event: 'zr.webhook_rejected' }, 'ZR webhook with an invalid signature');
        throw new HttpError(401, 'Invalid signature');
    }

    let event;
    try {
        event = JSON.parse(payload);
    } catch {
        throw new HttpError(400, 'Malformed JSON');
    }

    // ZR/Svix can deliver the same message again: handle each one once
    if (await WebhookEvent.exists({ _id: messageId })) {
        return res.json({ received: true, duplicate: true });
    }

    const parcel = event?.data || {};
    const order = await findOrder(parcel);
    if (!order) {
        req.log.warn({ event: 'zr.webhook_unmatched', parcelId: parcel.id, externalId: parcel.externalId }, 'ZR webhook for an unknown order');
    } else {
        const result = await applyParcelUpdate(order, parcel, event.occurredAt, req.log);
        req.log.info({
            event: 'zr.webhook',
            type: event.eventType,
            orderId: order._id,
            state: parcel.state?.name,
            situation: parcel.situation?.slug,
            to: result.to || null,
            ignored: result.ignored,
        }, 'ZR webhook handled');
    }

    await WebhookEvent.create({ _id: messageId, type: event.eventType }).catch((err) => {
        if (err.code !== 11000) throw err;
    });
    res.json({ received: true });
});

module.exports = router;
