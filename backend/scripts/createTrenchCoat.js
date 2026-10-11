// Creates the Trench Élégant product in the database MONGO_URI points at.
// Run it once, from the backend folder:  npm run trenchcoat:create
// It never overwrites: if the product is already there it only prints what is saved.

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const { trenchCoatProduct, STOCK_PER_COLOR } = require('./trenchCoatProduct');

const show = (product) => {
    const stock = (product.colors || []).flatMap((color) => color.sizes || []).reduce((total, size) => total + size.stock, 0);
    console.log(`  id      ${product._id}`);
    console.log(`  title   ${product.title}`);
    console.log(`  price   ${product.price} DA  (2 pieces ${product.offers?.[0]?.price}, 3 pieces ${product.offers?.[1]?.price})`);
    console.log(`  colors  ${(product.colors || []).length}: ${(product.colors || []).map((color) => color.name).join(', ')}`);
    console.log(`  stock   ${stock} pieces (${STOCK_PER_COLOR} per colour, one size)`);
};

(async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(process.env.MONGO_URI);

    const wanted = trenchCoatProduct();
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
