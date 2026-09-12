const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const pinoHttp = require('pino-http');
const { env } = require('./config/env');
const logger = require('./lib/logger');
const { redactUrl } = require('./lib/privacy');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Preview deployments of this Vercel project (other teams' previews don't match)
const VERCEL_PREVIEW = /^https:\/\/algel-kids-[a-z0-9-]+-hakimamara20242023-6761s-projects\.vercel\.app$/;
const SLOW_REQUEST_MS = 1000;
const QUIET_PATHS = new Set(['/', '/health']);

const app = express();

// Render sits in front of the app: trust its X-Forwarded-For for req.ip and rate limits
app.set('trust proxy', 1);

app.use((req, res, next) => {
    req.startedAt = Date.now();
    next();
});

// One log line per request. Bodies are never logged (they hold customer data).
app.use(pinoHttp({
    logger,
    genReqId: (req, res) => {
        const id = req.headers['rndr-id'] || req.headers['x-request-id'] || crypto.randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
    },
    autoLogging: { ignore: (req) => QUIET_PATHS.has(req.url) },
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400 || Date.now() - req.startedAt > SLOW_REQUEST_MS) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${redactUrl(req.originalUrl)} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${redactUrl(req.originalUrl)} ${res.statusCode}`,
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: redactUrl(req.url) }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || env.allowedOrigins.includes(origin) || VERCEL_PREVIEW.test(origin)),
}));

// Webhooks read their raw body to check the signature, so they come before the JSON parser
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Render health check: the app answers and MongoDB answers
app.get('/health', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.json({ ok: true });
    } catch {
        res.status(503).json({ ok: false });
    }
});

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
