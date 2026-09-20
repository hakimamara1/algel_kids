// Local demo: see the shop, the landing pages and the dashboard on your computer.
//   cd backend && npm run demo        (then, in another terminal: cd frontend && npm run dev)
//   Landing page: http://localhost:5173/l/uniforme
//   Dashboard:    http://localhost:5173/admin   (password: demo)
//
// Everything is temporary and fake: an in-memory database (emptied when you stop), a fake ZR Express
// (2 wilayas: Alger and Oran) and no Meta events. It never touches the real database or the real ZR account.
// The products below are demo copies (same prices as the real ones).
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const landings = require('../../frontend/src/landings/landings.json');

// frontend/.env uses http://localhost:5001. If your own backend already uses 5001, run the demo on another port:
//   DEMO_PORT=5002 npm run demo   and   VITE_BACKEND_URL=http://localhost:5002 npx vite --port 5174
const BACKEND_PORT = Number(process.env.DEMO_PORT) || 5001;
const ZR_PORT = BACKEND_PORT + 198;

// --- Fake ZR Express: places, prices and offices ---
const W16 = '11111111-1111-4111-8111-111111111111';
const W31 = '31313131-3131-4131-8131-313131313131';
const TERRITORIES = [
    { id: W16, code: 16, name: 'Alger', level: 'wilaya', delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: W31, code: 31, name: 'Oran', level: 'wilaya', delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: '22222222-2222-4222-8222-222222222222', name: 'Baraki', level: 'commune', parentId: W16, delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Kouba', level: 'commune', parentId: W16, delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
    { id: '44444444-4444-4444-8444-444444444444', name: 'Es Senia', level: 'commune', parentId: W31, delivery: { hasHomeDelivery: true, hasPickupPoint: true } },
];
const RATES = {
    rates: [
        { toTerritoryId: W16, toTerritoryLevel: 'wilaya', deliveryPrices: [{ deliveryType: 'home', price: 600 }, { deliveryType: 'pickup-point', price: 450 }] },
        { toTerritoryId: W31, toTerritoryLevel: 'wilaya', deliveryPrices: [{ deliveryType: 'home', price: 800 }, { deliveryType: 'pickup-point', price: 450 }] },
    ],
};
const HUBS = [
    { id: '55555555-5555-4555-8555-555555555555', name: 'Bureau Baraki', type: 'stopdesk', isPickupPoint: true, address: { cityTerritoryId: W16, districtTerritoryId: TERRITORIES[2].id, district: 'Baraki' } },
    { id: '66666666-6666-4666-8666-666666666666', name: 'Bureau Oran', type: 'stopdesk', isPickupPoint: true, address: { cityTerritoryId: W31, districtTerritoryId: TERRITORIES[4].id, district: 'Es Senia' } },
];
const WORKFLOWS = [{ id: 'wf', name: 'New Delivery Workflow', isDefault: true, states: [{ id: '77777777-7777-4777-8777-777777777777', name: 'ReadyToDispatch' }] }];

const fakeZr = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => {
        const key = `${req.method} ${req.url.replace('/api/v1', '')}`;
        const replies = {
            'POST /territories/search': { items: TERRITORIES, hasNext: false },
            'GET /delivery-pricing/rates': RATES,
            'POST /hubs/search': { items: HUBS, hasNext: false },
            'POST /workflows/search': { items: WORKFLOWS, hasNext: false },
        };
        res.writeHead(replies[key] ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(replies[key] || { title: 'Not available in the demo' }));
    });
});

// --- Demo products (photos from Cloudinary) ---
const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photos = (...files) => files.map((file) => ({ publicId: file.split('/').pop().split('.')[0], url: `${CLD}/${file}` }));
const BLOUSE_SIZES = ['38', '40', '42', '44'];
const AGES = ['4 سنوات', '5 سنوات', '6 سنوات', '7 سنوات', '8 سنوات', '9 سنوات', '10 سنوات', '11 سنة', '12 سنة'];

