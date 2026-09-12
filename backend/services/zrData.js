// ZR's wilayas, communes, prices and offices, refreshed every few hours and saved in MongoDB.
// The order form and the server's price check read this copy, never ZR directly.
const zr = require('./zrExpress');
const ZrSnapshot = require('../models/zrSnapshotModel');
const logger = require('../lib/logger');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');
const { normalizeWord } = require('../lib/text');
const { WILAYAS } = require('../data/algeria');

const SNAPSHOT_ID = 'latest';
const READY_STATE_NAMES = ['readytodispatch', 'pretaexpedier', 'pretpourexpedition'];
const arabicNameByCode = new Map(WILAYAS.map((wilaya) => [Number(wilaya.code), wilaya.name]));

let current = null;
let timer = null;

const pricesOf = (rate) => {
    const prices = {};
    for (const entry of rate?.deliveryPrices || []) {
        if (entry.deliveryType === 'home') prices.home = entry.price;
        if (entry.deliveryType === 'pickup-point') prices.pickup = entry.price;
    }
    return prices;
};

const findReadyState = (workflows = []) => {
    const workflow = workflows.find((entry) => entry.isDefault) || workflows[0];
    const state = (workflow?.states || []).find((entry) => READY_STATE_NAMES.includes(normalizeWord(entry.name)));
    return state?.id || null;
};

const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'fr');

// Turns ZR's raw lists into lookups: a commune price overrides its wilaya's price
const build = ({ territories = [], rates, hubs = [], workflows = [], fetchedAt }) => {
    const rateByTerritory = new Map((rates?.rates || []).map((rate) => [rate.toTerritoryId, pricesOf(rate)]));

    const wilayas = new Map();
    for (const territory of territories) {
        if (territory.level !== 'wilaya') continue;
        wilayas.set(territory.id, {
            id: territory.id,
            code: territory.code,
            name: arabicNameByCode.get(territory.code) || territory.name,
            nameFr: territory.name,
            hasHome: territory.delivery?.hasHomeDelivery !== false,
            prices: rateByTerritory.get(territory.id) || {},
            communes: [],
            hubs: [],
        });
    }

    const communes = new Map();
    for (const territory of territories) {
        const wilaya = territory.level === 'commune' && wilayas.get(territory.parentId);
        if (!wilaya) continue;
        const own = rateByTerritory.get(territory.id) || {};
        const commune = {
            id: territory.id,
            name: territory.name,
            postalCode: territory.postalCode,
            wilayaId: wilaya.id,
            hasHome: (territory.delivery?.hasHomeDelivery ?? wilaya.hasHome) !== false,
            prices: { home: own.home ?? wilaya.prices.home, pickup: own.pickup ?? wilaya.prices.pickup },
        };
        communes.set(commune.id, commune);
        wilaya.communes.push(commune);
    }

    const hubsById = new Map();
    for (const hub of hubs) {
        const wilaya = wilayas.get(hub.address?.cityTerritoryId);
        if (!wilaya || !(hub.isPickupPoint || hub.type === 'stopdesk')) continue;
        const office = {
            id: hub.id,
            name: hub.name,
            wilayaId: wilaya.id,
            communeId: hub.address?.districtTerritoryId,
            commune: hub.address?.district,
            street: hub.address?.street,
            openingHours: hub.openingHours,
        };
        hubsById.set(office.id, office);
        wilaya.hubs.push(office);
    }

    for (const wilaya of wilayas.values()) {
        wilaya.communes.sort(byName);
        wilaya.hubs.sort(byName);
    }

    return {
        fetchedAt: fetchedAt ? new Date(fetchedAt) : new Date(),
        wilayas,
        communes,
        hubsById,
        readyStateId: env.zr.readyStateId || findReadyState(workflows),
    };
};

const refresh = async () => {
    if (!zr.isConfigured()) return false;
    try {
        const [territories, rates, hubs, workflows] = await Promise.all([
            zr.searchTerritories(),
            zr.getRates(),
            zr.searchHubs(),
            // The workflow only gives the "ready to dispatch" state; parcels still work without it
            zr.searchWorkflows().catch((err) => {
                logger.warn({ event: 'zr.workflow_unavailable', detail: err.message }, 'ZR workflow not available');
                return [];
            }),
        ]);
        const raw = { territories, rates, hubs, workflows, fetchedAt: new Date() };
        const next = build(raw);
        if (!next.wilayas.size) throw new Error('ZR returned no wilayas');

        current = next;
        await ZrSnapshot.findByIdAndUpdate(SNAPSHOT_ID, { data: raw, fetchedAt: raw.fetchedAt }, { upsert: true });
        logger.info({
            event: 'zr.sync',
            wilayas: current.wilayas.size,
            communes: current.communes.size,
            offices: current.hubsById.size,
            readyStateFound: Boolean(current.readyStateId),
        }, 'ZR data refreshed');
        return true;
    } catch (err) {
        logger.error({ event: 'zr.sync_failed', detail: err.message }, 'ZR data refresh failed, keeping the saved copy');
        return false;
    }
};

