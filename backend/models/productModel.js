const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    isMain: { type: Boolean, default: false }
});

const sizeSchema = new mongoose.Schema({
    value: { type: String, required: true }, // e.g., "S", "M", "2Y"
    stock: { type: Number, default: 0 }
});

const colorSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Pink"
    hexCode: { type: String }, // e.g., "#FFC0CB"
    images: [imageSchema],
    sizes: [sizeSchema]
});

// Pack offer: the total price for buying `quantity` pieces (e.g. 2 sets for 7000 DA).
// Without an offer, N pieces cost N × price.
const offerSchema = new mongoose.Schema({
    quantity: { type: Number, required: true, min: 1, max: 5 },
    price: { type: Number, required: true, min: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    category: { type: String, default: 'girls-clothing' },
    images: [imageSchema],
    colors: [colorSchema],
    offers: [offerSchema],
    createdAt: { type: Date, default: Date.now }
});

productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
