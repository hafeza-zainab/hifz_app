//C:\quran-similarity-app\backend\repositories\auth.repository.js
"use strict";

/**
 * auth.repository.js
 *
 * All SQL for the users table.
 * Replaces modules/auth/user.model.js — auth controller imports this instead.
 * user.model.js should be deleted once all callers are updated.
 */

const db = require("../config/database");

/**
 * Find a user by email.
 * Returns the password hash — for auth comparisons only; never send to client.
 */
const findByEmail = (email) => {
    console.log("findByEmail query executed");
    return db.get(
        "SELECT id, username, email, password, sensoryProfile FROM users WHERE email = ?",
        [email]
    );
};

/**
 * Find a user by username.
 * Returns the password hash — for auth comparisons only; never send to client.
 */
const findByUsername = (username) => {
    console.log("findByUsername query executed");
    return db.get(
        "SELECT id, username, email, password, sensoryProfile FROM users WHERE username = ?",
        [username]
    );
};

/**
 * Find a user by id.
 * Deliberately excludes password — safe to include in API responses.
 */
const findById = (id) => {
    console.log("findById query executed");
    return db.get(
        "SELECT id, username, email, created_at, sensoryProfile FROM users WHERE id = ?",
        [id]
    );
};

/**
 * Insert a new user row.
 * Throws on UNIQUE constraint violations for email or username —
 * callers must inspect err.message to surface friendly 409 responses.
 */
const createUser = (username, email, hashedPassword) =>
    db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
    );

/** Replace the stored password hash for a user (used by changePassword). */
const updatePassword = (id, hashedPassword) =>
    db.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, id]
    );

/** Update the Sensory Profile for a user. */
const updateSensoryProfile = (id, sensoryProfile) =>
    db.run(
        "UPDATE users SET sensoryProfile = ? WHERE id = ?",
        [sensoryProfile, id]
    );

module.exports = { findByEmail, findByUsername, findById, createUser, updatePassword, updateSensoryProfile };