// Vercel Function: CDN-cached proxy for ZR Express delivery lists (same idea as api/products.js).
//   GET /api/delivery                 -> wilayas with home / office prices
//   GET /api/delivery?wilaya=<zr-id>  -> communes (real prices) and ZR offices of one wilaya
const BACKEND_URL = (
    process.env.BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    'https://algel-kids-xkjm.onrender.com'
).replace(/\/+$/, '');

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Prices change rarely: fresh for an hour, then served from cache while Vercel refreshes it
const CACHE_OK = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

export default async function handler(req, res) {
    const { wilaya } = req.query;

    if (wilaya !== undefined && !GUID.test(wilaya)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(400).json({ message: 'Invalid wilaya id' });
    }

    const url = wilaya
        ? `${BACKEND_URL}/api/delivery/wilayas/${wilaya}`
        : `${BACKEND_URL}/api/delivery/wilayas`;

    try {
        const upstream = await fetch(url, { signal: AbortSignal.timeout(55000) });

        if (!upstream.ok) {
            // 503 = ZR not connected yet: the order form falls back to its built-in list
            const shortCache = upstream.status === 404 || upstream.status === 503;
            res.setHeader('Cache-Control', shortCache ? 'public, s-maxage=60' : 'no-store');
            return res.status(shortCache ? upstream.status : 502).json({ message: 'Delivery prices unavailable' });
        }

        const body = await upstream.text();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', CACHE_OK);
        return res.status(200).send(body);
    } catch {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(504).json({ message: 'Backend unavailable' });
    }
}
