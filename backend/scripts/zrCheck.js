// Checks the ZR Express connection with the keys in this environment. Never prints the key.
// Usage (Render Shell or locally with backend/.env): npm run zr:check
process.env.LOG_LEVEL ||= 'warn';
const { env } = require('../config/env');
const zr = require('../services/zrExpress');
const { findReadyState } = require('../services/zrData');

const ok = (text) => console.log(`✓ ${text}`);
const fail = (text) => console.log(`✗ ${text}`);

// Looks through the profile for anything named like a tenant id
const findTenantIds = (value, path = '', found = []) => {
    if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
            const childPath = path ? `${path}.${key}` : key;
            if (/tenant/i.test(key) && ['string', 'number'].includes(typeof child)) found.push(`${childPath} = ${child}`);
            else findTenantIds(child, childPath, found);
        }
    }
    return found;
};

const main = async () => {
    if (!env.zr.apiKey) {
        fail('ZR_API_KEY is not set');
        process.exitCode = 1;
        return;
    }

    try {
        const profile = await zr.getProfile();
        ok('API key accepted');
        const tenants = findTenantIds(profile);
        if (tenants.length) console.log(`  Tenant id found in your profile: ${tenants.join(' · ')}`);
    } catch (err) {
        fail(`Profile check failed: ${err.message}`);
    }

    if (!env.zr.tenantId) {
        fail('ZR_TENANT_ID is not set: copy it from above or from the ZR portal, then run this again');
        process.exitCode = 1;
        return;
    }

    const [territories, rates, hubs, workflows] = await Promise.all([
        zr.searchTerritories(),
        zr.getRates(),
        zr.searchHubs(),
        zr.searchWorkflows().catch(() => []),
    ]);

    const wilayas = territories.filter((territory) => territory.level === 'wilaya');
    const communes = territories.filter((territory) => territory.level === 'commune');
    const offices = hubs.filter((hub) => hub.isPickupPoint || hub.type === 'stopdesk');
    ok(`${wilayas.length} wilayas · ${communes.length} communes · ${offices.length} ZR offices`);

    const rateList = rates?.rates || [];
    ok(`${rateList.length} delivery prices`);
    const describe = (rate) => rate.deliveryPrices.map((price) => `${price.deliveryType} ${price.price} DA`).join(' · ');
    const algiers = wilayas.find((wilaya) => wilaya.code === 16);
    const algiersRate = algiers && rateList.find((rate) => rate.toTerritoryId === algiers.id);
    if (algiersRate) console.log(`  Alger (wilaya): ${describe(algiersRate)}`);
    const communeRate = rateList.find((rate) => rate.toTerritoryLevel === 'commune');
    if (communeRate) console.log(`  ${communeRate.toTerritoryName} (commune): ${describe(communeRate)}`);

    const workflow = workflows.find((entry) => entry.isDefault) || workflows[0];
    if (workflow) {
        const states = [...(workflow.states || [])].sort((a, b) => (a.ranking ?? 0) - (b.ranking ?? 0));
        console.log(`  Workflow "${workflow.name}":`);
        for (const state of states) console.log(`    - ${state.name}  (${state.id})`);
        const readyId = env.zr.readyStateId || findReadyState(workflows);
        if (readyId) ok(`New parcels will be created in state ${states.find((s) => s.id === readyId)?.name || readyId}`);
        else fail('No "ReadyToDispatch" state found: set ZR_READY_STATE_ID to the right id from the list above');
    } else {
        fail('Workflow not readable: parcels will start as "Order received" in ZR');
    }

    if (env.zr.webhookSecret) ok('ZR_WEBHOOK_SECRET is set');
    else console.log('  Next step: npm run zr:webhook');
    if (env.zr.keyExpires) console.log(`  Key valid until ${env.zr.keyExpires}`);
    else console.log('  Tip: set ZR_KEY_EXPIRES (the key\'s "Valid until" date) to get a reminder in the dashboard');
};

main().catch((err) => {
    fail(err.message);
    process.exitCode = 1;
});
