const pino = require('pino');
const { env } = require('../config/env');

// Readable output only in a local terminal; Render gets one JSON line per log
const canPrettyPrint = () => {
    if (!process.stdout.isTTY || env.nodeEnv === 'production') return false;
    try {
        require.resolve('pino-pretty');
        return true;
    } catch {
        return false;
    }
};

const logger = pino({
    level: env.logLevel,
    base: { service: 'angel-kids-api' },
    redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], censor: '[redacted]' },
    ...(canPrettyPrint() && {
        transport: {
            target: 'pino-pretty',
            options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
        },
    }),
});

module.exports = logger;
