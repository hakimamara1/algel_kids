require('dotenv').config();
const mongoose = require('mongoose');
const { regenerateProductCache, CACHED_PRODUCT_ID } = require('../utils/productCache');

/**
 * Script to regenerate product cache from MongoDB
 * Usage: node scripts/generateProductCache.js
 */
async function generateCache() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ MongoDB Connected');

        console.log(`\nFetching product ${CACHED_PRODUCT_ID} from database...`);
        const success = await regenerateProductCache(CACHED_PRODUCT_ID);

        if (success) {
            console.log('\n✓ Cache generation complete!');
            process.exit(0);
        } else {
            console.log('\n✗ Cache generation failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

generateCache();
