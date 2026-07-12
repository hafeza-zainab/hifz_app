// features/coach/utils/quranContextBuilder.js
//
// CHANGES vs previous version:
//   1. All four fetch helpers now check quranCache before hitting the network.
//      Responses are stored with a 5-minute TTL, so repeated questions about
//      the same Surah / Page / Juz never make a second round-trip.
//
//   2. formatPageContext / formatSurahContext now cap their ayah lists at
//      MAX_AYAHS_IN_CONTEXT (20) and emit a compact single-line-per-ayah
//      format — no whitespace padding.
//
//   3. formatSimilarityContext already sliced to 20 pairs; kept as-is.
//
//   4. buildQuranContext now hard-caps the combined output at
//      MAX_CONTEXT_CHARS (2 000 characters ≈ ~500 tokens).
//      This prevents a single "Surah Al-Baqarah" fetch from blowing up
//      the Groq prompt budget.

import { API_BASE, authFetch } from "../coachConstants";
import { quranCache }          from "./quranCache";

// ─── tuneable limits ──────────────────────────────────────────────────────────
const MAX_AYAHS_IN_CONTEXT = 20;   // rows shown per surah / page block
const MAX_CONTEXT_CHARS    = 2000; // hard cap on total context string length

// ─── intent detection (unchanged) ────────────────────────────────────────────
export function detectIntent(text) {
  const t = text.toLowerCase();
  const pageMatch     = text.match(/\b(?:page|pg\.?)\s*(?:number\s*)?(\d{1,3})\b/i);
  const surahNumMatch =
    text.match(/\bsurah\s+(\d{1,3})\b/i) ||
    text.match(/\bsurah\s+[\w-]+\s*\((\d{1,3})\)/i) ||
    text.match(/\((\d{1,3})\)/);
  const ayahMatch =
    text.match(/\b(\d{1,3})\s*[:/]\s*(\d{1,3})\b/) ||
    text.match(/surah\s*(\d{1,3})\s*ayah\s*(\d{1,3})/i);
  const juzMatch     = text.match(/\b(?:juz|juzz|para|sipara|siparah)\s*(\d{1,2})\b/i);
  const marhalaMatch = text.match(/marhala\s+(\w+)/i);

  const allAyahPairs = [];
  const ayahRegex    = /\b(\d{1,3})\s*[:/]\s*(\d{1,3})\b/g;
  let am;
  while ((am = ayahRegex.exec(text)) !== null) {
    allAyahPairs.push({ surah: parseInt(am[1]), ayah: parseInt(am[2]) });
  }

  const wantsFlashcards = /flashcard|flash card/i.test(t);
  const wantsSequence   = /sequence|order|arrange|flow|chain|first word/i.test(t);
  const wantsSimilar    = /similar|mutasha|confus|mix|same|like|tip.*remember|remember.*tip/i.test(t);
  const wantsSchedule   = /schedule|plan|daily|routine|when|time/i.test(t);
  const wantsWeak       = /weak|struggle|difficult|hard|forget|revise|revision/i.test(t);

  return {
    pageNum:  pageMatch     ? parseInt(pageMatch[1])                                          : null,
    surahNum: surahNumMatch ? parseInt(surahNumMatch[surahNumMatch.length - 1])               : null,
    ayahNum:  ayahMatch     ? parseInt(ayahMatch[2])                                          : null,
    juzNum:   juzMatch      ? parseInt(juzMatch[1])                                           : null,
    marhala:  marhalaMatch  ? marhalaMatch[1]                                                 : null,
    allAyahPairs: allAyahPairs.length > 0
      ? allAyahPairs
      : (ayahMatch ? [{ surah: parseInt(ayahMatch[1]), ayah: parseInt(ayahMatch[2]) }] : []),
    wantsFlashcards,
    wantsSequence,
    wantsSimilar,
    wantsSchedule,
    wantsWeak,
  };
}

// ─── fetch helpers (now cache-aware) ─────────────────────────────────────────

async function fetchPageData(pageNum) {
  const cached = quranCache.get("page", pageNum);
  if (cached) return cached;
  try {
    const json = await authFetch(`/ayah/page/${pageNum}/full`);
    const data = json.success ? json.data : null;
    if (data) quranCache.set("page", pageNum, data);
    return data;
  } catch (e) {
    console.error('[quranContextBuilder] Failed to fetch page data for:', pageNum, e);
    return null;
  }
}

async function fetchSurahData(surahNum) {
  const cached = quranCache.get("surah", surahNum);
  if (cached) return cached;
  try {
    const json = await authFetch(`/ayah/${surahNum}/full`);
    const data = json.success ? json.data : null;
    if (data) quranCache.set("surah", surahNum, data);
    return data;
  } catch (e) {
    console.error('[quranContextBuilder] Failed to fetch surah data for:', surahNum, e);
    return null;
  }
}

