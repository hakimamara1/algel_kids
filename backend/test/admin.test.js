require('./setup');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');

const login = (password) => request(app).post('/api/admin/login').send({ password });

test('a wrong password is refused; the right one returns a working token', async () => {
    await login('nope').expect(401);
    const res = await login('test-password').expect(200);
    assert.equal(res.body.expiresInDays, 30);
    await request(app).get('/api/admin/me').set('Authorization', `Bearer ${res.body.token}`).expect(200);
    await request(app).get('/api/admin/me').set('Authorization', 'Bearer forged.token.value').expect(401);
    await request(app).get('/api/admin/me').expect(401);
});

test('login is blocked after 5 failed attempts, even with the right password', async () => {
    let attempts = 0;
    let status;
    do {
        attempts += 1;
        ({ status } = await login('still-wrong'));
    } while (status === 401 && attempts < 10);

    assert.equal(status, 429);
    assert.ok(attempts <= 6, `blocked after ${attempts} attempts`);
    await login('test-password').expect(429);
});
