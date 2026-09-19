const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { orderItems, hasVariant } = require('../lib/orderItems');

const STOCK_PATH = 'colors.$[c].sizes.$[s].stock';

const variantFilters = (item, sizeCondition = {}) => [
    { 'c.name': item.color },
    { 's.value': item.size, ...sizeCondition },
];

// Takes one unit per piece of the order when it is confirmed.
// The order's stockReserved flag is claimed first, so two quick "Confirm" taps
// can never take the stock twice.
const reserveStock = async (order) => {
    const items = orderItems(order);
    if (!items.some(hasVariant)) return { stock: 'none' };

    const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockReserved: { $ne: true } },
        { stockReserved: true }
    );
    if (!claimed) return { stock: 'already_reserved' };

    const taken = [];
    const missing = [];
    for (const [index, item] of items.entries()) {
        if (!hasVariant(item)) continue;
        const result = await Product.updateOne(
            { _id: order.product },
            { $inc: { [STOCK_PATH]: -1 } },
            { arrayFilters: variantFilters(item, { 's.stock': { $gt: 0 } }) }
        );
        if (result.modifiedCount === 1) taken.push(index);
        else missing.push(`${item.color} / ${item.size}`);
    }

    // Nothing left to take: keep the order confirmed but tell the admin
    const warning = missing.length ? `No stock left for ${missing.join(', ')}` : undefined;
    if (!taken.length) {
        await Order.updateOne({ _id: order._id }, { stockReserved: false });
        return { stock: 'none', warning };
    }

    // Remember which pieces were taken, so cancelling gives back exactly those
    if (order.items?.length) {
        await Order.updateOne(
            { _id: order._id },
            { $set: Object.fromEntries(taken.map((index) => [`items.${index}.stockTaken`, true])) }
        );
    }
    return { stock: 'reserved', ...(warning && { warning }) };
};

// Gives the units back when a confirmed order is cancelled or returned
const releaseStock = async (order) => {
    // The order as it was just before the flag is released: its items say which pieces were taken
    const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockReserved: true },
        { stockReserved: false }
    ).lean();
    if (!claimed) return false;

    const taken = claimed.items?.length
        ? claimed.items.map((item, index) => ({ item, index })).filter(({ item }) => item.stockTaken)
        : [{ item: claimed.variant }].filter(({ item }) => hasVariant(item));

    for (const { item } of taken) {
        await Product.updateOne(
            { _id: claimed.product },
            { $inc: { [STOCK_PATH]: 1 } },
            { arrayFilters: variantFilters(item) }
        );
    }
    if (claimed.items?.length && taken.length) {
        await Order.updateOne(
            { _id: claimed._id },
            { $set: Object.fromEntries(taken.map(({ index }) => [`items.${index}.stockTaken`, false])) }
        );
    }
    return true;
};

module.exports = { reserveStock, releaseStock };
