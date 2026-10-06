// Creates the GINSENG KIANPI PIL product in the database MONGO_URI points at.
// Run it once, from the backend folder:  npm run ginseng:create
// It never overwrites: if the product is already there it only prints what is saved.

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const { ginsengProduct, BOXES_IN_STOCK } = require('./ginsengProduct');

const show = (product) => {
    const stock = (product.colors || []).flatMap((color) => color.sizes || []).reduce((total, size) => total + size.stock, 0);
    console.log(`  id     ${product._id}`);
    console.log(`  title  ${product.title}`);
    console.log(`  price  ${product.price} DA  (2 boxes ${product.offers?.[0]?.price}, 3 boxes ${product.offers?.[1]?.price})`);
    console.log(`  stock  ${stock} boxes`);
};

(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(process.env.MONGO_URI);

    const wanted = ginsengProduct();
    const existing = await Product.findById(wanted._id).lean();
    if (existing) {
        // The flag was added after the first run: make sure the live row carries it
        if (existing.listed !== false) {
            await Product.updateOne({ _id: wanted._id }, { $set: { listed: false } });
            console.log('Already there — hidden from the shop list (listed: false):');
        } else {
            console.log('Already there — nothing changed:');
        }
        show(existing);
    } else {
        const created = await Product.create(wanted);
        console.log(`Created (${BOXES_IN_STOCK} boxes in stock):`);
        show(created);
    }

    await mongoose.disconnect();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
