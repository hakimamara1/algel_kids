const express = require('express');
const zrData = require('../services/zrData');
const { HttpError } = require('../lib/httpError');

const router = express.Router();

// Same answer for every visitor: let Vercel's CDN keep it for an hour
const CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

// @route   GET /api/delivery/wilayas   (public)
router.get('/wilayas', (req, res) => {
    const wilayas = zrData.listWilayas();
    res.set('Cache-Control', CACHE);
    res.json({ updatedAt: zrData.fetchedAt(), wilayas });
});

// @route   GET /api/delivery/wilayas/:id   (public)
router.get('/wilayas/:id', (req, res) => {
    const details = zrData.wilayaDetails(req.params.id);
    if (!details) throw new HttpError(404, 'Unknown wilaya');
    res.set('Cache-Control', CACHE);
    res.json(details);
});

module.exports = router;
