const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const LandingStat = require('../models/landingStatModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { algeriaDay } = require('../lib/days');
const { WILAYAS } = require('../data/algeria');

before(startDb);
after(stopDb);
beforeEach(clearDb);

const beacon = (body) => request(app).post('/api/funnel').set('Content-Type', 'text/plain;charset=UTF-8').send(JSON.stringify(body));
const step = { step: 'error', reason: 'phone', productId: '6aa4b47be4092228b138061f' };

test('order-form steps are accepted as a text beacon (what navigator.sendBeacon sends) or as JSON', async () => {
    await beacon(step).expect(204);
    await request(app).post('/api/funnel').send({ step: 'wilaya', wilaya: '16', shipping: 600 }).expect(204);
    await request(app).post('/api/funnel').send({ step: 'submit' }).expect(204);
});

test('unknown steps, reasons and broken bodies are refused', async () => {
    await request(app).post('/api/funnel').send({ step: 'hacked' }).expect(400);
    await request(app).post('/api/funnel').send({ step: 'error', reason: 'free text' }).expect(400);
    await request(app).post('/api/funnel').send({ step: 'view', landing: '../admin' }).expect(400);
    await request(app).post('/api/funnel').set('Content-Type', 'text/plain').send('{not json').expect(400);
});

test('visits and form steps are counted per page per day; errors and steps without a page are not', async () => {
    await Promise.all([
        beacon({ step: 'view', landing: 'uniforme' }),
        beacon({ step: 'view', landing: 'uniforme' }),
        beacon({ step: 'view', landing: 'uniforme' }),
        beacon({ step: 'checkout', landing: 'uniforme' }),
        beacon({ step: 'wilaya', landing: 'uniforme', wilaya: 16, shipping: 600 }),
        beacon({ step: 'submit', landing: 'uniforme' }),
        beacon({ step: 'error', reason: 'phone', landing: 'uniforme' }),
        beacon({ step: 'view', landing: 'uniforme-b' }),
        beacon({ step: 'view' }),
    ].map((call) => call.expect(204)));

    const rows = await LandingStat.find().sort({ landing: 1 }).lean();
    assert.deepEqual(rows.map(({ landing, day, views, checkouts, wilaya, submit }) => ({ landing, day, views, checkouts, wilaya, submit })), [
        { landing: 'uniforme', day: algeriaDay(), views: 3, checkouts: 1, wilaya: 1, submit: 1 },
        { landing: 'uniforme-b', day: algeriaDay(), views: 1, checkouts: 0, wilaya: 0, submit: 0 },
    ]);
});

test('the dashboard compares pages: visitors, orders, outcome and sales', async () => {
    const product = await Product.create({
        title: 'Uniforme scolaire',
        slug: 'uniforme',
        price: 3900,
        offers: [{ quantity: 2, price: 7200 }],
        colors: [{ name: 'Navy', sizes: [{ value: '6 ans', stock: 10 }] }],
    });
    const algiers = WILAYAS.find((wilaya) => wilaya.code === '16');
    const order = (phone, extra) => request(app).post('/api/orders').send({
        product: product._id.toString(),
        customer: { name: 'Maman', phone, wilaya: algiers.name, commune: 'Kouba', address: 'Rue 1' },
        ...extra,
    }).expect(201);

    for (let i = 0; i < 4; i += 1) await beacon({ step: 'view', landing: 'uniforme' }).expect(204);
    await beacon({ step: 'view', landing: `p-${product._id}` }).expect(204);

    const { body: pack } = await order('0661000001', { landing: 'uniforme', items: [{ color: 'Navy', size: '6 ans' }, { color: 'Navy', size: '6 ans' }] });
    await order('0661000002', { landing: 'uniforme', items: [{ color: 'Navy', size: '6 ans' }] });
    await order('0661000003', { variant: { color: 'Navy', size: '6 ans' } });
    // An order from before pages were tracked still counts for its product page
    await Order.create({
        product: product._id, variant: { color: 'Navy', size: '6 ans' },
        customer: { name: 'Old', phone: '0661000004', wilaya: 'x', commune: 'y' },
        pricing: { itemPrice: 3900, shippingPrice: 400, totalPrice: 4300 },
    });

    const confirm = (status) => request(app).put(`/api/orders/${pack._id}/status`).set(authHeader()).send({ status }).expect(200);
    await confirm('Confirmed');
    await confirm('Delivered');

    await request(app).get('/api/admin/landing-stats').expect(401);
    await request(app).get('/api/admin/landing-stats?from=2026-13-01').set(authHeader()).expect(400);

    const { body } = await request(app).get('/api/admin/landing-stats').set(authHeader()).expect(200);
    assert.equal(body.to, algeriaDay());
    const byPage = Object.fromEntries(body.rows.map((row) => [row.landing, row]));

    const landing = byPage.uniforme;
    assert.equal(landing.views, 4);
    assert.equal(landing.orders, 2);
    assert.equal(landing.pieces, 3);
    assert.equal(landing.confirmed, 1);
    assert.equal(landing.delivered, 1);
    assert.equal(landing.sales, 7200);
    assert.equal(landing.conversionRate, 0.5);

    const productPage = byPage[`p-${product._id}`];
    assert.equal(productPage.productTitle, 'Uniforme scolaire');
    assert.equal(productPage.views, 1);
    assert.equal(productPage.orders, 2);
    assert.equal(body.rows[0].landing, 'uniforme');
});
