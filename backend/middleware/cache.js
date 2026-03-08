// const { getRedisClient, isConnected } = require('../config/redis');

// /**
//  * Cache middleware factory
//  * @param {number} ttl - Time to live in seconds
//  * @returns {Function} Express middleware
//  */
// const cacheMiddleware = (ttl = 300) => {
//     return async (req, res, next) => {
//         // Only cache GET requests
//         if (req.method !== 'GET') {
//             return next();
//         }

//         // Skip caching if Redis is not connected
//         if (!isConnected()) {
//             return next();
//         }

//         try {
//             const redisClient = getRedisClient();

//             // Generate cache key based on route
//             let cacheKey;
//             if (req.params.id) {
//                 cacheKey = `cache:product:${req.params.id}`;
//             } else {
//                 cacheKey = `cache:products:all`;
//             }

//             // Try to get cached data
//             const cachedData = await redisClient.get(cacheKey);

//             if (cachedData) {
//                 // Cache hit - return cached response
//                 console.log(`✓ Cache HIT: ${cacheKey}`);
//                 return res.json(cachedData);
//             }

//             // Cache miss - continue to controller
//             console.log(`✗ Cache MISS: ${cacheKey}`);

//             // Store the original res.json function
//             const originalJson = res.json.bind(res);

//             // Override res.json to cache the response
//             res.json = function (data) {
//                 // Cache the response data with TTL
//                 redisClient.setex(cacheKey, ttl, JSON.stringify(data))
//                     .then(() => {
//                         console.log(`✓ Cached: ${cacheKey} (TTL: ${ttl}s)`);
//                     })
//                     .catch((err) => {
//                         console.error('Cache set error:', err.message);
//                     });

//                 // Call the original json function
//                 return originalJson(data);
//             };

//             next();
//         } catch (error) {
//             console.error('Cache middleware error:', error.message);
//             // Continue without caching on error
//             next();
//         }
//     };
// };

// module.exports = cacheMiddleware;
