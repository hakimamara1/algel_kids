// Vercel Function: CDN-cached proxy for product reads.
// Ad visitors get product JSON from Vercel's edge cache instead of waiting on Render,
// which may be asleep. Orders and admin writes still go straight to the backend.
//   GET /api/products          -> product list
//   GET /api/products?id=<id>  -> one product
const BACKEND_URL = (
    process.env.BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    'https://algel-kids-xkjm.onrender.com'
).replace(/\/+$/, '');

const PRODUCT_ID = /^[a-f0-9]{24}$/i;

// Fresh for 60 s, then served instantly from cache for up to a day while Vercel refreshes it.
const CACHE_OK = 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400';

export default async function handler(req, res) {
    const { id } = req.query;

    if (id !== undefined && !PRODUCT_ID.test(id)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(400).json({ message: 'Invalid product id' });
    }

    const url = id ? `${BACKEND_URL}/api/products/${id}` : `${BACKEND_URL}/api/products`;

    try {
        // Render's free plan can take ~50 s to wake up
        const upstream = await fetch(url, { signal: AbortSignal.timeout(55000) });

        if (!upstream.ok) {
            const notFound = upstream.status === 404;
            res.setHeader('Cache-Control', notFound ? 'public, s-maxage=60' : 'no-store');
            return res.status(notFound ? 404 : 502).json({ message: 'Product unavailable' });
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
