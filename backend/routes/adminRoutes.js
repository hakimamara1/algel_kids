const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');
const { loginLimiter } = require('../middleware/rateLimits');
const requireAdmin = require('../middleware/requireAdmin');
const zrData = require('../services/zrData');
const metaEvents = require('../services/metaEvents');
const { landingStats } = require('../services/landingStats');
const { DAY_PATTERN } = require('../lib/days');

const router = express.Router();

const loginSchema = z.object({ password: z.string().min(1).max(200) });

// Hashing both sides gives equal-length buffers, so the comparison takes the same time
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

// @route   POST /api/admin/login
router.post('/login', loginLimiter, (req, res) => {
    if (!env.adminPassword || !env.adminTokenSecret) throw new HttpError(503, 'Admin login is not configured');

    const { password } = loginSchema.parse(req.body);
    const ok = crypto.timingSafeEqual(sha256(password), sha256(env.adminPassword));
    req.log.info({ event: 'admin.login', ok, ip: req.ip }, ok ? 'Admin logged in' : 'Admin login failed');
    if (!ok) throw new HttpError(401, 'Wrong password');

    // Changing ADMIN_TOKEN_SECRET on Render logs out every device
    const token = jwt.sign({ role: 'admin' }, env.adminTokenSecret, { expiresIn: '30d', algorithm: 'HS256' });
    res.json({ token, expiresInDays: 30 });
});

// @route   GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
    res.json({ role: req.admin.role });
});

// @route   GET /api/admin/zr-status — connection, last refresh, key expiry
router.get('/zr-status', requireAdmin, (req, res) => {
    res.json(zrData.status());
});

// @route   GET /api/admin/meta-status — Conversions API connected, test mode, events waiting for a retry
router.get('/meta-status', requireAdmin, async (req, res) => {
    res.json(await metaEvents.status());
});

const statsSchema = z.object({
    from: z.string().regex(DAY_PATTERN, 'Use YYYY-MM-DD').optional(),
    to: z.string().regex(DAY_PATTERN, 'Use YYYY-MM-DD').optional(),
});

// @route   GET /api/admin/landing-stats?from=YYYY-MM-DD&to=YYYY-MM-DD — results per landing page (default: last 7 days)
router.get('/landing-stats', requireAdmin, async (req, res) => {
    res.json(await landingStats(statsSchema.parse(req.query)));
});

module.exports = router;
