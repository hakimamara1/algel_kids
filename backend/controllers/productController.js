const Product = require('../models/productModel');
const { HttpError } = require('../lib/httpError');
const { slugify } = require('../lib/slugify');

// Only these fields can be set from the admin; anything else in the body is ignored
const EDITABLE_FIELDS = ['title', 'slug', 'description', 'price', 'compareAtPrice', 'category', 'images', 'colors', 'offers'];

// Keeps fields that are present, so 0, '' and null can be saved
const pickEditable = (body = {}) =>
    Object.fromEntries(EDITABLE_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

// "jolie-blouse", then "jolie-blouse-2", "jolie-blouse-3"...
const uniqueSlug = async (text, excludeId) => {
    const base = slugify(text) || 'product';
    let slug = base;
    for (let n = 2; await Product.exists({ slug, _id: { $ne: excludeId } }); n += 1) {
        slug = `${base}-${n}`;
    }
    return slug;
};

// @route   GET /api/products   (public)
const getProducts = async (req, res) => {
    const products = await Product.find().select('-description -__v').sort({ createdAt: -1 }).lean();
    res.json(products);
};

// @route   GET /api/products/:id   (public)
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id).select('-__v').lean();
    if (!product) throw new HttpError(404, 'Product not found');
    res.json(product);
};

// @route   POST /api/products   (admin)
const createProduct = async (req, res) => {
    const data = pickEditable(req.body);
    if (!data.title) throw new HttpError(400, 'Title is required');
    data.slug = await uniqueSlug(data.slug || data.title);

    const product = await Product.create(data);
    req.log.info({ event: 'product.created', productId: product._id, title: product.title }, 'Product created');
    res.status(201).json(product);
};

// @route   PUT /api/products/:id   (admin)
const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');

    const data = pickEditable(req.body);
    if (data.slug !== undefined) {
        data.slug = await uniqueSlug(data.slug, product._id);
    } else if (data.title !== undefined && data.title !== product.title) {
        data.slug = await uniqueSlug(data.title, product._id);
    }

    product.set(data);
    const updated = await product.save();
    req.log.info({ event: 'product.updated', productId: product._id, fields: Object.keys(data) }, 'Product updated');
    res.json(updated);
};

// @route   DELETE /api/products/:id   (admin)
const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new HttpError(404, 'Product not found');
    req.log.info({ event: 'product.deleted', productId: product._id, title: product.title }, 'Product deleted');
    res.json({ message: 'Product removed' });
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
