// repositories/heatmap.repository.js
"use strict";

/**
 * heatmap.repository.js
 *
 * All SQL for the heatmap_scores table.
 * Used by analytics.controller.js.
 */

const db = require("../config/database");

/**
 * Return all heatmap score rows for a user.
 * Shape: [{ juz, page, score }]
 */
const getScoresByUser = (userId) =>
    db.all(
        `SELECT sipara     AS juz,
                quran_page AS page,
                score
         FROM heatmap_scores
         WHERE user_id = ?
         ORDER BY sipara ASC, page_number ASC`,
        [userId]
    );

/**
 * Upsert a single heatmap score.
 * Conflict key: (user_id, sipara, page_number).
 */
const upsertScore = (userId, sipara, pageNumber, quranPage, score) =>
    db.run(
        `INSERT INTO heatmap_scores (user_id, sipara, page_number, quran_page, score)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, sipara, page_number)
         DO UPDATE SET score = excluded.score, created_at = CURRENT_TIMESTAMP`,
        [userId, sipara, pageNumber, quranPage, score]
    );

module.exports = { getScoresByUser, upsertScore };