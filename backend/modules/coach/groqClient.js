// backend/modules/coach/groqClient.js
//
// Wraps the Groq API call with exponential backoff retry logic.
// On a 429 response, Groq returns a Retry-After header (seconds).
// We honour that header if present, otherwise fall back to exponential delay.
//
// Usage:
//   const { text, model } = await callGroq({ model, messages, signal });

"use strict";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES   = 3;
const BASE_DELAY_MS = 1500; // first retry after ~1.5 s

/**
 * Sleep for `ms` milliseconds, but abort early if the AbortSignal fires.
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

/**
 * @param {object}      opts
 * @param {string}      opts.model       - Groq model identifier
 * @param {object[]}    opts.messages    - formatted messages array
 * @param {AbortSignal} opts.signal      - optional AbortSignal for timeout
 * @returns {Promise<{ text: string, model: string, totalTokens: number }>}
 */
async function callGroq({ model, messages, signal }) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured on the server.");

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const response = await fetch(GROQ_ENDPOINT, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens:  1200,
        temperature: 0.7,
      }),
      signal,
    });

    // Success
    if (response.ok) {
      const data       = await response.json();
      const text       = data.choices?.[0]?.message?.content || "";
      const totalTokens = data.usage?.total_tokens ?? 0;
      return { text, model, totalTokens };
    }

    // Rate limited — back off then retry
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
      const delay      = retryAfter > 0
        ? retryAfter * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt); // 1.5s, 3s, 6s

      console.warn(
        `[groqClient] 429 on attempt ${attempt + 1}/${MAX_RETRIES + 1}. ` +
        `Retrying in ${delay}ms (model=${model})`
      );

      await sleep(delay, signal);
      continue;
    }

    // Non-retryable error
    const errText = await response.text();
    lastError = Object.assign(
      new Error(`Groq ${response.status}: ${errText}`),
      { status: response.status, body: errText }
    );
    break;
  }

  // All retries exhausted or non-retryable error
  throw lastError || new Error("Groq request failed after retries.");
}

module.exports = { callGroq };