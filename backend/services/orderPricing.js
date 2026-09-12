const Product = require('../models/productModel');
const zrData = require('./zrData');
const { HttpError } = require('../lib/httpError');
const { findWilaya, getShippingRate } = require('../data/algeria');

// Works out the real price of an order from the database.
// Prices sent by the browser are never trusted.
// With ZR places (wilaya/commune/office ids) the delivery price is ZR's; otherwise the fixed table.
const priceOrder = async ({ productId, color, size, customer }) => {
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

    const withPrices = (shippingPrice) => ({
        itemPrice: product.price,
        shippingPrice,
        totalPrice: product.price + shippingPrice,
        discount: 0,
    });

    if (customer.zr && zrData.ready()) {
        const { wilaya, commune, hub, shippingPrice } = zrData.quote({
            wilayaId: customer.zr.wilayaId,
            communeId: customer.zr.communeId,
            deliveryType: customer.deliveryType,
            hubId: customer.zr.hubId,
        });
        return {
            wilayaCode: String(wilaya.code).padStart(2, '0'),
            place: {
                wilaya: wilaya.name,
                commune: commune.name,
                zr: {
                    wilayaId: wilaya.id,
                    communeId: commune.id,
                    communeName: commune.name,
                    ...(commune.postalCode && { postalCode: commune.postalCode }),
                    ...(hub && { hubId: hub.id, hubName: hub.name }),
                },
            },
            pricing: withPrices(shippingPrice),
        };
    }

    const wilayaEntry = findWilaya(customer.wilaya);
    if (!wilayaEntry) throw new HttpError(400, 'Unknown wilaya');

    const rate = getShippingRate(wilayaEntry.code);
    return {
        wilayaCode: wilayaEntry.code,
        place: null,
        pricing: withPrices(customer.deliveryType === 'desk' ? rate.desk : rate.home),
    };
};

module.exports = { priceOrder };
