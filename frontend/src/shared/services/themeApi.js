/**
 * services/themeApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * UI theme endpoints.
 */

import { authFetch } from './http';

/** Active theme for the current user. */
export const getCurrentTheme = () =>
  authFetch('/themes/current', {}, 'getCurrentTheme');

/** All available themes. */
export const getAllThemes = () =>
  authFetch('/themes/all', {}, 'getAllThemes');

/**
 * Persist a theme selection.
 * @param {string|number} themeId
 */
export const selectTheme = (themeId) =>
  authFetch(
    '/themes/select',
    { method: 'POST', body: JSON.stringify({ theme_id: themeId }) },
    'selectTheme'
  );

/** Check whether a theme preview is active. */
export const checkPreview = () =>
  authFetch('/themes/preview', {}, 'checkPreview');