// The GINSENG KIANPI PIL product, as the /l/ginseng landing page needs it.
// Used by `npm run demo` (in-memory) and by `npm run ginseng:create` (whatever MONGO_URI points at),
// so the demo and the live shop hold exactly the same product under the same id.
//
// One box is one box: a single color with a single size, so the stock still goes down per box
// and the admin can edit it like any other product.

const mongoose = require('mongoose');
const landings = require('../../frontend/src/landings/landings.json');

const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photos = (...files) => files.map((file) => ({ publicId: file.split('/').pop().split('.')[0], url: `${CLD}/${file}` }));

// Same photo as the landing page hero, so index.html preloads the file the page then shows
const HERO = 'v1791245206/malaksit-landing/ginseng/dujuijhx32ptqykgibul.webp';

const BOXES_IN_STOCK = 30;

const ginsengProduct = () => ({
    _id: new mongoose.Types.ObjectId(landings.ginseng.productId),
    title: 'GINSENG KIANPI PIL',
    slug: 'ginseng-kianpi-pil',
    price: 4300,
    offers: [{ quantity: 2, price: 7100 }, { quantity: 3, price: 9200 }],
    description: 'مكمّل غذائي بتركيبة أعشاب صينية تقليدية. العلبة فيها 60 كبسولة. اتبع التعليمات المكتوبة على العبوة.',
    category: 'supplements',
    // Sold only through /l/ginseng: it must never appear in the Angel Kids shop list
    listed: false,
    images: photos(HERO),
    colors: [
        // Named so the order reads "علبة 60 كبسولة" everywhere (thank-you page, ZR parcel, admin)
        { name: 'علبة', hexCode: '#CFE0C8', sizes: [{ value: '60 كبسولة', stock: BOXES_IN_STOCK }], images: photos(HERO) },
    ],
});

module.exports = { ginsengProduct, BOXES_IN_STOCK };
