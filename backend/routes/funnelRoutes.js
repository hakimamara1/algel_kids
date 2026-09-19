// Page and order-form steps sent by the shop's browser (navigator.sendBeacon).
// Visits and form steps are counted per page per day (dashboard "Landing pages");
// form steps are also written to the Render logs.
// No personal data: only the step, why the form stopped, the page, the product and the delivery price.
const express = require('express');
const { z } = require('zod');
const { rateLimit } = require('express-rate-limit');
const LandingStat = require('../models/landingStatModel');
const { HttpError } = require('../lib/httpError');
const { algeriaDay } = require('../lib/days');

const stepSchema = z.object({
    step: z.enum(['view', 'checkout', 'wilaya', 'submit', 'error']),
    reason: z.enum(['size', 'name', 'phone', 'place', 'unavailable', 'address', 'office', 'sold_out', 'rate_limit', 'server']).optional(),
    productId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
    // Landing page slug, or "p-<productId>" for a product page
    landing: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
    wilaya: z.coerce.number().int().min(1).max(69).optional(),
    shipping: z.number().int().min(0).max(10000).optional(),
    pieces: z.number().int().min(1).max(5).optional(),
});

// Which daily counter each step adds to
const COUNTERS = { view: 'views', checkout: 'checkouts', wilaya: 'wilaya', submit: 'submit' };

// Beacons ignore the answer: past the limit they are dropped quietly (mobile networks share IPs)
const funnelLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 300,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (req, res) => res.status(204).end(),
});

const countStep = async (landing, field) => {
    const add = () => LandingStat.updateOne({ landing, day: algeriaDay() }, { $inc: { [field]: 1 } }, { upsert: true });
    try {
        await add();
    } catch (err) {
        // Two first visits of the day at the same moment: the second one loses the race, so it tries again
        if (err.code !== 11000) throw err;
        await add();
    }
};

const router = express.Router();

// A beacon arrives as text/plain (no CORS preflight); express.json already parsed any JSON body
router.post('/', funnelLimiter, express.text({ type: '*/*', limit: '2kb' }), async (req, res) => {
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            throw new HttpError(400, 'Invalid JSON');
        }
    }
    const step = stepSchema.parse(body ?? {});

    if (step.landing && COUNTERS[step.step]) await countStep(step.landing, COUNTERS[step.step]);
    // Page views are only counted: one log line per visitor would drown the order-form steps
    if (step.step !== 'view') req.log.info({ event: 'funnel', ...step }, 'Checkout step');
    res.status(204).end();
});

module.exports = router;
