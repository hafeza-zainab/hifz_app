/**
 * services/diaryApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reading-diary / activity log endpoints.
 */

import { authFetch } from './http';

/**
 * Save a new diary entry.
 * @param {object} payload  Entry fields (varies by type)
 * @param {string} type     Entry type, e.g. "recitation" | "memorisation"
 */
export const addLog = async (payload, type) => {
  const data = await authFetch(
    `/diary/${type}`,
    { method: 'POST', body: JSON.stringify(payload) },
    'addLog'
  );
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DIARY SAVE] type=${type}`, data);
  }
  return data;
};

/**
 * Fetch all entries for a given date (ISO string, e.g. "2024-03-15").
 */
export const getLogs = (date) =>
  authFetch(`/diary/logs?date=${date}`, {}, 'getLogs');

/**
 * Permanently delete an entry.
 */
export const deleteLog = (id) =>
  authFetch(`/diary/log/${id}`, { method: 'DELETE' }, 'deleteLog');

/**
 * Update an existing entry.
 * @param {string|number} id
 * @param {object} data  Fields to update
 */
export const updateLog = (id, data) =>
  authFetch(
    `/diary/log/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    'updateLog'
  );