// features/coach/utils/quranCache.js
//
// Lightweight in-memory cache for Quran API responses.
// Prevents repeated fetches for the same surah/page/juz/similarity data
// within a single browser session (or until TTL expires).
//
// TTL: 5 minutes (configurable via CACHE_TTL_MS)

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const _store = new Map(); // key -> { value, expiresAt }

function _key(...parts) {
  return parts.join(":");
}

function get(namespace, id) {
  const k   = _key(namespace, id);
  const hit = _store.get(k);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    _store.delete(k);
    return null;
  }
  return hit.value;
}

function set(namespace, id, value) {
  _store.set(_key(namespace, id), {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Manually evict everything (useful in tests or dev). */
function clear() {
  _store.clear();
}

export const quranCache = { get, set, clear };