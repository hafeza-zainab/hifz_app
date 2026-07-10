"use strict";

/**
 * repositories/scheduler/scheduleTemplates.repository.js
 *
 * All SQL for the schedule_templates table.
 * Used by the Schedule Templates feature for saving and reusing event templates.
 */

const db = require("../../config/database");

/**
 * Get all templates for a specific user.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
const getTemplatesForUser = (userId) =>
    db.all(
        `SELECT * FROM schedule_templates
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
    );

/**
 * Get a template by ID (for ownership verification).
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getTemplateById = (id) =>
    db.get(
        `SELECT * FROM schedule_templates WHERE id = ?`,
        [id]
    );

/**
 * Create a new template for a user.
 *
 * @param {number} userId
 * @param {string} name
 * @param {string} events - JSON string of events array
 * @returns {Promise<{id: number, changes: number}>}
 */
const createTemplate = (userId, name, events) =>
    db.run(
        `INSERT INTO schedule_templates (user_id, name, events)
         VALUES (?, ?, ?)`,
        [userId, name, JSON.stringify(events)]
    );

/**
 * Delete a template (owner-only).
 *
 * @param {number} id
 * @param {number} userId - for ownership verification
 * @returns {Promise<{id: number, changes: number}>}
 */
const deleteTemplate = (id, userId) =>
    db.run(
        `DELETE FROM schedule_templates
         WHERE id = ? AND user_id = ?`,
        [id, userId]
    );

module.exports = {
    getTemplatesForUser,
    getTemplateById,
    createTemplate,
    deleteTemplate,
};
