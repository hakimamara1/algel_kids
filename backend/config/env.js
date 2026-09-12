require('dotenv').config({ quiet: true });

const list = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5002,
    mongoUri: process.env.MONGO_URI,
    logLevel: process.env.LOG_LEVEL || 'info',
    adminPassword: process.env.ADMIN_PASSWORD,
    adminTokenSecret: process.env.ADMIN_TOKEN_SECRET,
    allowedOrigins: process.env.ALLOWED_ORIGINS
        ? list(process.env.ALLOWED_ORIGINS)
        : ['https://algel-kids.vercel.app', 'http://localhost:5173', 'http://localhost:4174'],
    loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT) || 5,
    orderRateLimit: Number(process.env.ORDER_RATE_LIMIT) || 10, // per phone number, per hour
    orderIpRateLimit: Number(process.env.ORDER_IP_RATE_LIMIT) || 100, // per connection, per hour
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    },
};

// The server cannot start without these
const REQUIRED = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
// Without these the shop still works, but the admin stays locked
const ADMIN = ['ADMIN_PASSWORD', 'ADMIN_TOKEN_SECRET'];

const missingEnv = () => ({
    required: REQUIRED.filter((key) => !process.env[key]),
    admin: ADMIN.filter((key) => !process.env[key]),
});

module.exports = { env, missingEnv };
