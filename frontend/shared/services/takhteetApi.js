/**
 * services/takhteetApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Takhteet (Jadeed planning/progress) endpoints.
 */

import { authFetch } from './http';

/**
 * Get the goal for a specific month.
 */
export const getTakhteetGoal = (year, month) =>
  authFetch(`/diary/takhteet?year=${year}&month=${month}`, {}, 'getTakhteetGoal');

/**
 * Create a new monthly goal.
 */
export const createTakhteetGoal = (payload) =>
  authFetch(
    '/diary/takhteet',
    { method: 'POST', body: JSON.stringify(payload) },
    'createTakhteetGoal'
  );

/**
 * Update an existing goal.
 */
export const updateTakhteetGoal = (id, payload) =>
  authFetch(
    `/diary/takhteet/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    'updateTakhteetGoal'
  );

/**
 * Get progress for a specific month.
 */
export const getTakhteetProgress = (year, month) =>
  authFetch(`/diary/takhteet/progress?year=${year}&month=${month}`, {}, 'getTakhteetProgress');
