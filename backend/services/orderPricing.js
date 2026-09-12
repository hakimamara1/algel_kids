const Product = require('../models/productModel');
const { HttpError } = require('../lib/httpError');
const { findWilaya, getShippingRate } = require('../data/algeria');

// Works out the real price of an order from the database.
// Prices sent by the browser are never trusted.
const priceOrder = async ({ productId, color, size, wilaya, deliveryType }) => {
    const product = await Product.findById(productId).select('price colors.name colors.sizes').lean();
    if (!product) throw new HttpError(404, 'Product not found');

    if (product.colors?.length) {
        const colorEntry = product.colors.find((entry) => entry.name === color);
        if (!colorEntry) throw new HttpError(400, 'Please choose an available color');

        if (colorEntry.sizes?.length) {
            const sizeEntry = colorEntry.sizes.find((entry) => entry.value === size);
            if (!sizeEntry) throw new HttpError(400, 'Please choose an available size');
            if (sizeEntry.stock <= 0) throw new HttpError(409, 'This size is sold out');
        }
    }

    const wilayaEntry = findWilaya(wilaya);
    if (!wilayaEntry) throw new HttpError(400, 'Unknown wilaya');

    const rate = getShippingRate(wilayaEntry.code);
    const shippingPrice = deliveryType === 'desk' ? rate.desk : rate.home;

    return {
        wilayaCode: wilayaEntry.code,
        pricing: {
            itemPrice: product.price,
            shippingPrice,
            totalPrice: product.price + shippingPrice,
            discount: 0,
        },
    };
};

module.exports = { priceOrder };
