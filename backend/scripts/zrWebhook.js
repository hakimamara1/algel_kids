// Registers this server's webhook address at ZR Express and prints the signing secret.
// Usage: npm run zr:webhook            (uses https://algel-kids-xkjm.onrender.com)
//        npm run zr:webhook -- https://your-api.example/api/webhooks/zr
process.env.LOG_LEVEL ||= 'warn';
const zr = require('../services/zrExpress');

const EVENTS = ['parcel.state.updated', 'parcel.state.situation.created', 'parcel.isReturn.updated'];
const base = (process.env.PUBLIC_API_URL || 'https://algel-kids-xkjm.onrender.com').replace(/\/+$/, '');
const url = process.argv[2] || `${base}/api/webhooks/zr`;

const asList = (data) => (Array.isArray(data) ? data : data?.items || data?.endpoints || []);

const main = async () => {
    const existing = asList(await zr.listWebhookEndpoints().catch(() => [])).find((endpoint) => endpoint.url === url);
    const endpoint = existing || await zr.createWebhookEndpoint({
        url,
        description: 'Angel Kids site: parcel status updates',
        eventTypes: EVENTS,
    });
    console.log(`✓ ${existing ? 'Already registered' : 'Registered'}: ${url}`);

    const { secret } = await zr.getWebhookSecret(endpoint.id);
    console.log('\nAdd this on Render → Environment, then redeploy:\n');
    console.log(`  ZR_WEBHOOK_SECRET=${secret}\n`);
};

main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
});
