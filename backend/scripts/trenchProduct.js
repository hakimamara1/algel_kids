// The Ensemble Trench product, as the /l/trench landing page needs it.
// Used by `npm run demo` (in-memory) and by `npm run trench:create` (whatever MONGO_URI points at),
// so the demo and the live shop hold exactly the same product under the same id.

const mongoose = require('mongoose');
const landings = require('../../frontend/src/landings/landings.json');

const CLD = 'https://res.cloudinary.com/djakukf0r/image/upload';
const photos = (...files) => files.map((file) => ({ publicId: file.split('/').pop().split('.')[0], url: `${CLD}/${file}` }));

const BEIGE = 'v1791587640/malaksit-landing/trench/rpj9tefm4rfpguaygspp.jpg';
const NOIR = 'v1791587642/malaksit-landing/trench/aobjppwymctqzksrm3vv.jpg';
const BLEU = 'v1791587643/malaksit-landing/trench/w4rfbg65yid8auowm8rn.jpg';

const SIZES = ['38', '40', '42', '44', '46'];
const STOCK_PER_SIZE = 10;

const sizes = () => SIZES.map((value) => ({ value, stock: STOCK_PER_SIZE }));

const trenchProduct = () => ({
    _id: new mongoose.Types.ObjectId(landings.trench.productId),
    title: 'Ensemble Trench',
    slug: 'ensemble-trench',
    price: 3800,
    offers: [{ quantity: 2, price: 6100 }],
    description: 'طقم Ensemble Trench: سويت شيرت بقبعة + سروال واسع، قماش شتوي دافئ. متوفر بثلاث ألوان ومقاسات من 38 إلى 46.',
    category: 'angel_clost',
    images: photos(BEIGE),
    colors: [
        { name: 'Beige', hexCode: '#D9CBB6', sizes: sizes(), images: photos(BEIGE) },
        { name: 'Noir', hexCode: '#16161C', sizes: sizes(), images: photos(NOIR) },
        { name: 'Bleu ciel', hexCode: '#9FB4C7', sizes: sizes(), images: photos(BLEU) },
    ],
});

module.exports = { trenchProduct, SIZES, STOCK_PER_SIZE };