async function fetchJuzData(juzNum) {
  const cached = quranCache.get("juz", juzNum);
  if (cached) return cached;
  try {
    const json = await authFetch(`/ayah/juz/${juzNum}/full`);
    const data = json.success ? json.data : null;
    if (data) quranCache.set("juz", juzNum, data);
    return data;
  } catch (e) {
    console.error('[quranContextBuilder] Failed to fetch juz data for:', juzNum, e);
    return null;
  }
}

async function fetchSimilarityData(surah, ayah, marhala) {
  const cacheId = `${surah}:${ayah}:${marhala || ""}`;
  const cached  = quranCache.get("similarity", cacheId);
  if (cached) return cached;
  try {
    let url = `/similarity?surah=${surah}&ayah=${ayah}`;
    if (marhala) url += `&marhala=${encodeURIComponent(marhala)}`;
    const json = await authFetch(url);
    const data = json.success && json.data ? json.data : null;
    if (data) quranCache.set("similarity", cacheId, data);
    return data;
  } catch (e) {
    console.error('[quranContextBuilder] Failed to fetch similarity data for:', `${surah}:${ayah}`, e);
    return null;
  }
}

async function fetchSensoryProfile() {
  try {
    const json = await authFetch('/auth/me');
    const data = json.success ? json.data : null;
    if (data?.sensoryProfile) {
      console.log("Sensory Profile injected into coach context:", data.sensoryProfile);
      return data.sensoryProfile;
    }
    return null;
  } catch (e) {
    console.error('[quranContextBuilder] Failed to fetch Sensory Profile:', e);
    return null;
  }
}

// ─── formatters (trimmed output) ─────────────────────────────────────────────

function formatPageContext(data) {
  try {
    if (!data) return "";
    const ayahs   = (data.ayahs || []).slice(0, MAX_AYAHS_IN_CONTEXT);
    const more    = (data.totalAyahs || 0) - ayahs.length;
    const list    = ayahs.map(a => `${a.ayah}:${a.firstWord || ""}`).join("|");
    const trailer = more > 0 ? ` (+${more} more)` : "";
    return `=PAGE ${data.page}= total:${data.totalAyahs || 0}${trailer} | ${list}`;
  } catch (e) {
    console.error("formatPageContext error:", e);
    return "";
  }
}

function formatSurahContext(data) {
  try {
    if (!data) return "";
    const ayahs   = (data.ayahs || []).slice(0, MAX_AYAHS_IN_CONTEXT);
    const more    = (data.totalAyahs || 0) - ayahs.length;
    const list    = ayahs.map(a => `${a.ayah}:${a.firstWord || ""}`).join("|");
    const trailer = more > 0 ? ` (+${more} more)` : "";
    return `=SURAH ${data.surah}= total:${data.totalAyahs || 0}${trailer} | ${list}`;
  } catch (e) {
    console.error("formatSurahContext error:", e);
    return "";
  }
}

function formatSimilarityContext(data, surah, ayah) {
  try {
    if (!data) return "";
    if (!data.results?.length) {
      return `=SIM ${surah}:${ayah}= none`;
    }
    const lines = data.results.slice(0, 20).map(r =>
      `${r.target_surah}:${r.target_ayah}(${r.similarity_score?.toFixed(2) || "?"})`
    );
    return `=SIM ${surah}:${ayah}= count:${data.results.length} | ${lines.join("|")}`;
  } catch (e) {
    console.error("formatSimilarityContext error:", e);
    return `=SIM ${surah}:${ayah}= error`;
  }
}

