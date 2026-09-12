const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');
const { loginLimiter } = require('../middleware/rateLimits');
const requireAdmin = require('../middleware/requireAdmin');
const zrData = require('../services/zrData');

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

module.exports = router;
