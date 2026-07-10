//C:\quran-similarity-app\backend\repositories\theme.repository.js
"use strict";

/**
 * theme.repository.js
 *
 * All SQL for the user_themes table.
 * Consolidates SQL from both theme.model.js (simple queries) and
 * theme.controller.js (the transaction in `select`).
 */

const db = require("../config/database");

/** Valid theme identifiers — single source of truth, used by the controller. */
const VALID_THEMES = new Set(["sky"]);

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Return the currently active theme row for a user, or undefined.
 * Guards against legacy rows from removed themes by requiring theme_id = 'sky'.
 */
const getActive = (userId) =>
    db.get(
        "SELECT * FROM user_themes WHERE user_id = ? AND is_active = 1 AND theme_id = 'sky'",
        [userId]
    );

/** Return all theme rows for a user (sky only). */
const getAll = (userId) =>
    db.all(
        `SELECT theme_id, streak, max_streak, frozen_streak,
                last_log_date, is_active, created_at
         FROM user_themes WHERE user_id = ? AND theme_id = 'sky'`,
        [userId]
    );

// ─── Streak increment ─────────────────────────────────────────────────────────

/**
 * Increment the streak for the user's active theme.
 * Rules:
 *   • Already logged today → no-op, returns current row.
 *   • Logged yesterday     → streak + 1.
 *   • Gap in logs          → reset to 1.
 *   • No active theme      → returns null (nothing to update).
 *
 * @returns {Promise<object|null>} updated theme row, or null if no active theme
 */
const incrementStreak = async (userId) => {
    const active = await getActive(userId);
    if (!active) return null;

    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    if (active.last_log_date === today) return active; // already counted

    const newStreak = active.last_log_date === yesterday ? active.streak + 1 : 1;
    const newMax    = Math.max(active.max_streak, newStreak);

    await db.run(
        `UPDATE user_themes
         SET streak = ?, max_streak = ?, last_log_date = ?
         WHERE user_id = ? AND is_active = 1 AND theme_id = 'sky'`,
        [newStreak, newMax, today, userId]
    );

    return { ...active, streak: newStreak, max_streak: newMax };
};

// ─── Theme switching (transaction) ────────────────────────────────────────────

/**
 * Switch the active theme for a user.
 *
 * Steps (all inside a transaction):
 *  1. Freeze the current active theme's streak.
 *  2a. If the target theme already exists → restore its frozen streak.
 *  2b. Otherwise → INSERT a new row.
 *
 * Sets last_log_date to yesterday so that the very next diary entry
 * immediately grants a streak-day rather than making the user wait two days.
 *
 * @param {number} userId
 * @param {string} themeId  must be in VALID_THEMES (i.e. "sky")
 */
const switchTheme = async (userId, themeId) => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    await db.transaction(async (tx) => {
        // 1. Freeze current active theme
        const active = await getActive(userId);
        if (active) {
            await tx.run(
                `UPDATE user_themes
                 SET is_active = 0, frozen_streak = ?
                 WHERE user_id = ? AND theme_id = ?`,
                [active.streak, userId, active.theme_id]
            );
        }

        // 2. Activate target theme
        const existing = await db.get(
            "SELECT frozen_streak FROM user_themes WHERE user_id = ? AND theme_id = ?",
            [userId, themeId]
        );

        if (existing) {
            await tx.run(
                `UPDATE user_themes
                 SET is_active = 1, streak = ?, last_log_date = ?
                 WHERE user_id = ? AND theme_id = ?`,
                [existing.frozen_streak ?? 0, yesterday, userId, themeId]
            );
        } else {
            await tx.run(
                `INSERT INTO user_themes
                     (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active)
                 VALUES (?, ?, 0, 0, 0, ?, 1)`,
                [userId, themeId, yesterday]
            );
        }
    });
};

module.exports = { VALID_THEMES, getActive, getAll, incrementStreak, switchTheme };