//C:\quran-similarity-app\backend\middleware\authMiddleware.js
const jwt = require("jsonwebtoken");
const { formatError } = require("../utils/responseFormatter");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is not set.");
    process.exit(1);
}

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json(formatError("No token provided.", 401));
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        const message =
            error.name === "TokenExpiredError"
                ? "Token has expired."
                : "Invalid token.";
        return res.status(401).json(formatError(message, 401));
    }
};

module.exports = authMiddleware;
