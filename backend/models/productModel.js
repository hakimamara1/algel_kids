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

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, default: 'girls-clothing' },
    images: [imageSchema],
    colors: [colorSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
