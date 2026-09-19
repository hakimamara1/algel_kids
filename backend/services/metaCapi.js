// Meta Conversions API: builds and sends server events.
// Rules: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
const crypto = require('crypto');
const { env } = require('../config/env');
const { orderItems } = require('../lib/orderItems');

const isConfigured = () => Boolean(env.meta.pixelId && env.meta.token);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hashed = (value) => (value ? [sha256(value)] : undefined);

// Meta's normalisation: lowercase, no punctuation or spaces (letters of any script are kept)
const lettersOnly = (text) => String(text || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// 0661234567 -> 213661234567 (digits only, with the country code, no leading zero)
const normalizePhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.startsWith('213') ? digits : `213${digits.replace(/^0+/, '')}`;
};

// Personal details are hashed; IP, browser and the Meta cookies must be sent as they are
const buildUserData = ({ customer = {}, tracking = {} }) => {
    const phone = normalizePhone(customer.phone);
    const [firstName, ...otherNames] = String(customer.name || '').trim().split(/\s+/);
    const userData = {
        ph: hashed(phone),
        fn: hashed(lettersOnly(firstName)),
        ln: hashed(lettersOnly(otherNames.join(''))),
        ct: hashed(lettersOnly(customer.zr?.communeName || customer.commune)),
        zp: hashed(lettersOnly(customer.zr?.postalCode)),
        country: hashed('dz'),
        external_id: hashed(phone),
        client_ip_address: tracking.ip,
        client_user_agent: tracking.userAgent,
        fbp: tracking.fbp,
        fbc: tracking.fbc,
    };
    return Object.fromEntries(Object.entries(userData).filter(([, value]) => value !== undefined && value !== ''));
};

// One event about one order. Value = product or pack price (the shop's revenue; delivery goes to the courier).
const buildEvent = ({ name, eventId, eventTime, order }) => {
    const productId = String(order.product?._id || order.product);
    const quantity = Math.max(orderItems(order).length, 1);
    return {
        event_name: name,
        event_time: Math.floor(eventTime.getTime() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: order.tracking?.sourceUrl || `${env.meta.siteUrl}/product/${productId}`,
        user_data: buildUserData(order),
        custom_data: {
            currency: 'DZD',
            value: order.pricing.itemPrice,
            content_ids: [productId],
            content_type: 'product',
            ...(order.product?.title && { content_name: order.product.title }),
            contents: [{ id: productId, quantity }],
            num_items: quantity,
            order_id: String(order._id),
            // Which page sold it (landing slug, or "p-<productId>" for the product page)
            ...(order.source?.landing && { landing_page: order.source.landing }),
        },
    };
};

const sendEvents = async (events) => {
    const started = Date.now();
    const res = await fetch(`https://graph.facebook.com/${env.meta.apiVersion}/${env.meta.pixelId}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Token in a header, never in the URL (URLs end up in logs)
            Authorization: `Bearer ${env.meta.token}`,
        },
        body: JSON.stringify({ data: events, ...(env.meta.testEventCode && { test_event_code: env.meta.testEventCode }) }),
        signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(body?.error?.message || `Meta answered ${res.status}`);
        err.status = res.status;
        err.fbtraceId = body?.error?.fbtrace_id;
        throw err;
    }
    return { eventsReceived: body.events_received, fbtraceId: body.fbtrace_id, ms: Date.now() - started };
};

module.exports = { isConfigured, normalizePhone, buildUserData, buildEvent, sendEvents };
