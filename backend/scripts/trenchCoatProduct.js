// The Trench Élégant product, as the /l/trench-coat landing page needs it.
// Used by `npm run demo` (in-memory) and by `npm run trenchcoat:create` (whatever MONGO_URI points at),
// so the demo and the live shop hold exactly the same product under the same id.
//
// One size only ("taille standard"), so every colour carries a single size entry
// and the stock still goes down per piece.

const mongoose = require('mongoose');
const landings = require('../../frontend/src/landings/landings.json');

const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photos = (...files) => files.map((file) => ({ publicId: file.split('/').pop().split('.')[0], url: `${CLD}/${file}` }));

const DIR = 'malaksit-landing/trenchcoat';
const SIZE = 'Standard';
const STOCK_PER_COLOR = 10;

// name -> [swatch, photo]. The order is the order the page shows them in.
const COLORS = [
    ['Beige clair', '#CFC6B8', `v1791676628/${DIR}/ldzosxnaphh7e1yyabio.webp`],
    ['Marron caramel', '#8B5E34', `v1791676629/${DIR}/rfj3nnrhzqlo0ztepzba.webp`],
    ['Taupe', '#8C7F72', `v1791676632/${DIR}/hqjnyy42qansbco2tprj.webp`],
    ['Beige sable', '#C9AE86', `v1791676630/${DIR}/obvquhivgcdodzq1heak.webp`],
    ['Marron chocolat', '#4A2C23', `v1791676625/${DIR}/fnulzusb5be2mowzzzno.webp`],
    ['Ivoire', '#E8E2D5', `v1791676626/${DIR}/zlvr40zyfhuji8et8xab.webp`],
    ['Vert kaki clair', '#7C8560', `v1791676631/${DIR}/fhmx6bdqdqmwmee76xwk.webp`],
    ['Noir', '#16161C', `v1791676627/${DIR}/sjtyfxxiq7x4ndylgx4y.webp`],
];

// The hero photo of the landing page, so index.html preloads the file the page then shows
const HERO = COLORS[1][2];

const trenchCoatProduct = () => ({
    _id: new mongoose.Types.ObjectId(landings['trench-coat'].productId),
    title: 'Trench Élégant',
    slug: 'trench-elegant',
    price: 3800,
    offers: [{ quantity: 2, price: 7000 }, { quantity: 3, price: 9000 }],
    description: 'معطف Trench Élégant بقصة واسعة وأكمام منفوخة. تايل ستاندار يناسب من 38 إلى 44، متوفر بـ 8 ألوان.',
    category: 'angel_clost',
    images: photos(HERO),
    colors: COLORS.map(([name, hexCode, file]) => ({
        name,
        hexCode,
        sizes: [{ value: SIZE, stock: STOCK_PER_COLOR }],
        images: photos(file),
    })),
});

module.exports = { trenchCoatProduct, STOCK_PER_COLOR, COLORS };
