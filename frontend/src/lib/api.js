const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// In production, product reads go through /api/products (a Vercel Function cached on the CDN,
// see api/products.js). If that fails, fall back to calling the backend directly.
const USE_EDGE = import.meta.env.PROD;

const getJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Request failed (${res.status}): ${url}`);
    return res.json();
};

const withFallback = (edgeUrl, directUrl) =>
    USE_EDGE ? getJson(edgeUrl).catch(() => getJson(directUrl)) : getJson(directUrl);

const fetchProduct = (id) =>
    withFallback(`/api/products?id=${encodeURIComponent(id)}`, `${BACKEND_URL}/api/products/${id}`);

export const getProduct = (id) => {
    // index.html starts this request before React loads; reuse it once.
    const early = window.__earlyProduct;
    if (early && early.id === id) {
        window.__earlyProduct = null;
        return early.promise.then((data) => data || fetchProduct(id));
    }
    return fetchProduct(id);
};

export const getProducts = () => withFallback('/api/products', `${BACKEND_URL}/api/products`);

export const createOrder = (order) =>
    getJson(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
