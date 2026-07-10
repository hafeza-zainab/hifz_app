//C:\quran-similarity-app\backend\repositories\flashcard.repository.js
"use strict";

/**
 * flashcard.repository.js
 *
 * All SQL for flashcard_sets and flashcard_cards tables.
 * Extracted from modules/coach/flashcard.routes.js, which previously
 * embedded db calls directly inside route handlers.
 */

const db = require("../config/database");

// ─── Sets ─────────────────────────────────────────────────────────────────────

/** List all sets for a user, newest first. */
const getSetsByUser = (userId) =>
    db.all(
        `SELECT id, name, created_at
         FROM flashcard_sets
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

/**
 * Create a new flashcard set.
 * @returns {Promise<number>} the new set id
 */
const createSet = async (userId, name) => {
    const result = await db.run(
        "INSERT INTO flashcard_sets (user_id, name) VALUES (?, ?)",
        [userId, name.trim()]
    );
    return result.id;
};

/**
 * Find a set by id scoped to a user.
 * Returns undefined when the set does not exist or belongs to another user.
 */
const getSetByIdAndUser = (setId, userId) =>
    db.get(
        "SELECT id, name FROM flashcard_sets WHERE id = ? AND user_id = ?",
        [setId, userId]
    );

/**
 * Rename a set.
 * @returns {Promise<number>} SQLite changes count (0 = not found / wrong user)
 */
const renameSet = async (setId, userId, name) => {
    const result = await db.run(
        "UPDATE flashcard_sets SET name = ? WHERE id = ? AND user_id = ?",
        [name.trim(), setId, userId]
    );
    return result.changes;
};

/**
 * Delete a set (cascade removes its cards via FK).
 * @returns {Promise<number>} SQLite changes count
 */
const deleteSet = async (setId, userId) => {
    const result = await db.run(
        "DELETE FROM flashcard_sets WHERE id = ? AND user_id = ?",
        [setId, userId]
    );
    return result.changes;
};

// ─── Cards ────────────────────────────────────────────────────────────────────

/** Return all cards in a set in insertion order. */
const getCardsBySet = (setId) =>
    db.all(
        "SELECT id, front, back FROM flashcard_cards WHERE set_id = ? ORDER BY id ASC",
        [setId]
    );

/**
 * Bulk-insert cards for a set using a single parameterised statement.
 *
 * @param {number}                             setId
 * @param {{ front: string, back: string }[]}  cards  non-empty; caller validates
 */
const bulkInsertCards = (setId, cards) => {
    const placeholders = cards.map(() => "(?, ?, ?)").join(", ");
    const values       = cards.flatMap((c) => [setId, c.front, c.back]);
    return db.run(
        `INSERT INTO flashcard_cards (set_id, front, back) VALUES ${placeholders}`,
        values
    );
};

module.exports = {
    getSetsByUser,
    createSet,
    getSetByIdAndUser,
    renameSet,
    deleteSet,
    getCardsBySet,
    bulkInsertCards,
};