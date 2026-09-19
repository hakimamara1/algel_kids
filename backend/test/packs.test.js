const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { buildParcel } = require('../services/zrParcels');
const { buildEvent } = require('../services/metaCapi');
const { WILAYAS } = require('../data/algeria');

const algiers = WILAYAS.find((wilaya) => wilaya.code === '16');
let product;

before(startDb);
after(stopDb);
beforeEach(async () => {
    await clearDb();
    product = await Product.create({
        title: 'Uniforme scolaire',
        slug: 'uniforme-scolaire',
        price: 3900,
        offers: [{ quantity: 2, price: 7200 }, { quantity: 3, price: 10200 }],
        colors: [
            { name: 'Navy', sizes: [{ value: '6 ans', stock: 3 }, { value: '8 ans', stock: 1 }] },
            { name: 'Bordeaux', sizes: [{ value: '6 ans', stock: 2 }, { value: '8 ans', stock: 0 }] },
        ],
    });
});

const customer = (overrides = {}) => ({
    name: 'Maman Test',
    phone: '0661234567',
    wilaya: algiers.name,
    commune: 'Kouba',
    address: 'Rue 1',
    deliveryType: 'home',
    ...overrides,
});
const placePack = (items, extra = {}) => request(app).post('/api/orders').send({
    product: product._id.toString(),
    items,
    customer: customer(extra.customer),
    ...(extra.landing && { landing: extra.landing }),
});
const setStatus = (id, status) => request(app).put(`/api/orders/${id}/status`).set(authHeader()).send({ status });
const stockOf = async (color, size) =>
    (await Product.findById(product._id).lean()).colors.find((entry) => entry.name === color).sizes.find((entry) => entry.value === size).stock;

const navy6 = { color: 'Navy', size: '6 ans' };
const navy8 = { color: 'Navy', size: '8 ans' };
const bordeaux6 = { color: 'Bordeaux', size: '6 ans' };

test('a pack is priced with the product offer, and each piece keeps its own color and size', async () => {
    const res = await placePack([navy6, bordeaux6], { landing: 'uniforme' }).expect(201);
    assert.equal(res.body.pricing.itemPrice, 7200);
    assert.equal(res.body.pricing.totalPrice, 7200 + res.body.pricing.shippingPrice);
    assert.deepEqual(res.body.items.map(({ color, size }) => [color, size]), [['Navy', '6 ans'], ['Bordeaux', '6 ans']]);
    assert.deepEqual(res.body.variant, { color: 'Navy', size: '6 ans' });
    assert.equal(res.body.source.landing, 'uniforme');
});

test('without an offer for that number, each piece costs the product price; the product page is its own source', async () => {
    await Product.updateOne({ _id: product._id }, { $set: { offers: [] } });
    const pack = await placePack([navy6, navy6]).expect(201);
    assert.equal(pack.body.pricing.itemPrice, 7800);

    const single = await request(app).post('/api/orders')
        .send({ product: product._id.toString(), variant: navy8, customer: customer({ phone: '0770000000' }) }).expect(201);
    assert.equal(single.body.pricing.itemPrice, 3900);
    assert.equal(single.body.source.landing, `p-${product._id}`);
});

test('a pack cannot ask for more pieces of one size than the stock', async () => {
    const short = await placePack([navy8, navy8]).expect(409);
    assert.match(short.body.message, /Only 1 left in size 8 ans/);
    await placePack([bordeaux6, { color: 'Bordeaux', size: '8 ans' }]).expect(409);
    await placePack([navy6, { color: 'Vert', size: '6 ans' }]).expect(400);
    await placePack(Array(6).fill(navy6)).expect(400);
    await placePack([navy6], { landing: 'Not A Slug!' }).expect(400);
});

test('a double tap returns the same pack; different pieces are a new order', async () => {
    const first = await placePack([navy6, bordeaux6]).expect(201);
    const again = await placePack([bordeaux6, navy6]).expect(200);
    assert.equal(again.body._id, first.body._id);

    await placePack([navy6, navy6]).expect(201);
    await placePack([navy6]).expect(201);
    assert.equal(await Order.countDocuments(), 3);
});

test('confirming takes one unit per piece; cancelling gives back exactly what was taken', async () => {
    await Product.updateOne({ _id: product._id }, { $set: { 'colors.1.sizes.0.stock': 1 } });
    const { body: order } = await placePack([navy6, bordeaux6]).expect(201);

    // Someone else takes the last Bordeaux before the call
    await Product.updateOne({ _id: product._id }, { $set: { 'colors.1.sizes.0.stock': 0 } });
    const confirmed = await setStatus(order._id, 'Confirmed').expect(200);
    assert.match(confirmed.body.warning, /No stock left for Bordeaux \/ 6 ans/);
    assert.equal(await stockOf('Navy', '6 ans'), 2);

    const saved = await Order.findById(order._id).lean();
    assert.equal(saved.stockReserved, true);
    assert.deepEqual(saved.items.map((item) => Boolean(item.stockTaken)), [true, false]);

    await setStatus(order._id, 'Cancelled').expect(200);
    assert.equal(await stockOf('Navy', '6 ans'), 3);
    assert.equal(await stockOf('Bordeaux', '6 ans'), 0, 'the Bordeaux piece was never taken, so nothing comes back');
});

test('after the call, each piece of a pending pack can be changed, but not the number of pieces', async () => {
    const { body: order } = await placePack([navy6, navy6]).expect(201);
    const edit = (body) => request(app).patch(`/api/orders/${order._id}`).set(authHeader()).send(body);

    const res = await edit({ items: [navy6, bordeaux6] }).expect(200);
    assert.deepEqual(res.body.items.map((item) => item.color), ['Navy', 'Bordeaux']);

    await edit({ items: [navy6] }).expect(400);
    await edit({ size: '8 ans' }).expect(400);
    const warned = await edit({ items: [navy6, { color: 'Bordeaux', size: '8 ans' }] }).expect(200);
    assert.match(warned.body.warning, /8 ans \(Bordeaux\) has no stock left/);

    await setStatus(order._id, 'Confirmed').expect(200);
    await edit({ items: [navy6, navy6] }).expect(409);
});

test('the ZR parcel and the Meta events describe the whole pack', async () => {
    const { body } = await placePack([navy6, bordeaux6], { landing: 'uniforme' }).expect(201);
    const order = await Order.findById(body._id).populate('product', 'title').lean();

    const parcel = buildParcel({ ...order, customer: { ...order.customer, zr: { wilayaId: 'w', communeId: 'c' } } }, null);
    assert.equal(parcel.description, 'Uniforme scolaire – Navy 6 ans + Bordeaux 6 ans');
    assert.deepEqual(parcel.orderedProducts, [{ productName: 'Uniforme scolaire – Navy 6 ans + Bordeaux 6 ans', unitPrice: 3600, quantity: 2, stockType: 'none' }]);
    assert.equal(parcel.amount, order.pricing.totalPrice);

    const event = buildEvent({ name: 'Purchase', eventId: 'purchase_1', eventTime: new Date(), order });
    assert.equal(event.custom_data.value, 7200);
    assert.equal(event.custom_data.num_items, 2);
    assert.deepEqual(event.custom_data.contents, [{ id: product._id.toString(), quantity: 2 }]);
    assert.equal(event.custom_data.landing_page, 'uniforme');
});

test('pack offers are saved from the product editor', async () => {
    const res = await request(app).put(`/api/products/${product._id}`).set(authHeader())
        .send({ offers: [{ quantity: 2, price: 7000 }] }).expect(200);
    assert.deepEqual(res.body.offers, [{ quantity: 2, price: 7000 }]);
});
