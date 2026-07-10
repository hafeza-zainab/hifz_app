//C:\quran-similarity-app\backend\middleware\errorHandler.js
const { formatError } = require("../utils/responseFormatter");

module.exports = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const detail = err.stack || err.message || err;
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} -`, detail);

    if (err.rollbackError) {
        console.error("Transaction rollback failed:", err.rollbackError.message);
    }

    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === "production" && statusCode === 500
            ? "Internal Server Error"
            : err.message || "Internal Server Error";

    res.status(statusCode).json(formatError(message, statusCode));
};
