// Tight limits for this file only: 2 orders per phone, 4 per connection
process.env.ORDER_RATE_LIMIT = '2';
process.env.ORDER_IP_RATE_LIMIT = '4';

const { startDb, stopDb } = require('./setup');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const Product = require('../models/productModel');

let product;

before(async () => {
    await startDb();
    product = await Product.create({
        title: 'Jolie Blouse',
        slug: 'jolie-blouse',
        price: 3500,
        colors: [{ name: 'Rose', sizes: ['38', '40', '42', '44'].map((value) => ({ value, stock: 10 })) }],
    });
});
after(stopDb);

const order = (phone, size) => request(app).post('/api/orders').send({
    product: product._id.toString(),
    variant: { color: 'Rose', size },
    customer: { name: 'Client', phone, wilaya: '16', commune: 'Kouba', address: 'Rue 1' },
});

test('orders are limited per phone, so customers sharing one mobile IP are not blocked by each other', async () => {
    await order('0661111111', '38').expect(201);
    await order('+213 661 111 111', '40').expect(201);
    const blocked = await order('0661111111', '42').expect(429);
    assert.match(blocked.body.message, /phone number/);

    // Same connection (supertest always uses 127.0.0.1), different customer
    await order('0770222222', '38').expect(201);
});

test('one connection sending many different phones hits the per-connection backstop', async () => {
    const { status } = await order('0550333333', '38');
    assert.equal(status, 429);
});
