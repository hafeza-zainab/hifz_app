"use strict";

/**
 * repositories/takhteetGoal.repository.js
 *
 * All SQL for the takhteet_goals table.
 * Used by the Takhteet feature for monthly Jadeed memorization goals.
 */

const db = require("../config/database");

/**
 * Get a user's goal for a specific month.
 *
 * @param {number} userId
 * @param {number} year
 * @param {number} month  1-12
 * @returns {Promise<Object|null>}
 */
const getGoalForMonth = (userId, year, month) =>
    db.get(
        `SELECT * FROM takhteet_goals
         WHERE user_id = ? AND year = ? AND month = ?`,
        [userId, year, month]
    );

/**
 * Get a goal by ID (for ownership verification).
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getGoalById = (id) =>
    db.get(
        `SELECT * FROM takhteet_goals WHERE id = ?`,
        [id]
    );

/**
 * Create a new monthly goal.
 *
 * @param {number} userId
 * @param {number} year
 * @param {number} month
 * @param {number} startJuz
 * @param {number} startPage
 * @param {number} targetJuz
 * @param {number} targetPage
 * @param {number|null} week1Juz
 * @param {number|null} week1Page
 * @param {number|null} week2Juz
 * @param {number|null} week2Page
 * @param {number|null} week3Juz
 * @param {number|null} week3Page
 * @param {number|null} week4Juz
 * @param {number|null} week4Page
 * @returns {Promise<{id: number, changes: number}>}
 */
const createGoal = (
    userId, year, month,
    startJuz, startPage, targetJuz, targetPage,
    week1Juz, week1Page, week2Juz, week2Page,
    week3Juz, week3Page, week4Juz, week4Page,
    isLate, trackingStartDate
) =>
    db.run(
        `INSERT INTO takhteet_goals (
            user_id, year, month,
            start_juz, start_page, target_juz, target_page,
            week1_juz, week1_page, week2_juz, week2_page,
            week3_juz, week3_page, week4_juz, week4_page,
            goal_set_date, is_late, tracking_start_date
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId, year, month,
            startJuz, startPage, targetJuz, targetPage,
            week1Juz, week1Page, week2Juz, week2Page,
            week3Juz, week3Page, week4Juz, week4Page,
            new Date().toISOString(), // goal_set_date
            isLate ? 1 : 0, // is_late
            trackingStartDate // tracking_start_date
        ]
    );

/**
 * Update an existing goal.
 *
 * @param {number} id
 * @param {number} startJuz
 * @param {number} startPage
 * @param {number} targetJuz
 * @param {number} targetPage
 * @param {number|null} week1Juz
 * @param {number|null} week1Page
 * @param {number|null} week2Juz
 * @param {number|null} week2Page
 * @param {number|null} week3Juz
 * @param {number|null} week3Page
 * @param {number|null} week4Juz
 * @param {number|null} week4Page
 * @returns {Promise<{id: number, changes: number}>}
 */
const updateGoal = (
    id,
    startJuz, startPage, targetJuz, targetPage,
    week1Juz, week1Page, week2Juz, week2Page,
    week3Juz, week3Page, week4Juz, week4Page
) =>
    db.run(
        `UPDATE takhteet_goals
         SET start_juz = ?, start_page = ?, target_juz = ?, target_page = ?,
             week1_juz = ?, week1_page = ?, week2_juz = ?, week2_page = ?,
             week3_juz = ?, week3_page = ?, week4_juz = ?, week4_page = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [
            startJuz, startPage, targetJuz, targetPage,
            week1Juz, week1Page, week2Juz, week2Page,
            week3Juz, week3Page, week4Juz, week4Page,
            id
        ]
    );

/**
 * Get the most recent Jadeed log with structured data for a user.
 * Used to determine current position for progress calculation.
 *
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
const getLatestJadeedLog = (userId) =>
    db.get(
        `SELECT finish_page, finish_juz
         FROM diary_logs
         WHERE user_id = ? AND type = 'jadeed' AND start_page IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );

module.exports = {
    getGoalForMonth,
    getGoalById,
    createGoal,
    updateGoal,
    getLatestJadeedLog,
};
