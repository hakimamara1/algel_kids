const { z } = require('zod');
const Order = require('../models/orderModel');
const { HttpError } = require('../lib/httpError');
const { maskPhone } = require('../lib/privacy');
const { priceOrder } = require('../services/orderPricing');
const { reserveStock, releaseStock } = require('../services/stock');
const zr = require('../services/zrExpress');
const { sendOrder, cancelParcel, refreshOrder } = require('../services/zrParcels');

const { ORDER_STATUSES } = Order;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const RESERVING_STATUSES = ['Confirmed', 'Shipped', 'Delivered'];
const RELEASING_STATUSES = ['Cancelled', 'Returned'];
const BULK_LIMIT = 50;

// "0661 23 45 67" or "+213 661 23 45 67" -> "0661234567"
const normalizePhone = (value) => {
    const digits = String(value).replace(/\D/g, '');
    return digits.startsWith('213') && digits.length === 12 ? `0${digits.slice(3)}` : digits;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
// ZR ids are GUIDs
const guid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid id');

// Color and size are compared exactly as stored, so they are not trimmed
const createOrderSchema = z.object({
    product: objectId,
    variant: z.object({
        color: z.string().max(60).optional(),
        size: z.string().max(30).optional(),
    }).default({}),
    customer: z.object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^(05|06|07)\d{8}$/, 'Invalid phone number')),
        wilaya: z.string().trim().min(1).max(60),
        commune: z.string().trim().min(1).max(80),
        address: z.string().trim().max(300).default(''),
        deliveryType: z.enum(['home', 'desk']).default('home'),
        // Sent by the order form when it uses ZR's lists
        zr: z.object({
            wilayaId: guid,
            communeId: guid,
            hubId: guid.optional(),
        }).optional(),
    }),
});

const listSchema = z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) });
const bulkSchema = z.object({ orderIds: z.array(objectId).max(BULK_LIMIT).optional() });
const labelsSchema = z.object({ orderIds: z.array(objectId).min(1).max(100) });

// @route   POST /api/orders   (public)
const createOrder = async (req, res) => {
    const { product: productId, variant, customer } = createOrderSchema.parse(req.body);
    if (customer.deliveryType === 'home' && !customer.address) {
        throw new HttpError(400, 'Address is required for home delivery');
    }

    // A double tap or a refresh must not create a second order;
    // a second color or size of the same product is a real new order
    const recent = await Order.findOne({
        'customer.phone': customer.phone,
        product: productId,
        'variant.color': variant.color ?? null,
        'variant.size': variant.size ?? null,
        createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    }).lean();
    if (recent) {
        req.log.info({ event: 'order.duplicate_blocked', orderId: recent._id, phone: maskPhone(customer.phone) }, 'Duplicate order ignored');
        return res.status(200).json(recent);
    }

    const { wilayaCode, place, pricing } = await priceOrder({
        productId,
        color: variant.color,
        size: variant.size,
        customer,
    });

    // With ZR places, the server's names replace what the browser sent
    const { zr: _zrInput, ...customerFields } = customer;
    const order = await Order.create({
        product: productId,
        variant,
        customer: { ...customerFields, ...(place && { wilaya: place.wilaya, commune: place.commune, zr: place.zr }), wilayaCode },
        pricing,
    });
    req.log.info({
        event: 'order.created',
        orderId: order._id,
        productId,
        color: variant.color,
        size: variant.size,
        wilayaCode,
        deliveryType: customer.deliveryType,
        zrPrices: Boolean(place),
        total: pricing.totalPrice,
    }, 'Order created');
    res.status(201).json(order);
};

// @route   GET /api/orders?status=&q=&page=&limit=   (admin)
const listOrders = async (req, res) => {
    const { status, q, page, limit } = listSchema.parse(req.query);

    const filter = {};
    if (status) filter.status = status;
    if (q) {
        const pattern = new RegExp(escapeRegex(q), 'i');
        filter.$or = [{ 'customer.name': pattern }, { 'customer.phone': pattern }, { 'delivery.trackingNumber': pattern }];
    }

    const [orders, total, byStatus] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({ path: 'product', select: { title: 1, price: 1, images: { $slice: 1 } } })
            .lean(),
        Order.countDocuments(filter),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalPrice' } } }]),
    ]);

    const counts = Object.fromEntries(ORDER_STATUSES.map((name) => [name, 0]));
    let deliveredRevenue = 0;
    for (const row of byStatus) {
        counts[row._id] = row.count;
        if (row._id === 'Delivered') deliveredRevenue = row.revenue;
    }

    res.json({ orders, page, limit, total, pages: Math.ceil(total / limit), counts, deliveredRevenue });
};

