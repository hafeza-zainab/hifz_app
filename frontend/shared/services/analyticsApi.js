/**
 * services/analyticsApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Analytics endpoints (trend, deep-dive, heatmap).
 */

import { authFetch } from './http';

/**
 * Recitation trend data.
 *
 * Pass either a named `range` ('7d' | '1m' | '3m' | '1y') **or**
 * explicit `customStart` / `customEnd` ISO date strings.
 *
 * @param {string} [range='7d']
 * @param {string} [customStart]
 * @param {string} [customEnd]
 */
export const getTrend = (range, customStart, customEnd) => {
  const params = new URLSearchParams();
  if (customStart && customEnd) {
    params.set('start', customStart);
    params.set('end', customEnd);
  } else {
    params.set('range', range || '7d');
  }
  return authFetch(`/analytics/trend?${params}`, {}, 'getTrend');
};

/**
 * Deep-dive breakdown by type / juz.
 *
 * @param {'recitation'|'memorisation'} type
 * @param {number} [juz]
 * @param {string} [range]
 */
export const getDeepDive = (type, juz, range) => {
  const params = new URLSearchParams({ type });
  if (juz)   params.set('juz', juz);
  if (range) params.set('range', range);
  return authFetch(`/analytics/deep-dive?${params}`, {}, 'getDeepDive');
};

/** Full year activity heatmap data. */
export const getHeatmapData = () =>
  authFetch('/analytics/heatmap', {}, 'getHeatmapData');