/**
 * services/similarityApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Ayah / similarity endpoints.
 * All functions return the unwrapped `data` field for convenience, falling
 * back to [] / null so callers never have to guard against undefined.
 */

import { authFetch } from './http';

// Similarity routes don't require auth, so we call fetch directly and share
// the same parseResponse path via authFetch (token is simply absent).

// Simple in-memory cache for stable reference data
const cache = {
  surahs: null,
  surahsTimestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

/** @returns {Array} List of surah objects */
export const fetchSurahs = async () => {
  const now = Date.now();
  // Return cached data if still valid
  if (cache.surahs && (now - cache.surahsTimestamp) < cache.CACHE_DURATION) {
    return cache.surahs;
  }
  
  const res = await authFetch('/ayah/surahs', {}, 'fetchSurahs');
  const data = res?.data ?? [];
  
  // Update cache
  cache.surahs = data;
  cache.surahsTimestamp = now;
  
  return data;
};

/**
 * Ayahs within a surah.
 * @param {number|string} surah  Surah number
 * @returns {Array}
 */
export const fetchAyahs = async (surah) => {
  const res = await authFetch(`/ayah/${surah}/ayahs`, {}, 'fetchAyahs');
  return res?.data ?? [];
};

/**
 * Similar ayahs for a given surah + ayah position.
 *
 * @param {number|string} surah
 * @param {number|string} ayah
 * @param {string} [marhala]
 * @param {string} [juz]
 * @param {string} [page]
 */
export const fetchSimilarities = async (surah, ayah, marhala = '', juz = '', page = '') => {
  const params = new URLSearchParams({ surah, ayah });
  if (marhala) params.append('marhala', marhala);
  if (juz)     params.append('juz', juz);
  if (page)    params.append('page', page);
  const res = await authFetch(`/similarity?${params}`, {}, 'fetchSimilarities');
  return res; // Return full response object with { success, data, message }
};

/**
 * Surrounding ayahs for context display.
 * @returns {object | null}
 */
export const fetchAyahContext = (surah, ayah) =>
  authFetch(`/ayah/context?surah=${surah}&ayah=${ayah}`, {}, 'fetchAyahContext');

/**
 * Metadata for a Mushaf page.
 * @returns {object | null}
 */
export const fetchPageDetails = async (page) => {
  const res = await authFetch(`/ayah/page-details?page=${page}`, {}, 'fetchPageDetails');
  return res?.data ?? null;
};

/**
 * All pages that belong to a juz.
 * @param {number} juz  1–30
 * @returns {Array}
 */
export const fetchJuzPages = async (juz) => {
  const res = await authFetch(`/ayah/juz-pages?juz=${juz}`, {}, 'fetchJuzPages');
  return res?.data ?? [];
};

/**
 * All pages within an inclusive page range.
 * @param {number} start
 * @param {number} end
 * @returns {Array}
 */
export const fetchPagesInRange = async (start, end) => {
  const res = await authFetch(
    `/ayah/pages-in-range?start=${start}&end=${end}`,
    {},
    'fetchPagesInRange'
  );
  return res?.data ?? [];
};

