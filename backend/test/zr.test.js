// ZR Express integration against a fake ZR API (no network, no real account)
process.env.ZR_API_KEY = 'test-zr-key';
process.env.ZR_TENANT_ID = 'test-tenant';
process.env.ZR_WEBHOOK_SECRET = `whsec_${Buffer.from('angel-kids-webhook-secret-32-byt').toString('base64')}`;

const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { Webhook } = require('svix');
const app = require('../app');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const zrData = require('../services/zrData');
const { WILAYAS } = require('../data/algeria');

const W16 = '11111111-1111-4111-8111-111111111111';
const W31 = '31313131-3131-4131-8131-313131313131';
const BARAKI = '22222222-2222-4222-8222-222222222222';
const KOUBA = '33333333-3333-4333-8333-333333333333';
const ES_SENIA = '44444444-4444-4444-8444-444444444444';
const OFFICE_BARAKI = '55555555-5555-4555-8555-555555555555';
const OFFICE_ORAN = '66666666-6666-4666-8666-666666666666';
const READY = '77777777-7777-4777-8777-777777777777';
const PARCEL = '88888888-8888-4888-8888-888888888888';

const TERRITORIES = [
    { id: W16, code: 16, name: 'Alger', level: 'wilaya', delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: W31, code: 31, name: 'Oran', level: 'wilaya', delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: BARAKI, name: 'Baraki', level: 'commune', parentId: W16, delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: KOUBA, name: 'Kouba', level: 'commune', parentId: W16 },
    { id: ES_SENIA, name: 'Es Senia', level: 'commune', parentId: W31, delivery: { hasHomeDelivery: false, hasPickupPoint: true } },
];
const RATES = {
    rates: [
        { toTerritoryId: W16, toTerritoryLevel: 'wilaya', deliveryPrices: [{ deliveryType: 'home', price: 450 }, { deliveryType: 'pickup-point', price: 350 }, { deliveryType: 'return', price: 400 }] },
        { toTerritoryId: BARAKI, toTerritoryLevel: 'commune', deliveryPrices: [{ deliveryType: 'home', price: 350 }, { deliveryType: 'pickup-point', price: 300 }] },
        { toTerritoryId: W31, toTerritoryLevel: 'wilaya', deliveryPrices: [{ deliveryType: 'home', price: 600 }, { deliveryType: 'pickup-point', price: 500 }] },
    ],
};
const HUBS = [
    { id: OFFICE_BARAKI, name: 'Bureau Baraki', type: 'stopdesk', isPickupPoint: true, address: { cityTerritoryId: W16, districtTerritoryId: BARAKI, district: 'Baraki', street: 'Cité 1' }, openingHours: '08:30-16:30' },
    { id: OFFICE_ORAN, name: 'Bureau Oran', type: 'stopdesk', isPickupPoint: true, address: { cityTerritoryId: W31, districtTerritoryId: ES_SENIA, district: 'Es Senia' } },
    { id: 'sorting-center', name: 'Centre de tri', type: 'sorting-center-hub', isPickupPoint: false, address: { cityTerritoryId: W16 } },
];
const WORKFLOWS = [{ id: 'wf', name: 'New Delivery Workflow', isDefault: true, states: [{ id: 'received', name: 'OrderReceived' }, { id: READY, name: 'ReadyToDispatch' }] }];

// Fake ZR Express: answers like the real API and records every call
const calls = [];
const overrides = new Map();
const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
global.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = new URL(url).pathname.replace('/api/v1', '');
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ method, path, body, headers: options.headers });
    const key = `${method} ${path}`;
    if (overrides.has(key)) return overrides.get(key)();
    switch (key) {
        case 'POST /territories/search': return reply(200, { items: TERRITORIES, hasNext: false });
        case 'GET /delivery-pricing/rates': return reply(200, RATES);
        case 'POST /hubs/search': return reply(200, { items: HUBS, hasNext: false });
        case 'POST /workflows/search': return reply(200, { items: WORKFLOWS, hasNext: false });
        case 'POST /parcels': return reply(201, { id: PARCEL });
        case `GET /parcels/${PARCEL}`: return reply(200, { id: PARCEL, trackingNumber: 'ZR-0001', state: { id: READY, name: 'ReadyToDispatch', color: '#2F5F9E' } });
        case `DELETE /parcels/${PARCEL}`: return reply(204);
        case 'POST /parcels/labels/multiple': return reply(200, { fileUrl: 'https://labels.zr.test/batch.html', failedTrackingNumbers: [] });
        default: return reply(404, { title: 'Not found' });
    }
};

let product;

before(async () => {
    await startDb();
    assert.equal(await zrData.refresh(), true);
});
after(stopDb);
beforeEach(async () => {
    await clearDb();
    calls.length = 0;
    overrides.clear();
    product = await Product.create({
        title: 'Jolie Blouse',
        slug: 'jolie-blouse',
        price: 3500,
        colors: [{ name: 'Rose', sizes: [{ value: '38', stock: 2 }, { value: '40', stock: 2 }] }],
    });
});

