// Orders <-> ZR parcels: send, cancel, refresh, and apply ZR's status updates.
const crypto = require('crypto');
const Order = require('../models/orderModel');
const zr = require('./zrExpress');
const zrData = require('./zrData');
const metaEvents = require('./metaEvents');
const { releaseStock } = require('./stock');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');
const { normalizeWord } = require('../lib/text');

// 0661234567 -> +213661234567 (ZR wants international numbers)
const toInternationalPhone = (phone) => `+213${String(phone).replace(/\D/g, '').replace(/^0/, '')}`;

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const productLine = (order) =>
    [order.product?.title || 'Article', order.variant?.color, order.variant?.size].filter(Boolean).join(' – ');

// The parcel as ZR's POST /parcels expects it. Stock stays with the shop: stockType "none".
const buildParcel = (order, readyStateId) => {
    const isDesk = order.customer.deliveryType === 'desk';
    const line = productLine(order);
    return {
        customer: {
            customerId: crypto.randomUUID(), // ZR accepts any id when the customer isn't registered with them
            name: order.customer.name,
            phone: { number1: toInternationalPhone(order.customer.phone) },
        },
        deliveryAddress: {
            cityTerritoryId: order.customer.zr.wilayaId,
            districtTerritoryId: order.customer.zr.communeId,
            ...(order.customer.address && { street: clip(order.customer.address, 250) }),
        },
        ...(isDesk && { hubId: order.customer.zr.hubId }),
        orderedProducts: [{
            productName: clip(line, 200),
            unitPrice: order.pricing.itemPrice,
            quantity: 1,
            stockType: 'none',
        }],
        deliveryType: isDesk ? 'pickup-point' : 'home',
        description: clip(line.length >= 2 ? line : `${line}..`, 250),
        amount: order.pricing.totalPrice, // what the courier collects: product + delivery
        weight: { weight: env.zr.parcelWeight },
        externalId: String(order._id), // unique at ZR: the same order can never become two parcels
        ...(readyStateId && { stateId: readyStateId }),
    };
};

const stateOf = (parcel) => parcel?.state && { id: parcel.state.id, name: parcel.state.name, color: parcel.state.color };
const situationOf = (parcel) => parcel?.situation && { name: parcel.situation.name, slug: parcel.situation.slug };

// ZR state -> our order status (only the two that matter for money and stock)
const classifyParcel = (parcel) => {
    if (parcel?.isReturn) return 'Returned';
    const name = normalizeWord(parcel?.state?.name);
    if (/retour|return/.test(name)) return 'Returned';
    if (name.includes('delivered') || name.startsWith('livre')) return 'Delivered';
    return null;
};

// Used by the webhook and by "Refresh". Ignores news older than what we already have.
const applyParcelUpdate = async (order, parcel, occurredAt, log) => {
    const at = occurredAt ? new Date(occurredAt) : new Date();
    const lastAt = order.delivery?.lastEventAt ? new Date(order.delivery.lastEventAt) : null;
    if (lastAt && at < lastAt) return { ignored: 'older' };

    const set = { 'delivery.lastEventAt': at };
    if (parcel.trackingNumber) set['delivery.trackingNumber'] = parcel.trackingNumber;
    if (parcel.state) set['delivery.state'] = stateOf(parcel);
    if (parcel.situation) set['delivery.situation'] = situationOf(parcel);

    const target = classifyParcel(parcel);
    let to = null;
    if (target === 'Delivered' && ['Confirmed', 'Shipped'].includes(order.status)) to = 'Delivered';
    if (target === 'Returned' && !['Returned', 'Cancelled'].includes(order.status)) to = 'Returned';
    if (to) set.status = to;

    await Order.updateOne({ _id: order._id }, { $set: set });

    if (!target && parcel.state?.name) {
        log.info({ event: 'zr.state_unmapped', orderId: order._id, state: parcel.state.name }, 'ZR state saved on the order');
    }
    if (to) {
        const stock = to === 'Returned' && (await releaseStock(order)) ? 'restored' : 'none';
        log.info({ event: 'order.status_changed', orderId: order._id, from: order.status, to, stock, source: 'zrexpress' }, 'Order status changed by ZR');
        // OrderDelivered / OrderReturned for Meta, in the background
        metaEvents.onStatusChange(order, to, log);
    }
    return { to };
};

