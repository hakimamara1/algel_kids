const { z } = require('zod');
const Order = require('../models/orderModel');
const { HttpError } = require('../lib/httpError');
const { maskPhone } = require('../lib/privacy');
const { priceOrder } = require('../services/orderPricing');
const { reserveStock, releaseStock } = require('../services/stock');

const { ORDER_STATUSES } = Order;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const RESERVING_STATUSES = ['Confirmed', 'Shipped', 'Delivered'];
const RELEASING_STATUSES = ['Cancelled'];

// "0661 23 45 67" or "+213 661 23 45 67" -> "0661234567"
const normalizePhone = (value) => {
    const digits = String(value).replace(/\D/g, '');
    return digits.startsWith('213') && digits.length === 12 ? `0${digits.slice(3)}` : digits;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Color and size are compared exactly as stored, so they are not trimmed
const createOrderSchema = z.object({
    product: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid product'),
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
    }),
});

const listSchema = z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    q: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

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

    const { wilayaCode, pricing } = await priceOrder({
        productId,
        color: variant.color,
        size: variant.size,
        wilaya: customer.wilaya,
        deliveryType: customer.deliveryType,
    });

    const order = await Order.create({ product: productId, variant, customer: { ...customer, wilayaCode }, pricing });
    req.log.info({
        event: 'order.created',
        orderId: order._id,
        productId,
        color: variant.color,
        size: variant.size,
        wilayaCode,
        deliveryType: customer.deliveryType,
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
        filter.$or = [{ 'customer.name': pattern }, { 'customer.phone': pattern }];
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

    const updated = await Order.findByIdAndUpdate(
        order._id,
        { status },
        { returnDocument: 'after', runValidators: true }
    ).lean();

    req.log.info({ event: 'order.status_changed', orderId: order._id, from: order.status, to: status, stock }, 'Order status changed');
    res.json(warning ? { ...updated, warning } : updated);
};

// @route   POST /api/orders/:id/delivery   (admin)
// The old version faked a tracking number. ZR Express comes in the dashboard plan.
const sendToDelivery = () => {
    throw new HttpError(501, 'Delivery provider is not connected yet. Create this parcel in your ZR Express account.');
};

module.exports = { createOrder, listOrders, updateOrderStatus, sendToDelivery };