// @route   PUT /api/orders/:id/status   (admin)
const updateOrderStatus = async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new HttpError(404, 'Order not found');

    let stock = 'none';
    let warning;
    if (RESERVING_STATUSES.includes(status)) {
        ({ stock, warning } = await reserveStock(order));
    } else if (RELEASING_STATUSES.includes(status)) {
        stock = (await releaseStock(order)) ? 'restored' : 'none';
    }
    if (status === 'Cancelled' && order.delivery?.parcelId) {
        warning = 'This order still has a ZR parcel: use "Cancel parcel" so ZR does not deliver it.';
    }

    const updated = await Order.findByIdAndUpdate(
        order._id,
        { status },
        { returnDocument: 'after', runValidators: true }
    ).lean();

    req.log.info({ event: 'order.status_changed', orderId: order._id, from: order.status, to: status, stock }, 'Order status changed');
    res.json(warning ? { ...updated, warning } : updated);
};

// @route   POST /api/orders/:id/delivery   (admin) — create the ZR parcel
const sendToDelivery = async (req, res) => {
    if (!zr.isConfigured()) throw new HttpError(503, 'ZR Express is not connected yet (ZR_API_KEY / ZR_TENANT_ID on Render).');
    res.json(await sendOrder(objectId.parse(req.params.id), req.log));
};

// @route   POST /api/orders/delivery/bulk   (admin) — send confirmed orders, oldest first
const sendConfirmedToDelivery = async (req, res) => {
    if (!zr.isConfigured()) throw new HttpError(503, 'ZR Express is not connected yet (ZR_API_KEY / ZR_TENANT_ID on Render).');
    const { orderIds } = bulkSchema.parse(req.body ?? {});
    const filter = orderIds?.length
        ? { _id: { $in: orderIds } }
        : { status: 'Confirmed', 'delivery.parcelId': { $exists: false }, 'customer.zr.communeId': { $exists: true } };
    const orders = await Order.find(filter).select('_id').sort({ createdAt: 1 }).limit(BULK_LIMIT).lean();

    const sent = [];
    const failed = [];
    for (const { _id } of orders) {
        try {
            const order = await sendOrder(_id, req.log);
            sent.push({ orderId: _id, trackingNumber: order.delivery?.trackingNumber || null });
        } catch (err) {
            failed.push({ orderId: _id, message: err.message });
        }
    }
    req.log.info({ event: 'zr.bulk_send', sent: sent.length, failed: failed.length }, 'Bulk send to ZR Express');
    res.json({ sent, failed });
};

// @route   DELETE /api/orders/:id/delivery   (admin) — cancel the ZR parcel before pickup
const cancelDelivery = async (req, res) => {
    res.json(await cancelParcel(objectId.parse(req.params.id), req.log));
};

// @route   POST /api/orders/:id/delivery/refresh   (admin)
const refreshDelivery = async (req, res) => {
    res.json(await refreshOrder(objectId.parse(req.params.id), req.log));
};

// @route   POST /api/orders/delivery/labels   (admin) — one printable page
const printLabels = async (req, res) => {
    const { orderIds } = labelsSchema.parse(req.body);
    const orders = await Order.find({ _id: { $in: orderIds }, 'delivery.trackingNumber': { $exists: true } })
        .select('delivery.trackingNumber')
        .lean();
    if (!orders.length) throw new HttpError(400, 'None of these orders has a tracking number yet');

    const result = await zr.generateLabels(orders.map((order) => order.delivery.trackingNumber));
    res.json({ fileUrl: result?.fileUrl, failed: result?.failedTrackingNumbers || [] });
};

module.exports = {
    createOrder,
    listOrders,
    updateOrderStatus,
    sendToDelivery,
    sendConfirmedToDelivery,
    cancelDelivery,
    refreshDelivery,
    printLabels,
};
