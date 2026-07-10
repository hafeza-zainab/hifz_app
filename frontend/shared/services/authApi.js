/**
 * services/authApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication — no JWT needed, so uses publicFetch.
 */

import { publicFetch } from './http';

/**
 * Create a new account.
 * @returns {{ token, username } | { success: false, message: string }}
 */
export const signupUser = (username, email, password) =>
  publicFetch(
    '/auth/signup',
    { method: 'POST', body: JSON.stringify({ username, email, password }) },
    'Signup'
  );

/**
 * Exchange credentials for a JWT.
 * @returns {{ token, username } | { success: false, message: string }}
 */
export const loginUser = (username, password) =>
  publicFetch(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    'Login'
  );