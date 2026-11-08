// The Trench Élégant product, as the /l/trench-coat landing page needs it.
// Used by `npm run demo` (in-memory) and by the create/sync scripts.

const mongoose = require('mongoose');
const landings = require('../../frontend/src/landings/landings.json');

const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photos = (...files) => files.map((file) => ({ publicId: file.split('/').pop().split('.')[0], url: `${CLD}/${file}` }));

const DIR = 'malaksit-landing/trenchelegant';
const SIZES = ['46', '48', '50'];
const STOCK_PER_SIZE = 10;

// name -> [swatch, photo]. The order is the order the page shows them in.
const COLORS = [
    ['Taupe', '#8C7F72', `v1794155405/${DIR}/lfbtu2sfack2q8eoat9e.webp`],
    ['Marron caramel', '#8B5E34', `v1794155406/${DIR}/qps29w4koeagfnaj3sgz.webp`],
    ['Beige clair', '#CFC6B8', `v1794155407/${DIR}/youh5phj5kokjhgzeokj.webp`],
];

// The hero photo of the landing page, so index.html preloads the file the page then shows
const HERO = `v1794155403/${DIR}/ijdxbedxhs2m2h2xoika.webp`;

const sizes = (stock = STOCK_PER_SIZE) => SIZES.map((value) => ({ value, stock }));

const trenchCoatProduct = () => ({
    _id: new mongoose.Types.ObjectId(landings['trench-coat'].productId),
    title: 'Trench Élégant',
    slug: 'trench-elegant',
    price: 3800,
    offers: [{ quantity: 2, price: 7000 }, { quantity: 3, price: 9000 }],
    description: 'معطف Trench Élégant بقصة واسعة وأكمام منفوخة، طول 105 سم. متوفر بثلاثة ألوان ومقاسات 46 و48 و50.',
    category: 'angel_clost',
    images: photos(HERO),
    colors: COLORS.map(([name, hexCode, file]) => ({
        name,
        hexCode,
        sizes: sizes(),
        images: photos(file),
    })),
});

module.exports = { trenchCoatProduct, SIZES, STOCK_PER_SIZE, COLORS, sizes, photos };
