// Order moments -> Meta events, each sent at most once per order, with retries.
//   order placed        -> Lead            (the browser sends the same event_id: Meta counts it once)
//   confirmed by phone  -> Purchase
//   ZR delivered        -> OrderDelivered
//   refused / returned  -> OrderReturned   (only after a Purchase)
//   cancelled           -> OrderCancelled  (only after a Purchase)
const Order = require('../models/orderModel');
const metaCapi = require('./metaCapi');
const logger = require('../lib/logger');
const { env } = require('../config/env');

const EVENT_NAMES = {
    lead: 'Lead',
    purchase: 'Purchase',
    delivered: 'OrderDelivered',
    returned: 'OrderReturned',
    cancelled: 'OrderCancelled',
};
const PURCHASE_STATUSES = ['Confirmed', 'Shipped', 'Delivered'];
const MAX_EVENT_AGE_MS = 6.5 * 24 * 60 * 60 * 1000; // Meta refuses events older than 7 days
const LOOP_EVERY_MS = 15 * 60 * 1000;
const TRACKING_KEEP_DAYS = 37; // about 30 days after an order is closed

const eventIdFor = (kind, orderId) => `${kind}_${orderId}`;

const deliver = async (order, kind, eventTime, log) => {
    const event = metaCapi.buildEvent({ name: EVENT_NAMES[kind], eventId: eventIdFor(kind, order._id), eventTime, order });
    const result = await metaCapi.sendEvents([event]);
    log.info({
        event: 'meta.capi',
        name: EVENT_NAMES[kind],
        orderId: order._id,
        eventsReceived: result.eventsReceived,
        ms: result.ms,
        test: Boolean(env.meta.testEventCode),
    }, 'Meta event sent');
};

// Claims the event on the order first, so two quick taps can never send it twice.
// A failed send is queued and retried by the loop below.
const sendOrderEvent = async (orderId, kind, log = logger) => {
    if (!metaCapi.isConfigured()) return false;

    const eventTime = new Date();
    const claimed = await Order.findOneAndUpdate(
        { _id: orderId, [`metaEvents.${kind}`]: { $exists: false } },
        { $set: { [`metaEvents.${kind}`]: eventTime } }
    );
    if (!claimed) return false;

    const order = await Order.findById(orderId).populate('product', 'title').lean();
    try {
        await deliver(order, kind, eventTime, log);
        return true;
    } catch (err) {
        log.warn({ event: 'meta.capi_failed', name: EVENT_NAMES[kind], orderId, status: err.status, detail: err.message }, 'Meta event failed, will retry');
        await Order.updateOne({ _id: orderId }, {
            $push: { 'metaEvents.retry': { kind, eventTime, attempts: 1, lastError: String(err.message).slice(0, 200) } },
        });
        return false;
    }
};

// Called after an order's status changes (dashboard or ZR). Runs in the background and never throws.
const onStatusChange = (order, to, log = logger) => {
    const kinds = [];
    if (PURCHASE_STATUSES.includes(to)) kinds.push('purchase');
    if (to === 'Delivered') kinds.push('delivered');
    if (to === 'Returned' && order.metaEvents?.purchase) kinds.push('returned');
    if (to === 'Cancelled' && order.metaEvents?.purchase) kinds.push('cancelled');

    return Promise.all(kinds.map((kind) => sendOrderEvent(order._id, kind, log).catch((err) => {
        log.error({ err, orderId: order._id, name: EVENT_NAMES[kind] }, 'Meta event error');
    })));
};

const runRetries = async (log = logger) => {
    if (!metaCapi.isConfigured()) return;
    const orders = await Order.find({ 'metaEvents.retry.0': { $exists: true } }).populate('product', 'title').limit(50).lean();

    for (const order of orders) {
        for (const item of order.metaEvents.retry) {
            const done = { $pull: { 'metaEvents.retry': { _id: item._id } } };
            if (Date.now() - new Date(item.eventTime).getTime() > MAX_EVENT_AGE_MS) {
                await Order.updateOne({ _id: order._id }, done);
                log.warn({ event: 'meta.capi_gave_up', name: EVENT_NAMES[item.kind], orderId: order._id, attempts: item.attempts }, 'Meta event older than 7 days, dropped');
                continue;
            }
            try {
                // Sent with its original time, so Meta sees when it really happened
                await deliver(order, item.kind, new Date(item.eventTime), log);
                await Order.updateOne({ _id: order._id }, done);
            } catch (err) {
                await Order.updateOne(
                    { _id: order._id, 'metaEvents.retry._id': item._id },
                    { $inc: { 'metaEvents.retry.$.attempts': 1 }, $set: { 'metaEvents.retry.$.lastError': String(err.message).slice(0, 200) } }
                );
            }
        }
    }
};

// Browser details are only needed to send the events: erase them once the order is long closed
const forgetOldTracking = () => Order.updateMany(
    {
        status: { $in: ['Delivered', 'Returned', 'Cancelled'] },
        createdAt: { $lt: new Date(Date.now() - TRACKING_KEEP_DAYS * 24 * 60 * 60 * 1000) },
        tracking: { $exists: true },
    },
    { $unset: { tracking: 1 } }
);

// Called once by server.js
const start = () => {
    if (!metaCapi.isConfigured()) logger.info('Meta Conversions API not configured (META_CAPI_TOKEN): only the browser Pixel sends events');
    else if (env.meta.testEventCode) logger.warn('META_TEST_EVENT_CODE is set: Meta counts server events as tests only');

    const tick = () => Promise.all([runRetries(), forgetOldTracking()])
        .catch((err) => logger.error({ err }, 'Meta background loop failed'));
    const timer = setInterval(tick, LOOP_EVERY_MS);
    timer.unref();
};

const status = async () => ({
    configured: metaCapi.isConfigured(),
    pixelId: env.meta.pixelId || null,
    testMode: Boolean(env.meta.testEventCode),
    retrying: await Order.countDocuments({ 'metaEvents.retry.0': { $exists: true } }),
});

module.exports = { sendOrderEvent, onStatusChange, runRetries, forgetOldTracking, start, status, EVENT_NAMES };