const customer = (overrides = {}) => ({
    name: 'Client Test',
    phone: '0661234567',
    wilaya: 'sent by the browser',
    commune: 'sent by the browser',
    address: 'Rue 1',
    deliveryType: 'home',
    zr: { wilayaId: W16, communeId: BARAKI },
    ...overrides,
});
const placeOrder = (body = {}) => request(app).post('/api/orders').send({
    product: product._id.toString(),
    variant: { color: 'Rose', size: '38' },
    customer: customer(),
    pricing: { totalPrice: 1 },
    ...body,
});
const setStatus = (id, status) => request(app).put(`/api/orders/${id}/status`).set(authHeader()).send({ status });
const send = (id) => request(app).post(`/api/orders/${id}/delivery`).set(authHeader());
const stockOf = async (size) => (await Product.findById(product._id).lean()).colors[0].sizes.find((entry) => entry.value === size).stock;
const parcelCall = () => calls.find((call) => call.method === 'POST' && call.path === '/parcels');

const confirmedOrder = async (body) => {
    const { body: order } = await placeOrder(body).expect(201);
    await setStatus(order._id, 'Confirmed').expect(200);
    return order;
};

const secret = process.env.ZR_WEBHOOK_SECRET;
const webhook = (payload, { id = `msg_${Math.random()}`, signWith = secret } = {}) => {
    const body = JSON.stringify(payload);
    const now = new Date();
    return request(app)
        .post('/api/webhooks/zr')
        .set('svix-id', id)
        .set('svix-timestamp', String(Math.floor(now.getTime() / 1000)))
        .set('svix-signature', new Webhook(signWith).sign(id, now, body))
        .set('Content-Type', 'application/json')
        .send(body);
};

test('the order form gets ZR wilayas with Arabic names and real prices', async () => {
    const res = await request(app).get('/api/delivery/wilayas').expect(200);
    assert.match(res.headers['cache-control'], /s-maxage=3600/);
    const [algiers, oran] = res.body.wilayas;
    assert.deepEqual(algiers, { id: W16, code: 16, name: WILAYAS.find((w) => w.code === '16').name, nameFr: 'Alger', home: 450, pickup: 350 });
    assert.equal(oran.name, WILAYAS.find((w) => w.code === '31').name);

    const details = await request(app).get(`/api/delivery/wilayas/${W16}`).expect(200);
    assert.deepEqual(details.body.communes, [
        { id: BARAKI, name: 'Baraki', home: 350, pickup: 300 },
        { id: KOUBA, name: 'Kouba', home: 450, pickup: 350 },
    ]);
    assert.deepEqual(details.body.offices.map((office) => office.name), ['Bureau Baraki']);

    const oranDetails = await request(app).get(`/api/delivery/wilayas/${W31}`).expect(200);
    assert.deepEqual(oranDetails.body.communes[0], { id: ES_SENIA, name: 'Es Senia', home: null, pickup: 500 });
    await request(app).get('/api/delivery/wilayas/unknown').expect(404);
});

test('the server charges ZR\'s price for the chosen commune and office', async () => {
    const home = await placeOrder().expect(201);
    assert.deepEqual(home.body.pricing, { itemPrice: 3500, shippingPrice: 350, totalPrice: 3850, discount: 0 });
    assert.equal(home.body.customer.wilaya, WILAYAS.find((w) => w.code === '16').name);
    assert.equal(home.body.customer.commune, 'Baraki');
    assert.equal(home.body.customer.wilayaCode, '16');
    assert.deepEqual(home.body.customer.zr, { wilayaId: W16, communeId: BARAKI, communeName: 'Baraki' });

    const desk = await placeOrder({ customer: customer({ phone: '0770000001', deliveryType: 'desk', address: '', zr: { wilayaId: W16, communeId: BARAKI, hubId: OFFICE_BARAKI } }) }).expect(201);
    assert.equal(desk.body.pricing.shippingPrice, 300);
    assert.equal(desk.body.customer.zr.hubName, 'Bureau Baraki');

    const kouba = await placeOrder({ customer: customer({ phone: '0770000002', zr: { wilayaId: W16, communeId: KOUBA } }) }).expect(201);
    assert.equal(kouba.body.pricing.shippingPrice, 450);
});

