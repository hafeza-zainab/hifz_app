/**
 * services/coachApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI coach endpoints.
 */

import { authFetch } from './http';

/**
 * How many coach messages the user has left today.
 * @returns {{ remaining: number } | ErrorShape}
 */
export const getRemainingQuota = () =>
  authFetch('/coach/remaining', {}, 'getRemainingQuota');

/**
 * Send a chat turn to the coach.
 *
 * @param {Array<{ role: 'user'|'assistant', content: string }>} messages
 * @param {string} [system]  Optional system prompt override
 * @returns {{ reply: string } | ErrorShape}
 */
export const sendChat = (messages, system) =>
  authFetch(
    '/coach/chat',
    { method: 'POST', body: JSON.stringify({ messages, system }) },
    'sendChat'
  );