//C:\quran-similarity-app\backend\modules\analytics\analytics.repository.js
"use strict";

const db = require("../config/database");

/**
 * Fetch daily score aggregates for the trend chart.
 * Returns one row per calendar day that has at least one diary log.
 * The controller is responsible for filling date gaps with nulls.
 *
 * @param {number} userId
 * @param {string} startDate  ISO date string "YYYY-MM-DD"
 * @param {string} endDate    ISO date string "YYYY-MM-DD"
 * @returns {Promise<Array<{raw_date: string, total_score: number, total_entries: number}>>}
 */
const getTrendData = (userId, startDate, endDate) =>
    db.all(
        `SELECT DATE(created_at) AS raw_date,
                SUM(score)       AS total_score,
                COUNT(id)        AS total_entries
         FROM diary_logs
         WHERE user_id = ?
           AND DATE(created_at) >= ?
           AND DATE(created_at) <= ?
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [userId, startDate, endDate]
    );

/**
 * Fetch detail rows for the deep-dive chart filtered by type, date range,
 * and optionally by juz (for murajah / tasmee only).
 *
 * @param {number} userId
 * @param {string} dbType     Exact value as stored in diary_logs.type
 * @param {string} interval   SQLite date modifier e.g. '-7 days', '-1 month'
 * @param {string|null} juz   Juz number as string, or null/undefined to skip filter
 * @returns {Promise<Array>}
 */
const getDeepDiveData = (userId, dbType, interval, juz) => {
    let sql = `
        SELECT id, DATE(created_at) AS log_date, range_from, range_to, score
        FROM diary_logs
        WHERE user_id = ?
          AND type = ?
          AND created_at >= DATE('now', ?)`;

    const params = [userId, dbType, interval];

    if ((dbType === "murajah" || dbType === "tasmee") && juz) {
        sql += " AND range_from LIKE ?";
        params.push(`Juz ${juz}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT 500";

    return db.all(sql, params);
};

/**
 * Fetch all heatmap score rows for a user.
 * Returns sipara (juz), quran_page, and score for every stored entry.
 *
 * @param {number} userId
 * @returns {Promise<Array<{juz: number, page: number, score: number}>>}
 */
const getHeatmapScores = (userId) =>
    db.all(
        `SELECT sipara AS juz, quran_page AS page, score
         FROM heatmap_scores
         WHERE user_id = ?
         ORDER BY sipara ASC, page_number ASC`,
        [userId]
    );

/**
 * Upsert a single heatmap score row.
 * On conflict (same user + sipara + page_number) updates score and timestamp.
 *
 * @param {number} userId
 * @param {number} sipara
 * @param {number} page_number
 * @param {number} quran_page
 * @param {number} score
 */
const upsertHeatmapScore = (userId, sipara, page_number, quran_page, score) =>
    db.run(
        `INSERT INTO heatmap_scores (user_id, sipara, page_number, quran_page, score)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, sipara, page_number)
         DO UPDATE SET score = excluded.score, created_at = CURRENT_TIMESTAMP`,
        [userId, sipara, page_number, quran_page, score]
    );

module.exports = {
    getTrendData,
    getDeepDiveData,
    getHeatmapScores,
    upsertHeatmapScore,
};