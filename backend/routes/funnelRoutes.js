// Order-form steps sent by the shop's browser (navigator.sendBeacon), written to the Render logs.
// No personal data: only the step, why the form stopped, the product and the delivery price.
const express = require('express');
const { z } = require('zod');
const { rateLimit } = require('express-rate-limit');
const { HttpError } = require('../lib/httpError');

const stepSchema = z.object({
    step: z.enum(['wilaya', 'submit', 'error']),
    reason: z.enum(['size', 'name', 'phone', 'place', 'unavailable', 'address', 'office', 'sold_out', 'rate_limit', 'server']).optional(),
    productId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
    wilaya: z.coerce.number().int().min(1).max(69).optional(),
    shipping: z.number().int().min(0).max(10000).optional(),
});

// Beacons ignore the answer: past the limit they are dropped quietly (mobile networks share IPs)
const funnelLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 300,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (req, res) => res.status(204).end(),
});

const router = express.Router();

// A beacon arrives as text/plain (no CORS preflight); express.json already parsed any JSON body
router.post('/', funnelLimiter, express.text({ type: '*/*', limit: '2kb' }), (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            throw new HttpError(400, 'Invalid JSON');
        }
    }
    const step = stepSchema.parse(body ?? {});
    req.log.info({ event: 'funnel', ...step }, 'Checkout step');
    res.status(204).end();
});

module.exports = router;
