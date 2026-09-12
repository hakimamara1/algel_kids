const { authHeader } = require('./setup');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const request = require('supertest');
const cloudinary = require('cloudinary').v2;
const app = require('../app');

// Fake Cloudinary: records the options and answers like the real upload_stream
const calls = [];
cloudinary.uploader.upload_stream = (options, callback) => {
    calls.push(options);
    const n = calls.length;
    return new Writable({
        write(chunk, encoding, done) { done(); },
        final(done) {
            callback(null, { secure_url: `https://res.cloudinary.com/test/${n}.jpg`, public_id: `malaksit-products/${n}`, bytes: 4, format: 'jpg' });
            done();
        },
    });
};

beforeEach(() => {
    calls.length = 0;
});

const photo = Buffer.from('fake-photo');

test('uploading needs the admin token', async () => {
    await request(app).post('/api/upload').attach('image', photo, { filename: 'a.jpg', contentType: 'image/jpeg' }).expect(401);
    assert.equal(calls.length, 0);
});

test('non-photos are refused with a clear JSON message', async () => {
    const res = await request(app)
        .post('/api/upload')
        .set(authHeader())
        .attach('image', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' })
        .expect(400);
    assert.match(res.body.message, /Only JPG, PNG, WEBP or HEIC/);
    assert.equal(calls.length, 0);
});

test('an iPhone HEIC photo is accepted and stored as JPG (single-photo response kept for the current admin)', async () => {
    const res = await request(app)
        .post('/api/upload')
        .set(authHeader())
        .attach('image', photo, { filename: 'IMG_2623.HEIC', contentType: 'application/octet-stream' })
        .expect(200);
    assert.deepEqual(res.body, { url: 'https://res.cloudinary.com/test/1.jpg', publicId: 'malaksit-products/1' });
    assert.equal(calls[0].folder, 'malaksit-products');
    assert.equal(calls[0].format, 'jpg');
});

test('several photos can be uploaded at once', async () => {
    const res = await request(app)
        .post('/api/upload')
        .set(authHeader())
        .attach('images', photo, { filename: 'a.jpg', contentType: 'image/jpeg' })
        .attach('images', photo, { filename: 'b.png', contentType: 'image/png' })
        .expect(200);
    assert.equal(res.body.images.length, 2);
    assert.equal(calls[0].format, undefined);
});

test('a request without a photo is refused', async () => {
    await request(app).post('/api/upload').set(authHeader()).expect(400);
});
