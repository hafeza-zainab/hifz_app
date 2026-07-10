"use strict";

/**
 * repositories/diary.repository.js
 *
 * Single source of truth for all diary_logs SQL.
 *
 * Used by:
 *   - modules/diary/murajah/murajah.service.js
 *   - modules/diary/tasmee/tasmee.service.js
 *   - modules/diary/ikhtebar/ikhtebar.service.js
 *   - modules/diary/jadeed/jadeed.service.js
 *   - modules/diary/juzzHali/juzzHali.service.js
 *   - modules/diary/log/log.controller.js
 *   - modules/diary/diary.routes.js
 *   - modules/analytics/analytics.controller.js
 *
 * The shim at modules/diary/diary.repository.js re-exports this file
 * so that existing service requires continue to work unchanged.
 */

const db = require("../config/database");

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Insert a single diary log entry.
 *
 * @param {number} userId
 * @param {string} type        One of: murajah | tasmee | ikhtebar | jadeed | Juz_Hali
 * @param {string} rangeFrom
 * @param {string} rangeTo
 * @param {number} score       0–10
 * @param {string} date        ISO date string "YYYY-MM-DD"
 * @param {number} startPage   Optional: global Quran page number (for jadeed)
 * @param {number} finishPage  Optional: global Quran page number (for jadeed)
 * @param {number} startJuz    Optional: juz number (for jadeed)
 * @param {number} finishJuz   Optional: juz number (for jadeed)
 * @returns {Promise<{id: number, changes: number}>}
 */
const createLog = (userId, type, rangeFrom, rangeTo, score, date, startPage = null, finishPage = null, startJuz = null, finishJuz = null) => {
    const sql = startPage !== null
        ? `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, created_at, start_page, finish_page, start_juz, finish_juz)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`;
    
    const params = startPage !== null
        ? [userId, type, rangeFrom, rangeTo, score, `${date}T00:00:00`, startPage, finishPage, startJuz, finishJuz]
        : [userId, type, rangeFrom, rangeTo, score, `${date}T00:00:00`];
    
    return db.run(sql, params);
};

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch all logs for a user on a given date, optionally filtered by type.
 *
 * @param {number}      userId
 * @param {string}      date   ISO date "YYYY-MM-DD"
 * @param {string|null} type   Optional diary type filter
 * @returns {Promise<Array>}
 */
const getLogsByDate = (userId, date, type = null) => {
    if (type) {
        return db.all(
            `SELECT id, type, range_from, range_to, score, created_at
             FROM diary_logs
             WHERE user_id = ? AND DATE(created_at) = ? AND type = ?
             ORDER BY created_at ASC`,
            [userId, date, type]
        );
    }
    return db.all(
        `SELECT id, type, range_from, range_to, score, created_at
         FROM diary_logs
         WHERE user_id = ? AND DATE(created_at) = ?
         ORDER BY created_at ASC`,
        [userId, date]
    );
};

/**
 * Most recent N diary entries for a user.
 *
 * @param {number} userId
 * @param {number} limit  Max 100
 * @returns {Promise<Array>}
 */
const getRecentLogs = (userId, limit = 30) =>
    db.all(
        `SELECT id, type, range_from, range_to, score, created_at
         FROM diary_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [userId, Math.min(limit, 100)]
    );

// ─── Updates / Deletes ────────────────────────────────────────────────────────

/**
 * Update the score of a log entry (owned by userId).
 *
 * @returns {Promise<{changes: number}>}
 */
const updateLog = (logId, userId, score) =>
    db.run(
        "UPDATE diary_logs SET score = ? WHERE id = ? AND user_id = ?",
        [score, logId, userId]
    );

/**
 * Delete a log entry (owned by userId).
 *
 * @returns {Promise<{changes: number}>}
 */
const deleteLog = (logId, userId) =>
    db.run(
        "DELETE FROM diary_logs WHERE id = ? AND user_id = ?",
        [logId, userId]
    );

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Daily score aggregates for the trend chart.
 * Returns one row per calendar day that has at least one diary log.
 *
 * @param {number} userId
 * @param {string} startDate  "YYYY-MM-DD"
 * @param {string} endDate    "YYYY-MM-DD"
 * @returns {Promise<Array<{raw_date: string, total_score: number, total_entries: number}>>}
 */
const getTrendRows = (userId, startDate, endDate) =>
    db.all(
        `SELECT DATE(created_at)  AS raw_date,
                SUM(score)        AS total_score,
                COUNT(id)         AS total_entries
         FROM diary_logs
         WHERE user_id = ?
           AND DATE(created_at) >= ?
           AND DATE(created_at) <= ?
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [userId, startDate, endDate]
    );

/**
 * Detail rows for the deep-dive chart.
 *
 * @param {number}      userId
 * @param {string}      dbType    Exact value as stored in diary_logs.type
 * @param {string}      interval  SQLite date modifier e.g. "-7 days", "-1 month"
 * @param {string|null} juz       Juz number as string, or null to skip filter
 * @returns {Promise<Array>}
 */
const getDeepDiveRows = (userId, dbType, interval, juz) => {
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
 * Per-page average scores for the heatmap widget.
 * Groups murajah logs by page reference in range_from.
 *
 * Shape: [{ page, juz, score }]
 *
 * NOTE: This is the diary-based heatmap aggregate (different from the
 * explicit heatmap_scores table managed by heatmap.repository.js).
 */
const getHeatmapAggregates = (userId) =>
    db.all(
        `SELECT range_from AS page_ref,
                AVG(score) AS score,
                COUNT(*)   AS entry_count
         FROM diary_logs
         WHERE user_id = ?
           AND type = 'murajah'
           AND range_from LIKE '%Page%'
         GROUP BY range_from
         ORDER BY range_from ASC`,
        [userId]
    );

/**
 * Get all diary logs for a user (for time management analysis).
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
const getUserDiary = (userId) =>
    db.all(
        `SELECT id, type, range_from, range_to, score, created_at
         FROM diary_logs
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

module.exports = {
    createLog,
    getLogsByDate,
    getRecentLogs,
    updateLog,
    deleteLog,
    getTrendRows,
    getDeepDiveRows,
    getHeatmapAggregates,
    getUserDiary,
};