function formatJuzContext(data) {
  try {
    if (!data) return "";
    const pages   = (data.ayahs || []).slice(0, MAX_AYAHS_IN_CONTEXT);
    const more    = (data.totalPages || 0) - pages.length;
    const list    = pages.map(a => `p${a.page}:${a.firstWord || ""}`).join("|");
    const trailer = more > 0 ? ` (+${more} more)` : "";
    return `=JUZ ${data.juz}= pages:${data.totalPages || 0}${trailer} | ${list}`;
  } catch (e) {
    console.error("formatJuzContext error:", e);
    return "";
  }
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function buildQuranContext(userText, chatState = null) {
  try {
    const intent   = detectIntent(userText);
    const sections = [];
    const fetches  = [];

    console.log("=== QURAN CONTEXT BUILDER ===");
    console.log("Current state:", chatState);
    console.log("User input:", userText);
    console.log("Detected intent:", intent);

    // State-aware fetching for sequence flows
    if (chatState) {
      const numericInput = parseInt(userText.trim());

      if (!isNaN(numericInput)) {
        console.log("Numeric input detected:", numericInput);

        // Sequence of Ayah in Surah
        if (chatState === "seq_1_1_surah" && numericInput >= 1 && numericInput <= 114) {
          console.log("State-aware fetch: Surah", numericInput);
          fetches.push(
            fetchSurahData(numericInput)
              .then(data => { if (data) sections.push(formatSurahContext(data)); })
              .catch(e => console.error("Surah fetch error:", e))
          );
        }

        // Sequence of Ayah in Page
        if (chatState === "seq_1_2_page" && numericInput >= 1 && numericInput <= 604) {
          console.log("State-aware fetch: Page", numericInput);
          fetches.push(
            fetchPageData(numericInput)
              .then(data => { if (data) sections.push(formatPageContext(data)); })
              .catch(e => console.error("Page fetch error:", e))
          );
        }

        // Sequence of Pages in Juz
        if ((chatState === "seq_1_3_juz" || chatState === "seq_1_4_juz") && numericInput >= 1 && numericInput <= 30) {
          console.log("State-aware fetch: Juz", numericInput);
          fetches.push(
            fetchJuzData(numericInput)
              .then(data => { if (data) sections.push(formatJuzContext(data)); })
              .catch(e => console.error("Juz fetch error:", e))
          );
        }
      }
    }

    // Regex-based intent detection (fallback for non-sequence flows)
    if (intent.pageNum && intent.pageNum >= 1 && intent.pageNum <= 604) {
      console.log("Regex-based fetch: Page", intent.pageNum);
      fetches.push(
        fetchPageData(intent.pageNum)
          .then(data => { if (data) sections.push(formatPageContext(data)); })
          .catch(e => console.error("Page fetch error:", e))
      );
    }

    if (intent.surahNum && intent.surahNum >= 1 && intent.surahNum <= 114) {
      console.log("Regex-based fetch: Surah", intent.surahNum);
      fetches.push(
        fetchSurahData(intent.surahNum)
          .then(data => { if (data) sections.push(formatSurahContext(data)); })
          .catch(e => console.error("Surah fetch error:", e))
      );
    }

    if (intent.wantsFlashcards && intent.allAyahPairs.length > 0) {
      const uniqueSurahs = [...new Set(intent.allAyahPairs.map(p => p.surah))]
        .filter(s => s !== intent.surahNum && s >= 1 && s <= 114);
      for (const s of uniqueSurahs) {
        fetches.push(
          fetchSurahData(s)
            .then(data => { if (data) sections.push(formatSurahContext(data)); })
            .catch(e => console.error("Surah fetch error:", e))
        );
      }
    }

    if (intent.wantsSimilar) {
      if (intent.allAyahPairs.length > 0) {
        for (const pair of intent.allAyahPairs) {
          if (pair.surah >= 1 && pair.surah <= 114) {
            fetches.push(
              fetchSimilarityData(pair.surah, pair.ayah, intent.marhala)
                .then(data => { if (data) sections.push(formatSimilarityContext(data, pair.surah, pair.ayah)); })
                .catch(e => console.error("Similarity fetch error:", e))
            );
          }
        }
      } else if (intent.surahNum) {
        const ayah = intent.ayahNum || 1;
        fetches.push(
          fetchSimilarityData(intent.surahNum, ayah, intent.marhala)
            .then(data => { if (data) sections.push(formatSimilarityContext(data, intent.surahNum, ayah)); })
            .catch(e => console.error("Similarity fetch error:", e))
        );
      }
    }

    if (intent.juzNum && intent.juzNum >= 1 && intent.juzNum <= 30) {
      console.log("Regex-based fetch: Juz", intent.juzNum);
      fetches.push(
        fetchJuzData(intent.juzNum)
          .then(data => { if (data) sections.push(formatJuzContext(data)); })
          .catch(e => console.error("Juz fetch error:", e))
      );
    }

    await Promise.all(fetches);

    // Fetch and inject Sensory Profile
    const sensoryProfile = await fetchSensoryProfile();
    if (sensoryProfile) {
      sections.unshift(`SENSORY PROFILE\nLearning Style: ${sensoryProfile}`);
    }

    // Hard-cap the combined context to keep Groq token usage predictable
    let combined = sections.join("\n");
    if (combined.length > MAX_CONTEXT_CHARS) {
      combined = combined.slice(0, MAX_CONTEXT_CHARS);
    }

    console.log("Fetched context size:", combined.length, "characters");
    console.log("Fetched context sections:", sections.length);
    console.log("Context > 0:", combined.length > 0 ? "YES" : "NO");
    console.log("==============================");

    return { context: combined, intent };
  } catch (e) {
    console.error("[buildQuranContext] Fatal error:", e);
    return { context: "", intent: {} };
  }
}