require('./setup');
const { test } = require('node:test');
const request = require('supertest');
const app = require('../app');

const step = { step: 'error', reason: 'phone', productId: '6aa4b47be4092228b138061f' };

test('order-form steps are accepted as a text beacon (what navigator.sendBeacon sends) or as JSON', async () => {
    await request(app).post('/api/funnel').set('Content-Type', 'text/plain;charset=UTF-8').send(JSON.stringify(step)).expect(204);
    await request(app).post('/api/funnel').send({ step: 'wilaya', wilaya: '16', shipping: 600 }).expect(204);
    await request(app).post('/api/funnel').send({ step: 'submit' }).expect(204);
});

test('unknown steps, reasons and broken bodies are refused', async () => {
    await request(app).post('/api/funnel').send({ step: 'hacked' }).expect(400);
    await request(app).post('/api/funnel').send({ step: 'error', reason: 'free text' }).expect(400);
    await request(app).post('/api/funnel').set('Content-Type', 'text/plain').send('{not json').expect(400);
});
