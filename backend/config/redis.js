const { Redis } = require('@upstash/redis');

// Upstash Redis client configuration
let redisClient = null;

const createRedisClient = () => {
    if (redisClient) {
        return redisClient;
    }

    try {
        // Use REST URL and token from environment
        const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.warn('⚠ Redis credentials not found. Caching disabled.');
            return null;
        }

        redisClient = new Redis({
            url: url.replace('rediss://', 'https://').replace('redis://', 'http://').split('@')[1]?.split(':')[0]
                ? `https://${url.split('@')[1].split(':')[0]}`
                : url,
            token: token,
        });

        console.log('✓ Redis client created (Upstash REST API)');
        return redisClient;
    } catch (error) {
        console.error('Failed to create Redis client:', error.message);
        return null;
    }
};

// Get the singleton Redis client
const getRedisClient = () => {
    if (!redisClient) {
        return createRedisClient();
    }
    return redisClient;
};

// Connect to Redis (no-op for Upstash REST API)
const connect = async () => {
    try {
        const client = getRedisClient();
        if (client) {
            // Test connection with a ping
            await client.ping();
            console.log('✓ Redis: Connected successfully (Upstash)');
        }
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        console.log('Application will continue without caching');
    }
};

// Disconnect from Redis (no-op for Upstash REST API)
const disconnect = async () => {
    // Upstash REST API doesn't require explicit disconnect
    console.log('Redis connection closed');
    redisClient = null;
};

// Check if Redis is available
const isConnected = () => {
    return redisClient !== null;
};

module.exports = {
    getRedisClient,
    connect,
    disconnect,
    isConnected,
};
