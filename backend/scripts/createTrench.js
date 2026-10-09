// Creates the Ensemble Trench product in the database MONGO_URI points at.
// Run it once, from the backend folder:  npm run trench:create
// It never overwrites: if the product is already there it only prints what is saved.

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const { trenchProduct, SIZES, STOCK_PER_SIZE } = require('./trenchProduct');

const show = (product) => {
    const stock = (product.colors || []).flatMap((color) => color.sizes || []).reduce((total, size) => total + size.stock, 0);
    console.log(`  id      ${product._id}`);
    console.log(`  title   ${product.title}`);
    console.log(`  price   ${product.price} DA  (2 sets ${product.offers?.[0]?.price})`);
    console.log(`  colors  ${(product.colors || []).map((color) => color.name).join(', ')}`);
    console.log(`  sizes   ${SIZES.join(', ')}`);
    console.log(`  stock   ${stock} sets (${STOCK_PER_SIZE} per size per color)`);
};

(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(process.env.MONGO_URI);

    const wanted = trenchProduct();
    const existing = await Product.findById(wanted._id).lean();
    if (existing) {
        console.log('Already there — nothing changed:');
        show(existing);
    } else {
        const created = await Product.create(wanted);
        console.log('Created:');
        show(created);
    }

    await mongoose.disconnect();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
