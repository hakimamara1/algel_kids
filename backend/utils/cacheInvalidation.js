

const isConnected = typeof redisConfig.isConnected === 'function' ? redisConfig.isConnected : () => false;
const getRedisClient = typeof redisConfig.getRedisClient === 'function' ? redisConfig.getRedisClient : () => null;

/**
 * Invalidate cache for a specific product
 * @param {string} productId - Product ID
 */
const invalidateProduct = async (productId) => {
    if (!isConnected()) {
        return;
    }

    try {
        const redisClient = getRedisClient();
        const cacheKey = `cache:product:${productId}`;

        await redisClient.del(cacheKey);
        console.log(`✓ Cache invalidated: ${cacheKey}`);
    } catch (error) {
        console.error('Cache invalidation error:', error.message);
    }
};

/**
 * Invalidate cache for all products list
 */
const invalidateAllProducts = async () => {
    if (!isConnected()) {
        return;
    }

    try {
        const redisClient = getRedisClient();
        const cacheKey = 'cache:products:all';

        await redisClient.del(cacheKey);
        console.log(`✓ Cache invalidated: ${cacheKey}`);
    } catch (error) {
        console.error('Cache invalidation error:', error.message);
    }
};

/**
 * Invalidate all product-related caches
 * Use this for operations that affect multiple products
 */
const invalidateAllProductCaches = async () => {
    if (!isConnected()) {
        return;
    }

    try {
        const redisClient = getRedisClient();

        // Find all keys matching the pattern
        const keys = await redisClient.keys('cache:product*');

        if (keys.length > 0) {
            await redisClient.del(...keys);
            console.log(`✓ Cache invalidated: ${keys.length} product cache(s)`);
        }
    } catch (error) {
        console.error('Cache invalidation error:', error.message);
    }
};

module.exports = {
    invalidateProduct,
    invalidateAllProducts,
    invalidateAllProductCaches,
};