// Creates the ZR parcel for one confirmed order and saves its tracking number
const sendOrder = async (orderId, log) => {
    // Claim the order first, so a double tap can't send it twice
    const claimed = await Order.findOneAndUpdate(
        { _id: orderId, status: 'Confirmed', 'delivery.parcelId': { $exists: false }, 'delivery.sending': { $ne: true } },
        { $set: { 'delivery.sending': true } },
        { returnDocument: 'after' }
    ).populate('product', 'title').lean();

    if (!claimed) {
        const order = await Order.findById(orderId).lean();
        if (!order) throw new HttpError(404, 'Order not found');
        if (order.delivery?.parcelId) throw new HttpError(409, `Already sent to ZR Express (${order.delivery.trackingNumber || order.delivery.parcelId})`);
        if (order.delivery?.sending) throw new HttpError(409, 'This order is being sent right now');
        throw new HttpError(409, 'Only confirmed orders can be sent to ZR Express');
    }

    try {
        if (!claimed.customer?.zr?.communeId) {
            throw new HttpError(409, 'This order was placed before ZR Express was connected. Create it in the ZR portal.');
        }
        const created = await zr.createParcel(buildParcel(claimed, zrData.readyStateId()));
        const parcelId = created?.id;
        if (!parcelId) throw new HttpError(502, 'ZR Express did not return a parcel id');

        // The tracking number comes from reading the parcel; "Refresh" can fetch it later if this fails
        const parcel = await zr.getParcel(parcelId).catch(() => null);

        const updated = await Order.findByIdAndUpdate(orderId, {
            $set: {
                status: 'Shipped',
                'delivery.provider': 'zrexpress',
                'delivery.parcelId': parcelId,
                'delivery.trackingNumber': parcel?.trackingNumber,
                'delivery.state': stateOf(parcel),
                'delivery.sentAt': new Date(),
            },
            $unset: { 'delivery.sending': 1 },
        }, { returnDocument: 'after' }).select('-tracking').lean();

        log.info({ event: 'zr.parcel_created', orderId, parcelId, trackingNumber: parcel?.trackingNumber }, 'Parcel created at ZR Express');
        return updated;
    } catch (err) {
        await Order.updateOne({ _id: orderId }, { $unset: { 'delivery.sending': 1 } });
        throw err;
    }
};

// Deletes the ZR parcel (only possible before pickup); the order goes back to Confirmed
const cancelParcel = async (orderId, log) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new HttpError(404, 'Order not found');
    if (!order.delivery?.parcelId) throw new HttpError(409, 'This order has no ZR parcel');

    await zr.deleteParcel(order.delivery.parcelId);
    const updated = await Order.findByIdAndUpdate(orderId, {
        $set: { status: 'Confirmed' },
        $unset: { delivery: 1 },
    }, { returnDocument: 'after' }).select('-tracking').lean();

    log.info({ event: 'zr.parcel_deleted', orderId, parcelId: order.delivery.parcelId }, 'ZR parcel cancelled');
    return updated;
};

// Reads the parcel from ZR now (backup for a missed webhook)
const refreshOrder = async (orderId, log) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new HttpError(404, 'Order not found');
    if (!order.delivery?.parcelId) throw new HttpError(409, 'This order has no ZR parcel');

    const parcel = await zr.getParcel(order.delivery.parcelId);
    await applyParcelUpdate(order, parcel, parcel?.lastStateUpdateAt || new Date(), log);
    return Order.findById(orderId).select('-tracking').lean();
};

module.exports = {
    buildParcel,
    classifyParcel,
    applyParcelUpdate,
    sendOrder,
    cancelParcel,
    refreshOrder,
    toInternationalPhone,
};
