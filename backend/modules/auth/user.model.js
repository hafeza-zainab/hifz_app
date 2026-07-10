// C:\quran-similarity-app\backend\modules\auth\user.model.js
// Added: updatePassword, findById now returns created_at

const db = require("../../config/database");

const findByEmail = (email) => {
    console.log("findByEmail query executed");
    return db.get(
        "SELECT id, username, email, password, sensoryProfile FROM users WHERE email = ?",
        [email]
    );
};

const findById = (id) => {
    console.log("findById query executed");
    return db.get(
        "SELECT id, username, email, created_at, sensoryProfile FROM users WHERE id = ?",
        [id]
    );
};

const createUser = (username, email, hashedPassword) =>
    db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
    );

// NEW: update hashed password for a user
const updatePassword = (id, hashedPassword) =>
    db.run(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, id]
    );

// NEW: update Sensory Profile for a user
const updateSensoryProfile = (id, sensoryProfile) =>
    db.run(
        "UPDATE users SET sensoryProfile = ? WHERE id = ?",
        [sensoryProfile, id]
    );

// NEW: clear Sensory Profile for a user
const clearSensoryProfile = (id) =>
    db.run(
        "UPDATE users SET sensoryProfile = NULL WHERE id = ?",
        [id]
    );

module.exports = { findByEmail, findById, createUser, updatePassword, updateSensoryProfile, clearSensoryProfile };