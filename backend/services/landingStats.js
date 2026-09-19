// Results per page (landing pages and product pages) for a range of days, for the dashboard:
// visitors and form steps from the beacons, orders and their outcome from the orders themselves.
const LandingStat = require('../models/landingStatModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { HttpError } = require('../lib/httpError');
const { algeriaDay, dayStart, addDays } = require('../lib/days');

const PRODUCT_PAGE = /^p-([a-f0-9]{24})$/;
const COUNTER_FIELDS = ['views', 'checkouts', 'wilaya', 'submit'];
const ORDER_FIELDS = ['orders', 'pieces', 'confirmed', 'delivered', 'returned', 'cancelled', 'sales'];

const countWhen = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

const landingStats = async ({ from, to } = {}) => {
    const end = to ?? algeriaDay();
    const start = from ?? addDays(end, -6);
    if (start > end) throw new HttpError(400, '"from" must be on or before "to"');

    const [counters, orders] = await Promise.all([
        LandingStat.aggregate([
            { $match: { day: { $gte: start, $lte: end } } },
            { $group: { _id: '$landing', ...Object.fromEntries(COUNTER_FIELDS.map((field) => [field, { $sum: `$${field}` }])) } },
        ]),
        Order.aggregate([
            { $match: { createdAt: { $gte: dayStart(start), $lt: dayStart(addDays(end, 1)) } } },
            {
                $group: {
                    // Orders from before pages were tracked belong to their product page
                    _id: { $ifNull: ['$source.landing', { $concat: ['p-', { $toString: '$product' }] }] },
                    orders: { $sum: 1 },
                    pieces: { $sum: { $max: [{ $size: { $ifNull: ['$items', []] } }, 1] } },
                    confirmed: countWhen({ $in: ['$status', ['Confirmed', 'Shipped', 'Delivered', 'Returned']] }),
                    delivered: countWhen({ $eq: ['$status', 'Delivered'] }),
                    returned: countWhen({ $eq: ['$status', 'Returned'] }),
                    cancelled: countWhen({ $eq: ['$status', 'Cancelled'] }),
                    // The shop's sales: product or pack price of delivered orders (delivery goes to ZR)
                    sales: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$pricing.itemPrice', 0] } },
                },
            },
        ]),
    ]);

    const rows = new Map();
    const rowFor = (landing) => {
        if (!rows.has(landing)) {
            rows.set(landing, { landing, ...Object.fromEntries([...COUNTER_FIELDS, ...ORDER_FIELDS].map((field) => [field, 0])) });
        }
        return rows.get(landing);
    };
    for (const { _id, ...values } of [...counters, ...orders]) Object.assign(rowFor(_id), values);

    // Product pages are shown with the product's name
    const productIds = [...rows.keys()].map((landing) => landing.match(PRODUCT_PAGE)?.[1]).filter(Boolean);
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).select('title').lean() : [];
    const titles = new Map(products.map((product) => [String(product._id), product.title]));

    const result = [...rows.values()].map((row) => {
        const productId = row.landing.match(PRODUCT_PAGE)?.[1];
        return {
            ...row,
            ...(productId && { productId, productTitle: titles.get(productId) ?? null }),
            conversionRate: row.views ? row.orders / row.views : null,
        };
    });
    result.sort((a, b) => b.orders - a.orders || b.views - a.views);

    return { from: start, to: end, rows: result };
};

module.exports = { landingStats };
