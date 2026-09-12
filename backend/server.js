const { env, missingEnv } = require('./config/env');
const logger = require('./lib/logger');

process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
});

const missing = missingEnv();
if (missing.required.length) {
    logger.fatal({ missing: missing.required }, 'Missing required environment variables');
    process.exit(1);
}
if (missing.admin.length) {
    logger.warn({ missing: missing.admin }, 'Admin login is disabled until these environment variables are set');
}

const mongoose = require('mongoose');
const app = require('./app');

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));

const start = async () => {
    // Connect first, so the server never accepts requests it cannot answer
    await mongoose.connect(env.mongoUri);
    logger.info('MongoDB connected');

    const server = app.listen(env.port, () => {
        logger.info({ port: env.port, env: env.nodeEnv }, 'Server listening');
    });

    // Render sends SIGTERM on every deploy: finish in-flight requests, then close the DB
    const shutdown = (signal) => {
        logger.info({ signal }, 'Shutting down');
        server.close(async () => {
            await mongoose.disconnect();
            logger.info('Shutdown complete');
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
    logger.fatal({ err }, 'Startup failed');
    process.exit(1);
});