const loadSaved = async () => {
    const saved = await ZrSnapshot.findById(SNAPSHOT_ID).lean();
    if (saved?.data) current = build({ ...saved.data, fetchedAt: saved.fetchedAt });
};

// Called once by server.js after MongoDB is connected
const start = async () => {
    if (!zr.isConfigured()) {
        logger.info('ZR Express not configured: the order form uses the fixed delivery prices');
        return;
    }
    await loadSaved();
    await refresh();
    timer = setInterval(refresh, env.zr.syncHours * 60 * 60 * 1000);
    timer.unref();
};

const ready = () => Boolean(current?.wilayas.size);

const requireReady = () => {
    if (!ready()) throw new HttpError(503, 'Delivery prices are not available yet');
};

// ~58 small rows for the first select of the order form
const listWilayas = () => {
    requireReady();
    return [...current.wilayas.values()]
        .sort((a, b) => a.code - b.code)
        .map((wilaya) => ({
            id: wilaya.id,
            code: wilaya.code,
            name: wilaya.name,
            nameFr: wilaya.nameFr,
            home: wilaya.hasHome ? wilaya.prices.home ?? null : null,
            pickup: wilaya.hubs.length ? wilaya.prices.pickup ?? null : null,
        }));
};

// Communes (with their real price) and ZR offices of one wilaya
const wilayaDetails = (wilayaId) => {
    requireReady();
    const wilaya = current.wilayas.get(wilayaId);
    if (!wilaya) return null;
    const hasOffices = wilaya.hubs.length > 0;
    return {
        id: wilaya.id,
        code: wilaya.code,
        name: wilaya.name,
        communes: wilaya.communes.map((commune) => ({
            id: commune.id,
            name: commune.name,
            home: commune.hasHome ? commune.prices.home ?? null : null,
            pickup: hasOffices ? commune.prices.pickup ?? null : null,
        })),
        offices: wilaya.hubs.map(({ id, name, commune, street, openingHours }) => ({ id, name, commune, street, openingHours })),
    };
};

// The price the customer pays for delivery, decided on the server
const quote = ({ wilayaId, communeId, deliveryType, hubId }) => {
    requireReady();
    const wilaya = current.wilayas.get(wilayaId);
    const commune = current.communes.get(communeId);
    if (!wilaya || !commune || commune.wilayaId !== wilaya.id) throw new HttpError(400, 'Unknown commune for this wilaya');

    if (deliveryType === 'desk') {
        const hub = current.hubsById.get(hubId);
        if (!hub || hub.wilayaId !== wilaya.id) throw new HttpError(400, 'Please choose a ZR office in this wilaya');
        if (commune.prices.pickup == null) throw new HttpError(400, 'Office delivery is not available here');
        return { wilaya, commune, hub, shippingPrice: commune.prices.pickup };
    }

    if (!commune.hasHome || commune.prices.home == null) throw new HttpError(400, 'Home delivery is not available in this commune');
    return { wilaya, commune, shippingPrice: commune.prices.home };
};

const status = () => {
    const expires = env.zr.keyExpires ? new Date(env.zr.keyExpires) : null;
    const daysLeft = expires && !Number.isNaN(expires.getTime())
        ? Math.ceil((expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;
    return {
        configured: zr.isConfigured(),
        webhookConfigured: Boolean(env.zr.webhookSecret),
        ready: ready(),
        updatedAt: current?.fetchedAt || null,
        wilayas: current?.wilayas.size || 0,
        communes: current?.communes.size || 0,
        offices: current?.hubsById.size || 0,
        readyStateFound: Boolean(current?.readyStateId),
        keyExpires: env.zr.keyExpires || null,
        daysLeft,
    };
};

module.exports = {
    start,
    refresh,
    ready,
    listWilayas,
    wilayaDetails,
    quote,
    status,
    findReadyState,
    readyStateId: () => current?.readyStateId || null,
    fetchedAt: () => current?.fetchedAt || null,
    // Tests only
    _reset: () => {
        current = null;
    },
};
