// repositories/task.repository.js
"use strict";

/**
 * task.repository.js
 *
 * All SQL for the tasks table, plus the diary_logs streak date query
 * (which lives here because getStreak is on the task controller).
 * Replaces modules/tasks/task.model.js.
 */

const db = require("../config/database");

// ─── Tasks ────────────────────────────────────────────────────────────────────

const addTask = (userId, title, category, date) =>
    db.run(
        "INSERT INTO tasks (user_id, title, category, status, date) VALUES (?, ?, ?, 'pending', ?)",
        [userId, title, category, date]
    );

const getTasksByDate = (userId, date) =>
    db.all(
        "SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY category ASC, id ASC",
        [userId, date]
    );

/** @returns {Promise<{changes: number}>} */
const updateTaskStatus = (taskId, userId, status) =>
    db.run(
        "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
        [status, taskId, userId]
    );

/** @returns {Promise<{changes: number}>} */
const updateTaskTitle = (taskId, userId, title) =>
    db.run(
        "UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?",
        [title, taskId, userId]
    );

/** @returns {Promise<{changes: number}>} */
const deleteTask = (taskId, userId) =>
    db.run(
        "DELETE FROM tasks WHERE id = ? AND user_id = ?",
        [taskId, userId]
    );

// ─── Streak ───────────────────────────────────────────────────────────────────

/**
 * Distinct log dates (DESC) from diary_logs over the past 60 days.
 * Shape: [{ log_date }]
 * Used by the streak calculation in task.controller.js.
 */
const getStreakDates = (userId) =>
    db.all(
        `SELECT DISTINCT DATE(created_at) AS log_date
         FROM diary_logs
         WHERE user_id = ? AND created_at >= DATE('now', '-60 days')
         ORDER BY log_date DESC`,
        [userId]
    );

module.exports = {
    addTask,
    getTasksByDate,
    updateTaskStatus,
    updateTaskTitle,
    deleteTask,
    getStreakDates,
};