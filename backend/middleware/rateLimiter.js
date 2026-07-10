// C:\quran-similarity-app\backend\middleware\rateLimiter.js
// Fix #3: this file was missing. Both auth.routes.js files imported it
// but it did not exist, preventing the server from starting.
//
// Simple in-memory rate limiter — no external dependency required.
// Limits each IP to MAX_REQUESTS per WINDOW_MS on the routes it is applied to.
// For auth routes (login / signup) the defaults are conservative.

const WINDOW_MS    = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '20');              // per IP per window

// Map<ip, { count, resetAt }>
const store = new Map();

// Periodically purge expired entries to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(ip);
    }
}, WINDOW_MS);

/**
 * Express middleware.
 * Applies rate limiting based on req.ip.
 * Returns 429 with a Retry-After header when the limit is exceeded.
 */
const rateLimiter = (req, res, next) => {
    const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + WINDOW_MS };
        store.set(ip, entry);
        return next();
    }

    entry.count += 1;

    if (entry.count > MAX_REQUESTS) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({
            success: false,
            message: `Too many requests. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
        });
    }

    next();
};

module.exports = rateLimiter;