const seed = async () => {
    const Product = require('../models/productModel');
    await Product.create({
        _id: new mongoose.Types.ObjectId(landings.uniforme.productId),
        title: 'Uniforme scolaire',
        slug: 'uniforme-scolaire',
        price: 3500,
        offers: [{ quantity: 2, price: 6100 }, { quantity: 3, price: 9000 }],
        description: 'DEMO copy of the real product',
        images: photos('v1789610616/malaksit-products/rvcsqcsj2sac0kqazjao.png'),
        colors: [
            { name: 'Bleu marine', hexCode: '#1F2F52', sizes: AGES.map((value) => ({ value, stock: 20 })), images: photos('v1789610607/malaksit-products/omuqa1ibb6u4n3d4mrrq.png', 'v1789610609/malaksit-products/ftz2tn6fltgpa6ksqpwq.png') },
            { name: 'Noir', hexCode: '#16161C', sizes: AGES.map((value) => ({ value, stock: 20 })), images: photos('v1789610610/malaksit-products/wircxkxmlqwbhrazx7xp.png', 'v1789610613/malaksit-products/iwzhrhecofw7osrhkudj.png') },
            { name: 'Bordeaux', hexCode: '#6B1F2A', sizes: AGES.map((value) => ({ value, stock: 20 })), images: photos('v1789610615/malaksit-products/qfudkumve87rghlaxgow.png') },
        ],
    });
    await Product.create({
        _id: new mongoose.Types.ObjectId(landings.blouse.productId),
        title: 'Jolie Blouse ✨',
        slug: 'jolie-blouse',
        price: 3500,
        offers: [{ quantity: 2, price: 6000 }, { quantity: 3, price: 8500 }],
        description: 'DEMO copy of the real product',
        images: photos('v1789924696/malaksit-landing/blouse/wxtevtgfsbnpgiwikl17.png'),
        colors: [
            { name: 'Bleu ciel', hexCode: '#9ACBEF', sizes: BLOUSE_SIZES.map((value) => ({ value, stock: 10 })), images: photos('v1789924702/malaksit-landing/blouse/kb07koikcm3uthnj1k0m.png') },
            { name: 'Rose', hexCode: '#F074B4', sizes: BLOUSE_SIZES.map((value) => ({ value, stock: 10 })), images: photos('v1789924699/malaksit-landing/blouse/t5li0ixxwxgcnrz6npl7.png') },
        ],
    });
};

(async () => {
    await new Promise((resolve) => fakeZr.listen(ZR_PORT, resolve));
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri('demo');
    await mongoose.connect(uri);
    await seed();
    await mongoose.disconnect();

    const backend = spawn(process.execPath, ['server.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: {
            ...process.env,
            MONGO_URI: uri,
            PORT: String(BACKEND_PORT),
            NODE_ENV: 'development',
            LOG_LEVEL: 'warn',
            ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:5174,http://localhost:4174',
            ADMIN_PASSWORD: 'demo',
            ADMIN_TOKEN_SECRET: 'demo-secret',
            CLOUDINARY_CLOUD_NAME: 'demo',
            CLOUDINARY_API_KEY: 'demo',
            CLOUDINARY_API_SECRET: 'demo',
            ZR_API_URL: `http://localhost:${ZR_PORT}/api/v1`,
            ZR_API_KEY: 'demo',
            ZR_TENANT_ID: 'demo',
            ZR_KEY_EXPIRES: '2099-01-01',
            ZR_WEBHOOK_SECRET: '',
            META_CAPI_TOKEN: '',
            META_TEST_EVENT_CODE: '',
        },
    });

    console.log(`
Demo backend on http://localhost:${BACKEND_PORT} (temporary data, fake ZR, no Meta)
Now run the frontend in another terminal:  cd frontend && npm run dev
  Landing page: http://localhost:5173/l/uniforme
  Dashboard:    http://localhost:5173/admin   (password: demo)
Stop with Ctrl+C.
`);

    const stop = async () => {
        backend.kill('SIGTERM');
        fakeZr.close();
        await mongod.stop();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
})().catch((err) => {
    console.error('Demo could not start:', err.message);
    process.exit(1);
});
