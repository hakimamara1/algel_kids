// Brings the live Trench Élégant product in line with the landing page:
// three colours (Taupe, Marron caramel, Beige clair) and sizes 46 / 48 / 50.
//
// The product was first created with eight colours and a single "Standard" size, and the
// stock has been edited by hand since. So this script NEVER writes on its own:
//
//   npm run trenchcoat:sync           shows what is live and what would change
//   npm run trenchcoat:sync -- --apply          applies it, carrying the live stock over
//   npm run trenchcoat:sync -- --apply --reset-stock   applies it with 10 per size instead
//
// Carrying the stock over splits each colour's live total across the three sizes
// (remainder to the first size), so a colour that is sold out stays sold out.

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const { trenchCoatProduct, SIZES, STOCK_PER_SIZE } = require('./trenchCoatProduct');

const APPLY = process.argv.includes('--apply');
const RESET_STOCK = process.argv.includes('--reset-stock');

const totalOf = (color) => (color?.sizes || []).reduce((sum, size) => sum + Number(size.stock || 0), 0);

// 24 across three sizes -> 8, 8, 8;  10 -> 4, 3, 3;  0 -> 0, 0, 0
const split = (total) => {
    const base = Math.floor(total / SIZES.length);
    const extra = total % SIZES.length;
    return SIZES.map((value, index) => ({ value, stock: base + (index < extra ? 1 : 0) }));
};

const show = (label, colors) => {
    console.log(`\n${label}`);
    for (const color of colors) {
        const sizes = (color.sizes || []).map((s) => `${s.value}×${s.stock}`).join(', ');
        console.log(`  ${color.name.padEnd(18)} ${sizes}   (total ${totalOf(color)})`);
    }
    console.log(`  ${'TOTAL'.padEnd(18)} ${colors.reduce((t, c) => t + totalOf(c), 0)} pieces`);
};

(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(process.env.MONGO_URI);

    const wanted = trenchCoatProduct();
    const live = await Product.findById(wanted._id).lean();
    if (!live) throw new Error('Trench Élégant is not in this database — run `npm run trenchcoat:create` first');

    show('LIVE NOW:', live.colors || []);

    // Keep each kept colour's live total unless asked to reset
    const liveTotals = new Map((live.colors || []).map((color) => [color.name, totalOf(color)]));
    const colors = wanted.colors.map((color) => ({
        ...color,
        sizes: RESET_STOCK ? color.sizes : split(liveTotals.get(color.name) ?? 0),
    }));

    const dropped = (live.colors || []).filter((color) => !colors.some((kept) => kept.name === color.name));
    show('AFTER:', colors);
    if (dropped.length) {
        console.log(`\n  dropping ${dropped.length} colour(s): ${dropped.map((c) => `${c.name} (stock ${totalOf(c)})`).join(', ')}`);
    }

    if (!APPLY) {
        console.log('\nNothing written. Re-run with --apply to save it.');
        console.log(RESET_STOCK ? '' : 'Add --reset-stock to use 10 per size instead of carrying the live totals over.');
        await mongoose.disconnect();
        return;
    }

    await Product.updateOne({ _id: wanted._id }, {
        $set: {
            title: wanted.title,
            description: wanted.description,
            price: wanted.price,
            offers: wanted.offers,
            images: wanted.images,
            colors,
        },
    });
    console.log(`\nSaved${RESET_STOCK ? ` (${STOCK_PER_SIZE} per size)` : ' (live stock carried over)'}.`);
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
