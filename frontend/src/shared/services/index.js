/**
 * services/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports every service so components can import from one place:
 *
 *   import { loginUser, getTasks, fetchSurahs } from '../services';
 */

export * from './authApi';
export * from './coachApi';
export * from './diaryApi';
export * from './flashcardApi';
export * from './similarityApi';
export * from './taskApi';
export * from './analyticsApi';
export * from './themeApi';

// http primitives — available for one-off fetches in edge cases
export { authFetch, publicFetch, API_BASE } from './http';