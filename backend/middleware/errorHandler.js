const mongoose = require('mongoose');
const multer = require('multer');
const logger = require('../lib/logger');
const { HttpError } = require('../lib/httpError');

const notFound = (req, res, next) => {
    next(new HttpError(404, 'Route not found'));
};

// Turns known errors into a status + a message that is safe to send back
const toHttpError = (err) => {
    if (err instanceof HttpError) return err;
    if (err?.name === 'ZrError') return new HttpError(err.status, `ZR Express: ${err.message}`, err.details);
    if (err?.name === 'ZodError') {
        const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
        return new HttpError(400, 'Invalid data', details);
    }
    if (err instanceof mongoose.Error.CastError) return new HttpError(400, `Invalid ${err.path}`);
    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        return new HttpError(400, 'Invalid data', details);
    }
    if (err instanceof multer.MulterError) {
        return new HttpError(400, err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be smaller than 15 MB' : err.message);
    }
    if (err?.code === 11000) {
        const details = Object.keys(err.keyValue || {}).map((field) => ({ field, message: 'already exists' }));
        return new HttpError(409, 'Duplicate value', details);
    }
    if (err?.type === 'entity.parse.failed') return new HttpError(400, 'Malformed JSON');
    if (err?.type === 'entity.too.large') return new HttpError(413, 'Request body too large');
    return null;
};

// Express 5 forwards errors thrown in async handlers here
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const log = req.log || logger;
    const known = toHttpError(err);
    const status = known?.status || 500;

    // Unexpected errors keep their details in the logs only; known ones (even 501/503) are safe to show
    if (!known) {
        log.error({ err }, 'Request failed');
    } else {
        log.warn({ status, reason: known.message, details: known.details }, 'Request rejected');
    }

    if (res.headersSent) return;
    res.status(status).json({
        message: known ? known.message : 'Server error, please try again',
        ...(known?.details && { details: known.details }),
        requestId: req.id,
    });
};

module.exports = { notFound, errorHandler };
