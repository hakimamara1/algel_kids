const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');

// Cached product IDs - add product IDs here to enable file-based caching
const CACHED_PRODUCT_IDS = [
    '69793800671641164cab143f',
    '698a5fd2d7265c2eb5de6332'
];
const CACHE_DIR = path.join(__dirname, '../cache/products');

/**
 * Get cache file path for a product
 * @param {string} productId 
 * @returns {string}
 */
const getCacheFilePath = (productId) => {
    return path.join(CACHE_DIR, `${productId}.json`);
};

/**
 * Check if a product is cached
 * @param {string} productId 
 * @returns {boolean}
 */
const isCachedProduct = (productId) => {
    if (!CACHED_PRODUCT_IDS.includes(productId)) {
        return false;
    }
    const cacheFile = getCacheFilePath(productId);
    return fs.existsSync(cacheFile);
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

        const cacheFile = getCacheFilePath(productId);
        const data = fs.readFileSync(cacheFile, 'utf8');
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
        if (!CACHED_PRODUCT_IDS.includes(productId)) {
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
        const cacheFile = getCacheFilePath(productId);
        fs.writeFileSync(cacheFile, JSON.stringify(product, null, 2), 'utf8');
        console.log(`✓ Product cache regenerated: ${cacheFile}`);

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
    CACHED_PRODUCT_IDS,
};
