// Meta Conversions API against a fake Meta server (no network)
process.env.META_PIXEL_ID = '123456789';
process.env.META_CAPI_TOKEN = 'test-meta-token';
process.env.META_TEST_EVENT_CODE = 'TEST123';

const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const request = require('supertest');
const app = require('../app');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const metaEvents = require('../services/metaEvents');
const { applyParcelUpdate } = require('../services/zrParcels');
const { WILAYAS } = require('../data/algeria');

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const silentLog = { info() {}, warn() {}, error() {} };

// Fake Meta: records every event, can fail on demand
const calls = [];
let failuresLeft = 0;
global.fetch = async (url, options = {}) => {
    const body = JSON.parse(options.body);
    calls.push({ url, headers: options.headers, body, event: body.data[0] });
    if (failuresLeft > 0) {
        failuresLeft -= 1;
        return new Response(JSON.stringify({ error: { message: 'Temporary Meta error', fbtrace_id: 'x' } }), { status: 500 });
    }
    return new Response(JSON.stringify({ events_received: 1, fbtrace_id: 'trace' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

const named = (name) => calls.filter((call) => call.event.event_name === name);
// Events are sent in the background: wait until they arrive, then let the DB writes finish
const settle = async (count) => {
    for (let i = 0; i < 200 && calls.length < count; i += 1) await new Promise((resolve) => setTimeout(resolve, 10));
    await new Promise((resolve) => setTimeout(resolve, 50));
};

const algiers = WILAYAS.find((wilaya) => wilaya.code === '16');
let product;

before(startDb);
after(stopDb);
beforeEach(async () => {
    await clearDb();
    calls.length = 0;
    failuresLeft = 0;
    product = await Product.create({
        title: 'Jolie Blouse',
        slug: 'jolie-blouse',
        price: 3500,
        colors: [{ name: 'Rose', sizes: [{ value: '38', stock: 5 }] }],
    });
});

const customer = (phone = '0661234567') => ({
    name: 'Amina Ben Ali',
    phone,
    wilaya: algiers.name,
    commune: 'Kouba',
    address: 'Rue 1',
    deliveryType: 'home',
});
const placeOrder = (phone) => request(app)
    .post('/api/orders')
    .set('User-Agent', 'Mozilla/5.0 (iPhone) Test')
    .send({
        product: product._id.toString(),
        variant: { color: 'Rose', size: '38' },
        customer: customer(phone),
        tracking: { fbp: 'fb.1.1700000000000.111', fbc: 'fb.1.1700000000000.AbCd', sourceUrl: 'https://algel-kids.vercel.app/product/abc?fbclid=AbCd' },
    });
const setStatus = (id, status) => request(app).put(`/api/orders/${id}/status`).set(authHeader()).send({ status });
const confirmedOrder = async (phone) => {
    const { body: order } = await placeOrder(phone).expect(201);
    await setStatus(order._id, 'Confirmed').expect(200);
    return order;
};

test('placing an order sends one Lead with hashed customer data and the product price', async () => {
    const { body: order } = await placeOrder().expect(201);
    assert.equal(order.tracking, undefined); // browser details are not sent back
    await settle(1);

    const [lead] = named('Lead');
    assert.equal(lead.url, 'https://graph.facebook.com/v25.0/123456789/events');
    assert.equal(lead.headers.Authorization, 'Bearer test-meta-token');
    assert.equal(lead.body.test_event_code, 'TEST123');

    const event = lead.event;
    assert.equal(event.event_id, `lead_${order._id}`);
    assert.equal(event.action_source, 'website');
    assert.equal(event.event_source_url, 'https://algel-kids.vercel.app/product/abc?fbclid=AbCd');
    assert.ok(Math.abs(event.event_time - Date.now() / 1000) < 60);
    assert.deepEqual(event.custom_data, {
        currency: 'DZD',
        value: 3500,
        content_ids: [product._id.toString()],
        content_type: 'product',
        content_name: 'Jolie Blouse',
        contents: [{ id: product._id.toString(), quantity: 1 }],
        num_items: 1,
        order_id: order._id,
        landing_page: `p-${product._id}`,
    });

    const user = event.user_data;
    assert.deepEqual(user.ph, [sha('213661234567')]);
    assert.deepEqual(user.external_id, [sha('213661234567')]);
    assert.deepEqual(user.fn, [sha('amina')]);
    assert.deepEqual(user.ln, [sha('benali')]);
    assert.deepEqual(user.ct, [sha('kouba')]);
    assert.deepEqual(user.country, [sha('dz')]);
    assert.equal(user.fbp, 'fb.1.1700000000000.111');
    assert.equal(user.fbc, 'fb.1.1700000000000.AbCd');
    assert.equal(user.client_user_agent, 'Mozilla/5.0 (iPhone) Test');
    assert.ok(user.client_ip_address);

    // A double tap returns the same order and sends no second Lead
    await placeOrder().expect(200);
    await settle(2);
    assert.equal(named('Lead').length, 1);
});

test('confirming sends one Purchase, even with two quick taps; shipping later sends no second one', async () => {
    const { body: order } = await placeOrder().expect(201);
    await settle(1);
    await Promise.all([setStatus(order._id, 'Confirmed').expect(200), setStatus(order._id, 'Confirmed').expect(200)]);
    await settle(2);
    await setStatus(order._id, 'Shipped').expect(200);
    await settle(3);

    const purchases = named('Purchase');
    assert.equal(purchases.length, 1);
    assert.equal(purchases[0].event.event_id, `purchase_${order._id}`);
    assert.equal(purchases[0].event.custom_data.value, 3500);
    // Browser details saved at order time are reused days later
    assert.equal(purchases[0].event.user_data.client_user_agent, 'Mozilla/5.0 (iPhone) Test');
    assert.equal(purchases[0].event.user_data.fbc, 'fb.1.1700000000000.AbCd');
});

test('delivered, returned and cancelled send their own events', async () => {
    const delivered = await confirmedOrder('0661000001');
    await setStatus(delivered._id, 'Delivered').expect(200);

    const returned = await confirmedOrder('0661000002');
    await settle(3);
    const returnedOrder = await Order.findById(returned._id).lean();
    await applyParcelUpdate(returnedOrder, { isReturn: true }, new Date(), silentLog);

    const cancelledAfterConfirm = await confirmedOrder('0661000003');
    await settle(6);
    await setStatus(cancelledAfterConfirm._id, 'Cancelled').expect(200);

    const { body: cancelledBeforeConfirm } = await placeOrder('0661000004').expect(201);
    await setStatus(cancelledBeforeConfirm._id, 'Cancelled').expect(200);
    await settle(10);

    assert.deepEqual(named('OrderDelivered').map((call) => call.event.event_id), [`delivered_${delivered._id}`]);
    assert.deepEqual(named('OrderReturned').map((call) => call.event.event_id), [`returned_${returned._id}`]);
    assert.deepEqual(named('OrderCancelled').map((call) => call.event.event_id), [`cancelled_${cancelledAfterConfirm._id}`]);
    assert.equal(named('Purchase').length, 3);
});

test('a failed send is retried later with its original time', async () => {
    failuresLeft = 1;
    const { body: order } = await placeOrder().expect(201);
    await settle(1);
    let saved = await Order.findById(order._id).lean();
    assert.equal(saved.metaEvents.retry.length, 1);

    await metaEvents.runRetries(silentLog);
    assert.equal(named('Lead').length, 2);
    assert.equal(calls[1].event.event_time, calls[0].event.event_time);
    assert.equal(calls[1].event.event_id, calls[0].event.event_id);
    saved = await Order.findById(order._id).lean();
    assert.equal(saved.metaEvents.retry.length, 0);
});

test('events older than Meta\'s 7-day limit are dropped, not sent', async () => {
    const { body: order } = await placeOrder().expect(201);
    await settle(1);
    await Order.updateOne({ _id: order._id }, {
        $push: { 'metaEvents.retry': { kind: 'purchase', eventTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), attempts: 3 } },
    });
    calls.length = 0;

    await metaEvents.runRetries(silentLog);
    assert.equal(calls.length, 0);
    assert.equal((await Order.findById(order._id).lean()).metaEvents.retry.length, 0);
});

test('browser details are erased about 30 days after an order is closed', async () => {
    const { body: old } = await placeOrder('0661000005').expect(201);
    const { body: recent } = await placeOrder('0661000006').expect(201);
    await settle(2);
    await Order.updateOne({ _id: old._id }, { status: 'Delivered', createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) });
    await Order.updateOne({ _id: recent._id }, { status: 'Delivered' });

    await metaEvents.forgetOldTracking();
    assert.equal((await Order.findById(old._id).lean()).tracking, undefined);
    assert.ok((await Order.findById(recent._id).lean()).tracking.fbp);
});

test('the dashboard shows whether Meta is connected', async () => {
    await request(app).get('/api/admin/meta-status').expect(401);
    const res = await request(app).get('/api/admin/meta-status').set(authHeader()).expect(200);
    assert.deepEqual(res.body, { configured: true, pixelId: '123456789', testMode: true, retrying: 0 });
});
