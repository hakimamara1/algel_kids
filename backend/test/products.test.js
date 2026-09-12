const { startDb, stopDb, clearDb, authHeader } = require('./setup');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const Product = require('../models/productModel');

before(startDb);
after(stopDb);
beforeEach(clearDb);

const blouse = {
    title: 'Jolie Blouse ✨',
    price: 3500,
    description: 'Pleated',
    colors: [{ name: 'Rose', hexCode: '#F074B4', images: [], sizes: [{ value: '38', stock: 10 }] }],
};

test('writing products requires the admin token', async () => {
    await request(app).post('/api/products').send(blouse).expect(401);
    const product = await Product.create({ ...blouse, slug: 'jolie-blouse' });
    await request(app).put(`/api/products/${product._id}`).send({ price: 1 }).expect(401);
    await request(app).delete(`/api/products/${product._id}`).expect(401);
    await request(app).put(`/api/products/${product._id}`).set('Authorization', 'Bearer forged').send({ price: 1 }).expect(401);
    assert.equal((await Product.findById(product._id)).price, 3500);
});

test('creating a product builds a clean, unique slug', async () => {
    const first = await request(app).post('/api/products').set(authHeader()).send(blouse).expect(201);
    assert.equal(first.body.slug, 'jolie-blouse');
    const second = await request(app).post('/api/products').set(authHeader()).send(blouse).expect(201);
    assert.equal(second.body.slug, 'jolie-blouse-2');
    const diva = await request(app).post('/api/products').set(authHeader()).send({ ...blouse, title: 'l’ensemble Diva 🍂' }).expect(201);
    assert.equal(diva.body.slug, 'lensemble-diva');
});

test('creating a product needs a title and a valid price', async () => {
    await request(app).post('/api/products').set(authHeader()).send({ price: 10 }).expect(400);
    const res = await request(app).post('/api/products').set(authHeader()).send({ title: 'X', price: 'abc' }).expect(400);
    assert.equal(res.body.message, 'Invalid data');
    assert.ok(res.body.requestId);
});

test('price 0, stock 0 and an empty description can be saved', async () => {
    const product = await Product.create({ ...blouse, slug: 'jolie-blouse' });
    const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set(authHeader())
        .send({ price: 0, description: '', colors: [{ ...blouse.colors[0], sizes: [{ value: '38', stock: 0 }] }] })
        .expect(200);
    assert.equal(res.body.price, 0);
    assert.equal(res.body.description, '');
    assert.equal(res.body.colors[0].sizes[0].stock, 0);
    assert.equal(res.body.slug, 'jolie-blouse');
});

test('numbers typed as text in the admin are saved as numbers', async () => {
    const product = await Product.create({ ...blouse, slug: 'jolie-blouse' });
    const res = await request(app).put(`/api/products/${product._id}`).set(authHeader()).send({ price: '3900' }).expect(200);
    assert.equal(res.body.price, 3900);
});

test('reading products: the list hides descriptions, bad ids get 400, unknown ids 404', async () => {
    const product = await Product.create({ ...blouse, slug: 'jolie-blouse' });
    const list = await request(app).get('/api/products').expect(200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].description, undefined);
    const one = await request(app).get(`/api/products/${product._id}`).expect(200);
    assert.equal(one.body.description, 'Pleated');
    await request(app).get('/api/products/not-an-id').expect(400);
    await request(app).get('/api/products/000000000000000000000000').expect(404);
});

test('deleting a product', async () => {
    const product = await Product.create({ ...blouse, slug: 'jolie-blouse' });
    await request(app).delete(`/api/products/${product._id}`).set(authHeader()).expect(200);
    await request(app).delete(`/api/products/${product._id}`).set(authHeader()).expect(404);
});

test('unknown routes answer with JSON 404 and a request id', async () => {
    const res = await request(app).get('/api/nothing-here').expect(404);
    assert.equal(res.body.message, 'Route not found');
    assert.equal(res.headers['x-request-id'], res.body.requestId);
});