test('ZR choices are checked on the server', async () => {
    await placeOrder({ customer: customer({ zr: { wilayaId: W16, communeId: ES_SENIA } }) }).expect(400);
    await placeOrder({ customer: customer({ deliveryType: 'desk', zr: { wilayaId: W16, communeId: BARAKI, hubId: OFFICE_ORAN } }) }).expect(400);
    await placeOrder({ customer: customer({ deliveryType: 'desk', zr: { wilayaId: W16, communeId: BARAKI } }) }).expect(400);
    await placeOrder({ customer: customer({ zr: { wilayaId: W31, communeId: ES_SENIA } }) }).expect(400);
    await placeOrder({ customer: customer({ zr: { wilayaId: 'not-a-guid', communeId: BARAKI } }) }).expect(400);
    assert.equal(await Order.countDocuments(), 0);
});

test('sending a confirmed order creates the ZR parcel with the right content', async () => {
    const order = await confirmedOrder();
    assert.equal(await stockOf('38'), 1);

    const res = await send(order._id).expect(200);
    assert.equal(res.body.status, 'Shipped');
    assert.equal(res.body.delivery.parcelId, PARCEL);
    assert.equal(res.body.delivery.trackingNumber, 'ZR-0001');
    assert.equal(res.body.delivery.state.name, 'ReadyToDispatch');

    const call = parcelCall();
    assert.equal(call.headers['X-Api-Key'], 'test-zr-key');
    assert.equal(call.headers['X-Tenant'], 'test-tenant');
    const { customer: zrCustomer, ...parcel } = call.body;
    assert.equal(zrCustomer.name, 'Client Test');
    assert.deepEqual(zrCustomer.phone, { number1: '+213661234567' });
    assert.match(zrCustomer.customerId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(parcel, {
        deliveryAddress: { cityTerritoryId: W16, districtTerritoryId: BARAKI, street: 'Rue 1' },
        orderedProducts: [{ productName: 'Jolie Blouse – Rose – 38', unitPrice: 3500, quantity: 1, stockType: 'none' }],
        deliveryType: 'home',
        description: 'Jolie Blouse – Rose – 38',
        amount: 3850,
        weight: { weight: 0.5 },
        externalId: order._id,
        stateId: READY,
    });

    const again = await send(order._id).expect(409);
    assert.match(again.body.message, /Already sent/);
    assert.equal(await stockOf('38'), 1);
});

test('office orders go to the chosen ZR office', async () => {
    const order = await confirmedOrder({ customer: customer({ deliveryType: 'desk', address: '', zr: { wilayaId: W16, communeId: BARAKI, hubId: OFFICE_BARAKI } }) });
    await send(order._id).expect(200);
    const { body } = parcelCall();
    assert.equal(body.deliveryType, 'pickup-point');
    assert.equal(body.hubId, OFFICE_BARAKI);
    assert.equal(body.amount, 3800);
    assert.equal(body.deliveryAddress.street, undefined);
});

test('only confirmed orders placed with ZR places can be sent', async () => {
    const { body: pending } = await placeOrder().expect(201);
    await send(pending._id).expect(409);

    const legacy = await confirmedOrder({
        customer: customer({ phone: '0770000003', zr: undefined, wilaya: WILAYAS.find((w) => w.code === '16').name, commune: 'Kouba' }),
    });
    const res = await send(legacy._id).expect(409);
    assert.match(res.body.message, /before ZR Express was connected/);
    assert.equal(parcelCall(), undefined);
});

test('a ZR refusal is shown to the admin and the order can be sent again', async () => {
    const order = await confirmedOrder();
    overrides.set('POST /parcels', () => reply(400, { title: 'General.Validation', errors: [{ description: 'DeliveryType must be either home or pickup-point.' }] }));
    const refused = await send(order._id).expect(400);
    assert.match(refused.body.message, /^ZR Express: DeliveryType must be/);

    overrides.set('POST /parcels', () => reply(401, {}));
    const badKey = await send(order._id).expect(502);
    assert.match(badKey.body.message, /API key/);

    const saved = await Order.findById(order._id).lean();
    assert.equal(saved.status, 'Confirmed');
    assert.equal(saved.delivery?.sending, undefined);

    overrides.clear();
    await send(order._id).expect(200);
});

test('cancelling the parcel puts the order back to Confirmed, ready to send again', async () => {
    const order = await confirmedOrder();
    await send(order._id).expect(200);
    const res = await request(app).delete(`/api/orders/${order._id}/delivery`).set(authHeader()).expect(200);
    assert.equal(res.body.status, 'Confirmed');
    assert.equal(res.body.delivery, undefined);
    assert.ok(calls.some((call) => call.method === 'DELETE' && call.path === `/parcels/${PARCEL}`));
    await send(order._id).expect(200);
});

test('labels are printed for orders that have a tracking number', async () => {
    const order = await confirmedOrder();
    await request(app).post('/api/orders/delivery/labels').set(authHeader()).send({ orderIds: [order._id] }).expect(400);
    await send(order._id).expect(200);
    const res = await request(app).post('/api/orders/delivery/labels').set(authHeader()).send({ orderIds: [order._id] }).expect(200);
    assert.equal(res.body.fileUrl, 'https://labels.zr.test/batch.html');
    assert.deepEqual(calls.at(-1).body, { trackingNumbers: ['ZR-0001'] });
});

test('"send all confirmed" sends every confirmed ZR order and skips the others', async () => {
    await confirmedOrder();
    await confirmedOrder({ customer: customer({ phone: '0770000004' }) });
    await placeOrder({ variant: { color: 'Rose', size: '40' }, customer: customer({ phone: '0770000005' }) }).expect(201);
    const res = await request(app).post('/api/orders/delivery/bulk').set(authHeader()).expect(200);
    assert.equal(res.body.sent.length, 2);
    assert.equal(res.body.failed.length, 0);
    assert.equal(await Order.countDocuments({ status: 'Shipped' }), 2);
});

test('ZR webhooks: delivered, duplicates, forged signatures and old news', async () => {
    const order = await confirmedOrder();
    await send(order._id).expect(200);

    const delivered = { eventType: 'parcel.state.updated', occurredAt: new Date().toISOString(), data: { id: PARCEL, externalId: order._id, trackingNumber: 'ZR-0001', state: { id: 's-del', name: 'Delivered' } } };
    await webhook(delivered, { id: 'msg_delivered' }).expect(200);
    let saved = await Order.findById(order._id).lean();
    assert.equal(saved.status, 'Delivered');
    assert.equal(saved.delivery.state.name, 'Delivered');

    // Same message id again (a retry) is ignored
    const retry = await webhook({ ...delivered, data: { ...delivered.data, state: { name: 'Returned' } } }, { id: 'msg_delivered' }).expect(200);
    assert.equal(retry.body.duplicate, true);
    assert.equal((await Order.findById(order._id).lean()).status, 'Delivered');

    // Wrong secret
    await webhook(delivered, { signWith: `whsec_${Buffer.from('someone-else-secret-32-bytes-xx').toString('base64')}` }).expect(401);

    // Older news than what we have is ignored
    const older = { ...delivered, occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), data: { ...delivered.data, state: { name: 'OutForDelivery' } } };
    await webhook(older).expect(200);
    saved = await Order.findById(order._id).lean();
    assert.equal(saved.delivery.state.name, 'Delivered');

    // Unknown order: accepted, nothing changes
    await webhook({ ...delivered, data: { id: 'unknown', externalId: '000000000000000000000000' } }).expect(200);
});

