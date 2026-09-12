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
        colors: [{ name: 'Rose', sizes: [{ value: '38', stock: 2 }, { value: '40', stock: 0 }] }],
    });
});

const customer = (overrides = {}) => ({
    name: 'Test Client',
    phone: '0661234567',
    wilaya: algiers.name,
    commune: 'Kouba',
    address: 'Rue 1',
    deliveryType: 'home',
    ...overrides,
});

const orderBody = (overrides = {}) => ({
    product: product._id.toString(),
    variant: { color: 'Rose', size: '38' },
    customer: customer(),
    pricing: { itemPrice: 1, shippingPrice: 0, totalPrice: 1 },
    ...overrides,
});

const placeOrder = (body = orderBody()) => request(app).post('/api/orders').send(body);
const setStatus = (id, status, auth = authHeader()) => request(app).put(`/api/orders/${id}/status`).set(auth).send({ status });
const stockOf = async (size) => (await Product.findById(product._id).lean()).colors[0].sizes.find((entry) => entry.value === size).stock;

test('the server sets the price and ignores the total sent by the browser', async () => {
    const res = await placeOrder().expect(201);
    assert.deepEqual(res.body.pricing, { itemPrice: 3500, shippingPrice: 400, totalPrice: 3900, discount: 0 });
    assert.equal(res.body.customer.wilayaCode, '16');

    const desk = await placeOrder(orderBody({ customer: customer({ phone: '0770000000', deliveryType: 'desk', address: '' }) })).expect(201);
    assert.equal(desk.body.pricing.totalPrice, 3500);
});

test('phone numbers are normalised and validated', async () => {
    const res = await placeOrder(orderBody({ customer: customer({ phone: '+213 661 23 45 67' }) })).expect(201);
    assert.equal(res.body.customer.phone, '0661234567');
    const bad = await placeOrder(orderBody({ customer: customer({ phone: '0123' }) })).expect(400);
    assert.equal(bad.body.details[0].field, 'customer.phone');
});

test('unavailable choices are rejected', async () => {
    await placeOrder(orderBody({ variant: { color: 'Rose', size: '99' } })).expect(400);
    await placeOrder(orderBody({ variant: { color: 'Vert', size: '38' } })).expect(400);
    await placeOrder(orderBody({ variant: { color: 'Rose' } })).expect(400);
    await placeOrder(orderBody({ variant: { color: 'Rose', size: '40' } })).expect(409);
    await placeOrder(orderBody({ customer: customer({ wilaya: 'Atlantis' }) })).expect(400);
    await placeOrder(orderBody({ customer: customer({ address: '' }) })).expect(400);
    await placeOrder(orderBody({ product: '000000000000000000000000' })).expect(404);
    assert.equal(await Order.countDocuments(), 0);
});

test('the same phone ordering the same product twice within 10 minutes gets the first order back', async () => {
    const first = await placeOrder().expect(201);
    const second = await placeOrder().expect(200);
    assert.equal(second.body._id, first.body._id);
    assert.equal(await Order.countDocuments(), 1);
});

test('a second color or size of the same product within 10 minutes is a new order', async () => {
    await Product.updateOne({ _id: product._id }, { $set: { 'colors.0.sizes.1.stock': 3 } });
    const first = await placeOrder().expect(201);
    const second = await placeOrder(orderBody({ variant: { color: 'Rose', size: '40' } })).expect(201);
    assert.notEqual(second.body._id, first.body._id);
    assert.equal(await Order.countDocuments(), 2);
});

test('the orders list needs the admin token, is paginated and has counts', async () => {
    await request(app).get('/api/orders').expect(401);
    await placeOrder().expect(201);
    await placeOrder(orderBody({ customer: customer({ phone: '0770000000', name: 'Autre Cliente' }) })).expect(201);

    const res = await request(app).get('/api/orders?limit=1').set(authHeader()).expect(200);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.pages, 2);
    assert.equal(res.body.orders.length, 1);
    assert.equal(res.body.orders[0].product.title, 'Jolie Blouse');
    assert.deepEqual(res.body.counts, { Pending: 2, Confirmed: 0, Shipped: 0, Delivered: 0, Cancelled: 0 });

    const byPhone = await request(app).get('/api/orders?q=0661').set(authHeader()).expect(200);
    assert.equal(byPhone.body.total, 1);
    const byName = await request(app).get('/api/orders?q=autre').set(authHeader()).expect(200);
    assert.equal(byName.body.total, 1);
    await request(app).get('/api/orders?status=Lost').set(authHeader()).expect(400);
});

test('confirming takes stock once, even with two quick taps; cancelling gives it back', async () => {
    const { body: order } = await placeOrder().expect(201);
    await Promise.all([setStatus(order._id, 'Confirmed').expect(200), setStatus(order._id, 'Confirmed').expect(200)]);
    assert.equal(await stockOf('38'), 1);

    await setStatus(order._id, 'Shipped').expect(200);
    assert.equal(await stockOf('38'), 1);

    await setStatus(order._id, 'Cancelled').expect(200);
    assert.equal(await stockOf('38'), 2);
    await setStatus(order._id, 'Cancelled').expect(200);
    assert.equal(await stockOf('38'), 2);
});

test('delivered revenue only counts delivered orders', async () => {
    const { body: order } = await placeOrder().expect(201);
    await placeOrder(orderBody({ customer: customer({ phone: '0770000000' }) })).expect(201);
    await setStatus(order._id, 'Delivered').expect(200);
    const res = await request(app).get('/api/orders').set(authHeader()).expect(200);
    assert.equal(res.body.deliveredRevenue, 3900);
    assert.equal(await stockOf('38'), 1);
});

test('confirming when the size has no stock left still confirms, with a warning', async () => {
    const order = await Order.create({
        product: product._id,
        variant: { color: 'Rose', size: '40' },
        customer: customer(),
        pricing: { itemPrice: 3500, shippingPrice: 400, totalPrice: 3900 },
    });
    const res = await setStatus(order._id, 'Confirmed').expect(200);
    assert.equal(res.body.status, 'Confirmed');
    assert.match(res.body.warning, /No stock left for Rose \/ 40/);
    assert.equal(await stockOf('40'), 0);
    assert.equal((await Order.findById(order._id)).stockReserved, false);
});

test('status updates are protected and validated', async () => {
    const { body: order } = await placeOrder().expect(201);
    await setStatus(order._id, 'Confirmed', {}).expect(401);
    await setStatus(order._id, 'Lost').expect(400);
    await setStatus('000000000000000000000000', 'Confirmed').expect(404);
    await setStatus('not-an-id', 'Confirmed').expect(400);
});

test('sending to delivery says it is not connected yet instead of faking a tracking number', async () => {
    const { body: order } = await placeOrder().expect(201);
    const res = await request(app).post(`/api/orders/${order._id}/delivery`).set(authHeader()).expect(501);
    assert.match(res.body.message, /ZR Express/);
    assert.equal((await Order.findById(order._id)).status, 'Pending');
});
