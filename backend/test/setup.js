// Test environment: in-memory MongoDB, silent logs, fake secrets.
// Must be required before the app so these values win over backend/.env.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MONGO_URI = 'mongodb://tests-never-use-the-real-database';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.ADMIN_TOKEN_SECRET = 'test-token-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.ORDER_RATE_LIMIT ||= '1000';
process.env.ORDER_IP_RATE_LIMIT ||= '1000';

// Never use the real ZR Express or Meta keys from backend/.env: an empty value stops dotenv
// from loading them. A test file that needs keys sets fake ones before requiring this file.
[
    'ZR_API_URL', 'ZR_API_KEY', 'ZR_TENANT_ID', 'ZR_KEY_EXPIRES', 'ZR_WEBHOOK_SECRET',
    'ZR_READY_STATE_ID', 'ZR_PARCEL_WEIGHT', 'ZR_SYNC_HOURS',
    'META_PIXEL_ID', 'META_CAPI_TOKEN', 'META_API_VERSION', 'META_TEST_EVENT_CODE', 'SITE_URL',
].forEach((key) => {
    process.env[key] ??= '';
});

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const startDb = async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
};

const stopDb = async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
};

const clearDb = async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
};

const authHeader = () => ({
    Authorization: `Bearer ${jwt.sign({ role: 'admin' }, process.env.ADMIN_TOKEN_SECRET, { expiresIn: '1h' })}`,
});

module.exports = { startDb, stopDb, clearDb, authHeader };
