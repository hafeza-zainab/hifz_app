// repositories/coach.repository.js
"use strict";

/**
 * coach.repository.js
 *
 * All SQL for:
 *   • coach_messages  (daily usage tracking)
 *   • chat_sessions
 *   • chat_messages
 *
 * Replaces inline db calls in modules/coach/chat.routes.js.
 */

const db = require("../config/database");

// ─── Daily usage ──────────────────────────────────────────────────────────────

/** Count messages sent by a user today (for rate-limiting). */
const getDailyCount = async (userId) => {
    const today = new Date().toISOString().split("T")[0];
    const row   = await db.get(
        `SELECT COUNT(*) AS count
         FROM coach_messages
         WHERE user_id = ? AND DATE(created_at) = ?`,
        [userId, today]
    );
    return row?.count ?? 0;
};

/** Record one coach message usage event. */
const recordUsage = (userId) =>
    db.run("INSERT INTO coach_messages (user_id) VALUES (?)", [userId]);

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** 50 most-recently-updated sessions for a user. */
const getSessions = (userId) =>
    db.all(
        `SELECT id, title, created_at, updated_at
         FROM chat_sessions
         WHERE user_id = ?
         ORDER BY updated_at DESC
         LIMIT 50`,
        [userId]
    );

/**
 * Create a session and return the full row.
 * @returns {Promise<object>} { id, title, created_at, updated_at }
 */
const createSession = async (userId, title) => {
    const result = await db.run(
        "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
        [userId, (title || "New Session").trim().slice(0, 100)]
    );
    return db.get(
        "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?",
        [result.id]
    );
};

/**
 * Find a session by id scoped to a user.
 * Returns undefined when not found or wrong owner.
 */
const getSessionByIdAndUser = (sessionId, userId) =>
    db.get(
        "SELECT id, title FROM chat_sessions WHERE id = ? AND user_id = ?",
        [sessionId, userId]
    );

/**
 * Rename a session.
 * @returns {Promise<number>} changes (0 = not found / wrong user)
 */
const renameSession = async (sessionId, userId, title) => {
    const result = await db.run(
        "UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [title.trim().slice(0, 100), sessionId, userId]
    );
    return result.changes;
};

/**
 * Delete a session (cascades to chat_messages).
 * @returns {Promise<number>} changes
 */
const deleteSession = async (sessionId, userId) => {
    const result = await db.run(
        "DELETE FROM chat_sessions WHERE id = ? AND user_id = ?",
        [sessionId, userId]
    );
    return result.changes;
};

/** Update the updated_at timestamp on a session. */
const touchSession = (sessionId) =>
    db.run(
        "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [sessionId]
    );

/**
 * Auto-title a session from the text of its first user message.
 * No-op if the session already has more than one user message.
 */
const autoTitleSession = async (sessionId, content) => {
    const row = await db.get(
        "SELECT COUNT(*) AS count FROM chat_messages WHERE session_id = ? AND role = 'user'",
        [sessionId]
    );
    if (row.count === 1) {
        const autoTitle = content.trim().slice(0, 50) + (content.length > 50 ? "…" : "");
        await db.run(
            "UPDATE chat_sessions SET title = ? WHERE id = ?",
            [autoTitle, sessionId]
        );
    }
};

// ─── Messages ─────────────────────────────────────────────────────────────────

/** All messages in a session, oldest first. */
const getMessages = (sessionId) =>
    db.all(
        `SELECT id, role, content, created_at
         FROM chat_messages
         WHERE session_id = ?
         ORDER BY created_at ASC`,
        [sessionId]
    );

/**
 * Append a message to a session.
 * @returns {Promise<number>} the new message id
 */
const addMessage = async (sessionId, role, content) => {
    const result = await db.run(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
        [sessionId, role, content]
    );
    return result.id;
};

module.exports = {
    getDailyCount,
    recordUsage,
    getSessions,
    createSession,
    getSessionByIdAndUser,
    renameSession,
    deleteSession,
    touchSession,
    autoTitleSession,
    getMessages,
    addMessage,
};