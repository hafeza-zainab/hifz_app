/**
 * services/flashcardApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Flashcard / spaced-repetition endpoints.
 *
 * Extend these stubs to match your actual backend routes.
 */

import { authFetch } from './http';

/**
 * Get the next batch of cards due for review.
 * @param {number} [limit=20]
 */
export const getDueCards = (limit = 20) =>
  authFetch(`/flashcards/due?limit=${limit}`, {}, 'getDueCards');

/**
 * Fetch all cards for a specific juz.
 * @param {number} juz  1–30
 */
export const getCardsByJuz = (juz) =>
  authFetch(`/flashcards?juz=${juz}`, {}, 'getCardsByJuz');

/**
 * Submit a review result for a card.
 * @param {string|number} cardId
 * @param {'again'|'hard'|'good'|'easy'} rating  SRS rating
 */
export const submitReview = (cardId, rating) =>
  authFetch(
    `/flashcards/${cardId}/review`,
    { method: 'POST', body: JSON.stringify({ rating }) },
    'submitReview'
  );

/**
 * Reset review history for a card.
 * @param {string|number} cardId
 */
export const resetCard = (cardId) =>
  authFetch(`/flashcards/${cardId}/reset`, { method: 'POST' }, 'resetCard');