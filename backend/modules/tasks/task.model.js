"use strict";

// ---------------------------------------------------------------------------
// modules/tasks/task.model.js
//
// DEPRECATED — kept for backward compatibility only.
// All new code should import repositories/task.repository.js directly.
//
// BUG FIXED: The original file had updateTaskStatus(taskId, status, userId)
// and updateTaskTitle(taskId, title, userId) but the controller (which now
// calls the repository) correctly passes (taskId, userId, value).
// This file is now aligned with the repository signature so any code that
// still imports task.model.js won't silently swap userId/status.
// ---------------------------------------------------------------------------

const db = require("../../config/database");

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

// FIXED: argument order is now (taskId, userId, status) — was (taskId, status, userId)
const updateTaskStatus = (taskId, userId, status) =>
    db.run(
        "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
        [status, taskId, userId]
    );

// FIXED: argument order is now (taskId, userId, title) — was (taskId, title, userId)
const updateTaskTitle = (taskId, userId, title) =>
    db.run(
        "UPDATE tasks SET title = ? WHERE id = ? AND user_id = ?",
        [title, taskId, userId]
    );

const deleteTask = (taskId, userId) =>
    db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);

module.exports = { addTask, getTasksByDate, updateTaskStatus, updateTaskTitle, deleteTask };