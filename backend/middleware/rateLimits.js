const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');

const onLimit = (message) => (req, res, next, options) => {
    req.log.warn({ event: 'rate_limit.hit', path: req.originalUrl.split('?')[0], ip: req.ip }, 'Rate limit hit');
    next(new HttpError(options.statusCode, message));
};

// Only failed logins count, so a correct password never locks you out by itself
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.loginRateLimit,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: onLimit('Too many login attempts. Try again in 15 minutes.'),
});

// "0661 23 45 67", "+213661234567" -> "661234567"
const phoneKey = (req) => String(req.body?.customer?.phone || '').replace(/\D/g, '').slice(-9);

// Orders are limited per phone number: Algerian mobile networks put many
// customers behind one shared IP, so a tight per-IP limit would refuse real orders
const orderPhoneLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: env.orderRateLimit,
    keyGenerator: (req) => {
        const phone = phoneKey(req);
        return phone.length === 9 ? `phone:${phone}` : `ip:${ipKeyGenerator(req.ip)}`;
    },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: onLimit('Too many orders for this phone number. Please call us to order.'),
});

// Generous backstop against one connection sending orders with many different phones
const orderIpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: env.orderIpRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: onLimit('Too many orders from this connection. Please call us to order.'),
});

module.exports = { loginLimiter, orderPhoneLimiter, orderIpLimiter };
