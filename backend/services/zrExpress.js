// Thin client for the ZR Express API (https://docs.zrexpress.app).
// Every call carries X-Api-Key + X-Tenant; nothing about customers is logged.
const { env } = require('../config/env');
const logger = require('../lib/logger');

// An error from (or about) ZR, with the status our API should answer
class ZrError extends Error {
    constructor(status, message, details) {
        super(message);
        this.name = 'ZrError';
        this.status = status;
        this.details = details;
    }
}

const isConfigured = () => Boolean(env.zr.apiKey && env.zr.tenantId);

// ZR answers errors as RFC 7807 "problem details"
const problemMessage = (body, status) => {
    if (Array.isArray(body?.errors) && body.errors.length) {
        return body.errors.map((error) => error.description || error.code).join(' · ');
    }
    return body?.detail || body?.title || `ZR Express answered ${status}`;
};

// ZR's own 401/403 must not reach the admin as a 401 (that would log the admin out)
const ourStatus = (zrStatus) => {
    if ([400, 404, 409, 422].includes(zrStatus)) return zrStatus;
    return 502;
};

const request = async (method, path, { body, tenant = true, retry = false } = {}) => {
    if (!env.zr.apiKey || (tenant && !env.zr.tenantId)) {
        throw new ZrError(503, 'ZR Express is not configured (ZR_API_KEY / ZR_TENANT_ID)');
    }

    const started = Date.now();
    const log = { event: 'zr.request', method, path };
    let res;
    try {
        res = await fetch(`${env.zr.apiUrl}${path}`, {
            method,
            headers: {
                accept: 'application/json',
                'X-Api-Key': env.zr.apiKey,
                ...(tenant && { 'X-Tenant': env.zr.tenantId }),
                ...(body !== undefined && { 'Content-Type': 'application/json' }),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(15000),
        });
    } catch (err) {
        logger.warn({ ...log, ms: Date.now() - started, error: err.name }, 'ZR Express unreachable');
        if (retry) return request(method, path, { body, tenant, retry: false });
        throw new ZrError(502, 'ZR Express is unreachable, please try again in a moment');
    }

    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    Object.assign(log, { status: res.status, ms: Date.now() - started });
    if (res.ok) {
        logger.info(log, 'ZR Express call');
        return data;
    }
    if (res.status >= 500 && retry) {
        logger.warn(log, 'ZR Express error, retrying once');
        return request(method, path, { body, tenant, retry: false });
    }

    const message = res.status === 401 || res.status === 403
        ? 'ZR Express refused the API key (expired or wrong). Create a new key in the ZR portal.'
        : problemMessage(data, res.status);
    logger.warn({ ...log, detail: message }, 'ZR Express refused the request');
    throw new ZrError(ourStatus(res.status), message, data?.errors);
};

// Search endpoints are paged (max 1000 per page)
const searchAll = async (path) => {
    const items = [];
    for (let page = 1; page <= 50; page += 1) {
        const data = await request('POST', path, { body: { pageNumber: page, pageSize: 1000 }, retry: true });
        items.push(...(data?.items || []));
        if (!data?.hasNext) break;
    }
    return items;
};

const id = (value) => encodeURIComponent(value);

module.exports = {
    ZrError,
    isConfigured,
    getProfile: () => request('GET', '/users/profile', { tenant: false, retry: true }),
    searchTerritories: () => searchAll('/territories/search'),
    getRates: () => request('GET', '/delivery-pricing/rates', { retry: true }),
    searchHubs: () => searchAll('/hubs/search'),
    searchWorkflows: () => searchAll('/workflows/search'),
    createParcel: (payload) => request('POST', '/parcels', { body: payload }),
    getParcel: (parcelIdOrTracking) => request('GET', `/parcels/${id(parcelIdOrTracking)}`, { retry: true }),
    deleteParcel: (parcelId) => request('DELETE', `/parcels/${id(parcelId)}`),
    generateLabels: (trackingNumbers) => request('POST', '/parcels/labels/multiple', { body: { trackingNumbers } }),
    listWebhookEndpoints: () => request('GET', '/webhooks/endpoints', { retry: true }),
    createWebhookEndpoint: (payload) => request('POST', '/webhooks/endpoints', { body: payload }),
    getWebhookSecret: (endpointId) => request('GET', `/webhooks/endpoints/${id(endpointId)}/secret`, { retry: true }),
};
