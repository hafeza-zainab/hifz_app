/**
 * services/http.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single HTTP primitive used by every API module.
 *
 * Responsibilities
 *  - Attach the JWT from localStorage to every request
 *  - Parse JSON (or throw a descriptive error for non-JSON responses)
 *  - Redirect to /login on 401
 *  - Surface backend error messages instead of generic "fetch failed"
 *  - Return a consistent { success, data, message } shape on failure
 */

export const API_BASE =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Auth header ──────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('token');

const buildHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

// ─── Response parsing ─────────────────────────────────────────────────────────

const parseResponse = async (res) => {
  // Session expired → clean up and bounce to login
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Unexpected response from server (status ${res.status}, type "${contentType}"). Is the backend running?`
    );
  }

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.message || `Server error ${res.status}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

// ─── Error normaliser ─────────────────────────────────────────────────────────

const normaliseError = (error, context = 'API call') => {
  // 404 is expected for "no data" states - don't log it
  const isExpected404 = error.statusCode === 404;
  
  if (process.env.NODE_ENV !== 'production' && !isExpected404) {
    console.error(`[${context}]`, error);
  }

  if (
    error.message === 'Failed to fetch' ||
    error.message?.includes('Is the backend running')
  ) {
    return {
      success: false,
      message: 'Cannot reach the server. Check that the backend is running on port 5000.',
    };
  }

  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: error.statusCode,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Authenticated fetch.
 *
 * @param {string} path        - Path relative to API_BASE, e.g. "/tasks"
 * @param {RequestInit} init   - Any fetch options (method, body, headers, …)
 * @param {string} context     - Label used in error logs
 * @returns {Promise<any>}     - Parsed JSON on success, error object on failure
 */
export const authFetch = async (path, init = {}, context = path) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: buildHeaders(init.headers),
    });
    return await parseResponse(res);
  } catch (error) {
    return normaliseError(error, context);
  }
};

/**
 * Unauthenticated fetch (signup / login).
 */
export const publicFetch = async (path, init = {}, context = path) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
    return await parseResponse(res);
  } catch (error) {
    return normaliseError(error, context);
  }
};