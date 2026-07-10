/**
 * Authentication Controller
 * Purpose: Handles user registration, login, and token generation
 * Features: Password hashing, JWT signing, user validation
 */
"use strict";

const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const authRepo = require("../../repositories/auth.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 12);
        await authRepo.createUser(username.trim(), email.toLowerCase().trim(), hashed);
        res.status(201).json(formatSuccess(null, "Account created successfully."));
    } catch (err) {
        if (err.message?.includes("UNIQUE constraint failed")) {
            if (err.message.includes("users.email"))
                return res.status(409).json(formatError("An account with this email already exists.", 409));
            if (err.message.includes("users.username"))
                return res.status(409).json(formatError("This username is already taken.", 409));
        }
        next(err);
    }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await authRepo.findByUsername(username.trim());

        // Always run bcrypt — prevents timing-based user enumeration.
        const DUMMY_HASH = "$2a$12$dummyhashfortimingsafety000000000000000000000000";
        const match = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

        if (!user || !match)
            return res.status(401).json(formatError("Invalid username or password.", 401));

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );
        res.status(200).json(formatSuccess({ token, username: user.username }, "Login successful."));
    } catch (err) { next(err); }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
    try {
        const user = await authRepo.findById(req.user.id);
        if (!user) return res.status(404).json(formatError("User not found.", 404));
        res.status(200).json(formatSuccess({
            id:         user.id,
            username:   user.username,
            email:      user.email,
            created_at: user.created_at,
            sensoryProfile: user.sensoryProfile,
        }));
    } catch (err) { next(err); }
};

// ─── PATCH /api/auth/password ─────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword)
            return res.status(400).json(formatError("currentPassword and newPassword are required."));
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword))
            return res.status(400).json(formatError(
                "newPassword must be at least 8 characters with 1 uppercase letter and 1 number."
            ));

        // findById gives us the email; findByEmail gives us the hash.
        const profile = await authRepo.findById(req.user.id);
        if (!profile) return res.status(404).json(formatError("User not found.", 404));

        const userWithHash = await authRepo.findByEmail(profile.email);
        const match = await bcrypt.compare(currentPassword, userWithHash.password);
        if (!match) return res.status(401).json(formatError("Current password is incorrect.", 401));

        const hashed = await bcrypt.hash(newPassword, 12);
        await authRepo.updatePassword(req.user.id, hashed);
        res.status(200).json(formatSuccess(null, "Password updated successfully."));
    } catch (err) { next(err); }
};

// ─── PATCH /api/auth/sensory-profile ──────────────────────────────────────────────
exports.updateSensoryProfile = async (req, res, next) => {
    try {
        const { sensoryProfile } = req.body;
        console.log("Sensory Profile received:", sensoryProfile);

        await authRepo.updateSensoryProfile(req.user.id, sensoryProfile);
        console.log("Sensory Profile saved:", sensoryProfile);

        res.status(200).json(formatSuccess({ sensoryProfile }, "Profile saved successfully."));
    } catch (err) { next(err); }
};

// ─── PATCH /api/auth/walkthrough ───────────────────────────────────────────────
exports.markWalkthroughSeen = async (req, res, next) => {
    try {
        await authRepo.updateWalkthroughSeen(req.user.id);
        res.status(200).json(formatSuccess(null, "Walkthrough marked as seen."));
    } catch (err) { next(err); }
};