const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');

// Cached product ID
const CACHED_PRODUCT_ID = '69793800671641164cab143f';
const CACHE_DIR = path.join(__dirname, '../cache/products');
const CACHE_FILE = path.join(CACHE_DIR, `${CACHED_PRODUCT_ID}.json`);

/**
 * Check if a product is cached
 * @param {string} productId 
 * @returns {boolean}
 */
const isCachedProduct = (productId) => {
    return productId === CACHED_PRODUCT_ID && fs.existsSync(CACHE_FILE);
};

/**
 * Get cached product from file
 * @param {string} productId 
 * @returns {Object|null}
 */
const getCachedProduct = (productId) => {
    try {
        if (!isCachedProduct(productId)) {
            return null;
        }

        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading cached product:', error.message);
        return null;
    }
};

/**
 * Regenerate product cache from MongoDB
 * @param {string} productId 
 * @returns {Promise<boolean>}
 */
const regenerateProductCache = async (productId) => {
    try {
        if (productId !== CACHED_PRODUCT_ID) {
            return false;
        }

        console.log(`Regenerating cache for product ${productId}...`);

        // Fetch from MongoDB
        const product = await Product.findById(productId);
        if (!product) {
            console.error('Product not found in database');
            return false;
        }

        // Ensure cache directory exists
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }

        // Write to cache file
        fs.writeFileSync(CACHE_FILE, JSON.stringify(product, null, 2), 'utf8');
        console.log(`✓ Product cache regenerated: ${CACHE_FILE}`);

        return true;
    } catch (error) {
        console.error('Error regenerating product cache:', error.message);
        return false;
    }
};

module.exports = {
    isCachedProduct,
    getCachedProduct,
    regenerateProductCache,
    CACHED_PRODUCT_ID,
};
