const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { WILAYAS } = require('../data/algeria');

const algiers = WILAYAS.find((wilaya) => wilaya.code === '16');
let product;

before(startDb);
after(stopDb);
beforeEach(async () => {
    await clearDb();
    product = await Product.create({
        title: 'Jolie Blouse',
        slug: 'jolie-blouse',
        price: 3500,
        colors: [
            { name: 'Rose', sizes: [{ value: '38', stock: 2 }, { value: '40', stock: 0 }, { value: '42', stock: 1 }] },
            { name: 'Bleu', sizes: [{ value: '38', stock: 1 }] },
        ],
    });
});

const placeOrder = (customer = {}) => request(app).post('/api/orders').send({
    product: product._id.toString(),
    variant: { color: 'Rose', size: '38' },
    customer: {
        name: 'Test Client',
        phone: '0661234567',
        wilaya: algiers.name,
        commune: 'Kouba',
        address: 'Rue 1',
        deliveryType: 'home',
        ...customer,
    },
});
const editOrder = (id, body, auth = authHeader()) => request(app).patch(`/api/orders/${id}`).set(auth).send(body);
const stockOf = async (color, size) =>
    (await Product.findById(product._id).lean()).colors.find((entry) => entry.name === color).sizes.find((entry) => entry.value === size).stock;

test('after the call, the size of a pending order can be changed; confirming then takes the new size from stock', async () => {
    const { body: order } = await placeOrder().expect(201);

    const res = await editOrder(order._id, { color: 'Rose', size: '42' }).expect(200);
    assert.equal(res.body.variant.size, '42');
    assert.equal(res.body.warning, undefined);
    assert.equal(res.body.tracking, undefined);
    assert.equal(await stockOf('Rose', '42'), 1, 'editing a pending order does not touch stock');

    await request(app).put(`/api/orders/${order._id}/status`).set(authHeader()).send({ status: 'Confirmed' }).expect(200);
    assert.equal(await stockOf('Rose', '42'), 0);
    assert.equal(await stockOf('Rose', '38'), 2);
});

test('another color can be chosen; a size without stock is saved with a warning', async () => {
    const { body: order } = await placeOrder().expect(201);

    const blue = await editOrder(order._id, { color: 'Bleu', size: '38' }).expect(200);
    assert.equal(blue.body.variant.color, 'Bleu');

    const empty = await editOrder(order._id, { color: 'Rose', size: '40' }).expect(200);
    assert.equal(empty.body.variant.size, '40');
    assert.match(empty.body.warning, /no stock left/);
});

test('unknown colors and sizes are refused', async () => {
    const { body: order } = await placeOrder().expect(201);
    await editOrder(order._id, { color: 'Vert', size: '38' }).expect(400);
    await editOrder(order._id, { size: '99' }).expect(400);
    await editOrder(order._id, { color: 'Bleu', size: '42' }).expect(400); // Bleu only comes in 38

    // Only the color sent: the size already on the order is kept when the new color has it
    await editOrder(order._id, { color: 'Bleu' }).expect(200);
    const saved = await Order.findById(order._id).lean();
    assert.deepEqual([saved.variant.color, saved.variant.size], ['Bleu', '38']);
});

test('once confirmed, the size is locked but the address can still be fixed', async () => {
    const { body: order } = await placeOrder().expect(201);
    await request(app).put(`/api/orders/${order._id}/status`).set(authHeader()).send({ status: 'Confirmed' }).expect(200);

    const locked = await editOrder(order._id, { size: '42' }).expect(409);
    assert.match(locked.body.message, /only be changed while the order is Pending/);

    const res = await editOrder(order._id, { address: '  Cité 20 août, bâtiment 3  ' }).expect(200);
    assert.equal(res.body.customer.address, 'Cité 20 août, bâtiment 3');
});

test('home delivery keeps an address, and a parcel already at ZR keeps its address', async () => {
    const { body: order } = await placeOrder().expect(201);
    await editOrder(order._id, { address: '   ' }).expect(400);

    await Order.updateOne({ _id: order._id }, { $set: { 'delivery.parcelId': 'parcel-1' } });
    const sent = await editOrder(order._id, { address: 'Rue 2' }).expect(409);
    assert.match(sent.body.message, /ZR portal/);
});

test('editing is protected and validated', async () => {
    const { body: order } = await placeOrder().expect(201);
    await editOrder(order._id, { size: '42' }, {}).expect(401);
    await editOrder('not-an-id', { size: '42' }).expect(400);
    await editOrder('000000000000000000000000', { size: '42' }).expect(404);
    await editOrder(order._id, {}).expect(400);

    // Nothing different: the order comes back unchanged
    const same = await editOrder(order._id, { size: '38', address: 'Rue 1' }).expect(200);
    assert.equal(same.body.variant.size, '38');
});
