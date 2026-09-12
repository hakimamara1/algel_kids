const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');

// Admin requests send "Authorization: Bearer <token>" (a header, not a cookie:
// the shop and the API are on different sites and Safari blocks third-party cookies)
const requireAdmin = (req, res, next) => {
    if (!env.adminTokenSecret) return next(new HttpError(503, 'Admin login is not configured'));

    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Login required'));

    try {
        req.admin = jwt.verify(token, env.adminTokenSecret, { algorithms: ['HS256'] });
        next();
    } catch {
        next(new HttpError(401, 'Session expired, please log in again'));
    }
};

module.exports = requireAdmin;
