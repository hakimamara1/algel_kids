const Product = require('../models/productModel');
const { isCachedProduct, getCachedProduct, regenerateProductCache } = require('../utils/productCache');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        // Check if product is cached
        if (isCachedProduct(req.params.id)) {
            const cachedProduct = getCachedProduct(req.params.id);
            if (cachedProduct) {
                console.log(`✓ Serving product from cache: ${req.params.id}`);
                return res.json(cachedProduct);
            }
        }

        // Otherwise query MongoDB
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin (TODO: Add Auth)
const createProduct = async (req, res) => {
    try {
        // Auto-generate slug if not provided
        if (!req.body.slug && req.body.title) {
            req.body.slug = req.body.title
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');
        }

        // Basic creation logic - in real app would handle image uploads here or via separate endpoint
        const product = new Product(req.body);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return res.status(400).json({ message: 'A product with this title/slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Product validation failed.' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Update fields if present in body
            product.title = req.body.title || product.title;

            // Re-generate slug if title changed and slug not manually provided?
            // For now let's stick to simple update. Admin can manually update slug if needed.
            // If we want auto-update slug:
            if (req.body.title && req.body.title !== product.title && !req.body.slug) {
                product.slug = req.body.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            } else if (req.body.slug) {
                product.slug = req.body.slug;
            }

            product.price = req.body.price || product.price;
            product.description = req.body.description || product.description;
            product.images = req.body.images || product.images;
            product.category = req.body.category || product.category;
            product.colors = req.body.colors || product.colors;

            const updatedProduct = await product.save();

            // Regenerate cache if this is the cached product
            await regenerateProductCache(req.params.id);

            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            return res.status(400).json({ message: 'A product with this title/slug already exists.' });
        }
        res.status(400).json({ message: error.message || 'Product validation failed.' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    updateProduct
};
