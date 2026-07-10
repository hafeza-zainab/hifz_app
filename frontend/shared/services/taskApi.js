/**
 * services/taskApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily task / streak endpoints.
 */

import { authFetch } from './http';

/**
 * Current streak (non-critical — returns 0 on failure instead of erroring).
 */
export const getStreak = async () => {
  const res = await authFetch('/tasks/streak', {}, 'getStreak');
  if (res?.success === false) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[getStreak]', res.message);
    }
    return { success: true, data: { streak: 0 } };
  }
  return res;
};

/** @param {string} date  ISO date string, e.g. "2024-03-15" */
export const getTasks = (date) =>
  authFetch(`/tasks?date=${date}`, {}, 'getTasks');

/** @param {{ title: string, date: string }} data */
export const addTask = (data) =>
  authFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }, 'addTask');

/**
 * @param {string|number} id
 * @param {'pending'|'done'|'skipped'} status
 */
export const updateTask = (id, status) =>
  authFetch(
    `/tasks/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    'updateTask'
  );

/** @param {string|number} id */
export const editTaskTitle = (id, title) =>
  authFetch(
    `/tasks/${id}`,
    { method: 'PUT', body: JSON.stringify({ title }) },
    'editTaskTitle'
  );

/** @param {string|number} id */
export const deleteTask = (id) =>
  authFetch(`/tasks/${id}`, { method: 'DELETE' }, 'deleteTask');