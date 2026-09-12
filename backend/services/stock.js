const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const STOCK_PATH = 'colors.$[c].sizes.$[s].stock';

const variantFilters = (order, sizeCondition = {}) => [
    { 'c.name': order.variant.color },
    { 's.value': order.variant.size, ...sizeCondition },
];

const hasVariant = (order) => Boolean(order.variant?.color && order.variant?.size);

// Takes one unit of the ordered color/size when an order is confirmed.
// The order's stockReserved flag is claimed first, so two quick "Confirm" taps
// can never take two units.
const reserveStock = async (order) => {
    if (!hasVariant(order)) return { stock: 'none' };

    const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockReserved: { $ne: true } },
        { stockReserved: true }
    );
    if (!claimed) return { stock: 'already_reserved' };

    const result = await Product.updateOne(
        { _id: order.product },
        { $inc: { [STOCK_PATH]: -1 } },
        { arrayFilters: variantFilters(order, { 's.stock': { $gt: 0 } }) }
    );
    if (result.modifiedCount === 1) return { stock: 'reserved' };

    // Nothing left to take: keep the order confirmed but tell the admin
    await Order.updateOne({ _id: order._id }, { stockReserved: false });
    return { stock: 'none', warning: `No stock left for ${order.variant.color} / ${order.variant.size}` };
};

// Gives the unit back when a confirmed order is cancelled
const releaseStock = async (order) => {
    const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockReserved: true },
        { stockReserved: false }
    );
    if (!claimed) return false;

    await Product.updateOne(
        { _id: order.product },
        { $inc: { [STOCK_PATH]: 1 } },
        { arrayFilters: variantFilters(order) }
    );
    return true;
};

module.exports = { reserveStock, releaseStock };