test('a returned parcel marks the order Returned and puts the item back in stock', async () => {
    const order = await confirmedOrder();
    await send(order._id).expect(200);
    assert.equal(await stockOf('38'), 1);

    await webhook({ eventType: 'parcel.isReturn.updated', occurredAt: new Date().toISOString(), data: { id: PARCEL, externalId: order._id, isReturn: true } }).expect(200);
    assert.equal((await Order.findById(order._id).lean()).status, 'Returned');
    assert.equal(await stockOf('38'), 2);
});

test('"Refresh" reads the parcel from ZR when a webhook was missed', async () => {
    const order = await confirmedOrder();
    await send(order._id).expect(200);
    overrides.set(`GET /parcels/${PARCEL}`, () => reply(200, { id: PARCEL, trackingNumber: 'ZR-0001', state: { name: 'Livré' }, lastStateUpdateAt: new Date().toISOString() }));
    const res = await request(app).post(`/api/orders/${order._id}/delivery/refresh`).set(authHeader()).expect(200);
    assert.equal(res.body.status, 'Delivered');
});

test('the dashboard can read the ZR connection status', async () => {
    await request(app).get('/api/admin/zr-status').expect(401);
    const res = await request(app).get('/api/admin/zr-status').set(authHeader()).expect(200);
    assert.equal(res.body.configured, true);
    assert.equal(res.body.ready, true);
    assert.equal(res.body.offices, 2);
    assert.equal(res.body.readyStateFound, true);
});

test('when ZR is down, the saved copy keeps prices available', async () => {
    assert.equal(await zrData.refresh(), true); // saves a copy in MongoDB
    zrData._reset();
    await request(app).get('/api/delivery/wilayas').expect(503);

    overrides.set('POST /territories/search', () => reply(503, {}));
    await zrData.start(); // loads the saved copy, refresh fails
    const res = await request(app).get('/api/delivery/wilayas').expect(200);
    assert.equal(res.body.wilayas.length, 2);
});

test('with no ZR data at all, orders fall back to the fixed prices', async () => {
    zrData._reset();
    const res = await placeOrder({ customer: customer({ wilaya: WILAYAS.find((w) => w.code === '16').name }) }).expect(201);
    assert.equal(res.body.pricing.shippingPrice, 400);
    assert.equal(res.body.customer.zr?.communeId, undefined);
    assert.equal(await zrData.refresh(), true);
});
