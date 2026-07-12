// shared/services/apiConfig.js
// Single source of truth for API configuration.
// API_BASE and authFetch are imported from http.js (canonical HTTP utilities).
// getAuthHeader is defined here for backward compatibility.

export { API_BASE, authFetch } from './http';

/** Build headers for authenticated requests. */
export const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

