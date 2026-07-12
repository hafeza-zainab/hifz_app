// features/coach/coachConstants.js
//
// FIXES:
// 1. API_BASE and getAuthHeader now imported from shared/services/apiConfig.js (single source of truth)
// 2. authFetch now imported from shared/services/http.js (centralized error handling)
// 3. HOME_OPTIONS, QUICK_CHIPS, scoreLabel, timeAgo, context builders unchanged

import { API_BASE, getAuthHeader } from '../../shared/services/apiConfig';
import { authFetch } from '../../shared/services/http';

export { API_BASE, getAuthHeader, authFetch };

// ─── Home menu options ─────────────────────────────────────────────────────────
export const HOME_OPTIONS = [
  {
    key: "1",
    label: "Time Management",
    labelEn: "Weekly cycle & daily schedule",
    icon: "ti-calendar",
    prompt: "1",
  },
];

// ─── Quick chip suggestions (shown mid-conversation every 4 messages) ──────────
export const QUICK_CHIPS = [
  "Which are my weakest pages?",
  "Which mutashabihat pairs should I focus on?",
  "Build me a revision schedule",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function scoreLabel(s) {
  if (s <= 5.75) return "WEAK";
  if (s <= 7.75) return "OK";
  return "STRONG";
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB");
}

// ─── System prompt ─────────────────────────────────────────────────────────────
// NOTE: The backend has its own authoritative system prompt in coach.system-prompt.js.
// The frontend only needs to send the STUDENT DATA SECTION (diary, heatmap, similarity).
// This constant is kept for reference / fallback only — CoachPage sends only data sections.
export const SYSTEM_PROMPT_BASE = `You are Ustadh AI, a specialized Quran memorization and revision coach.

MISSION
Your sole purpose is to assist students in Quran memorization (Hifz), revision (Muraja'at),
Mutashabihat (similar verses), Tajweed improvement related to memorization, Hifz scheduling,
time management for Quran study, progress analysis, diary analysis, and Quran-focused learning strategies.

STRICT SCOPE
You may ONLY discuss:
1. Quran memorization techniques and methods
2. Revision systems (Muraja'at, Jadeed, Juz Hali, Tasmee, Ikhtebar)
3. Mutashabihat (similar/confusing verses)
4. Tajweed for memorization
5. Quran study scheduling and time management
6. Memorization psychology and consistency
7. Analysis of diary/heatmap data
8. Page sequence, beginning/ending ayah memorization
9. Quran flashcards
10. Quranic etiquette and virtues of Hifz

If asked anything outside this scope respond EXACTLY:
"I'm Ustadh AI, your dedicated Quran memorization coach. I can only help with Quran memorization topics. 📖"

NUMERIC REPLY RULE — CRITICAL:
A bare number or short numeric string is ALWAYS a menu selection or data entry.
NEVER apply the scope refusal to a numeric reply.

QURAN TEXT RULES:
* NEVER translate or explain the meaning of Quranic Arabic text.
* Reference ayahs by Surah name + number:ayah ONLY.
* NEVER use phrases like "which means", "meaning", "translated as", "in English".

FLASHCARD OUTPUT FORMAT:
[FLASHCARDS:Set Name Here]
FRONT: Question
BACK: Arabic text here
---
[/FLASHCARDS]

TIP OUTPUT FORMAT:
[TIP:SIMILARITY_ID]
Tip text here.
[/TIP]

BEHAVIOR RULES:
* Ask ONE question at a time.
* End EVERY response with one specific action the student can take TODAY.`;

// ─── Context builders ──────────────────────────────────────────────────────────
export function buildDiaryContext(heatmapData, recentLogs) {
  if (!heatmapData?.length && !recentLogs?.length) return "";
  const lines = ["=== STUDENT DIARY DATA ==="];

  if (heatmapData?.length) {
    lines.push("\n-- Page Scores (Murajah Heatmap) --");
    const byJuz = {};
    heatmapData.forEach((d) => {
      if (!byJuz[d.juz]) byJuz[d.juz] = [];
      byJuz[d.juz].push(d);
    });
    Object.keys(byJuz)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((juz) => {
        const pages  = byJuz[juz].sort((a, b) => a.page - b.page);
        const weak   = pages.filter((p) => p.score <= 5.75);
        const ok     = pages.filter((p) => p.score > 5.75 && p.score <= 7.75);
        const strong = pages.filter((p) => p.score > 7.75);
        lines.push(`\nJuz ${juz}:`);
        if (weak.length)   lines.push(`  WEAK   (≤5.75): ${weak.map((p) => `Page ${p.page} (${p.score})`).join(", ")}`);
        if (ok.length)     lines.push(`  OK     (6-7.75): ${ok.map((p) => `Page ${p.page} (${p.score})`).join(", ")}`);
        if (strong.length) lines.push(`  STRONG (≥8):    ${strong.map((p) => `Page ${p.page} (${p.score})`).join(", ")}`);
      });
    const allWeak = heatmapData.filter((d) => d.score <= 5.75);
    if (allWeak.length) {
      lines.push(
        `\nTop weak pages: ${allWeak
          .sort((a, b) => a.score - b.score)
          .slice(0, 10)
          .map((p) => `Juz ${p.juz} Page ${p.page} (${p.score}/10)`)
          .join(", ")}`
      );
    }
  }

  if (recentLogs?.length) {
    lines.push("\n-- Recent Diary Entries (last 30) --");
    recentLogs.slice(0, 30).forEach((log) => {
      const range = log.range_to ? `${log.range_from} → ${log.range_to}` : log.range_from;
      lines.push(
        `${log.log_date || log.created_at?.split("T")[0]} | ${log.type} | ${range} | Score: ${log.score}/10 (${scoreLabel(log.score)})`
      );
    });
  }
  return lines.join("\n");
}

export function buildMutashabihatContext(similarities) {
  if (!similarities?.length) return "";
  const lines = ["=== STUDENT MUTASHABIHAT DATA (with pair IDs for tip generation) ==="];
  lines.push("For each pair listed, generate a [TIP:id] block when a navigation action is included.\n");

  const high   = similarities.filter((s) => s.similarity_score >= 0.8);
  const medium = similarities.filter((s) => s.similarity_score >= 0.5 && s.similarity_score < 0.8);

  if (high.length) {
    lines.push(`-- HIGH similarity (≥0.8): ${high.length} pairs --`);
    high.slice(0, 20).forEach((s) => {
      lines.push(
        `[ID:${s.id}] Surah ${s.source_surah}:${s.source_ayah} ↔ Surah ${s.target_surah}:${s.target_ayah} (score: ${s.similarity_score.toFixed(2)})`
      );
      if (s.tips?.length) lines.push(`  Existing tips: ${s.tips.join("; ")}`);
    });
  }
  if (medium.length) {
    lines.push(`\n-- MEDIUM similarity (0.5-0.8): ${medium.length} pairs --`);
    medium.slice(0, 15).forEach((s) => {
      lines.push(
        `[ID:${s.id}] Surah ${s.source_surah}:${s.source_ayah} ↔ Surah ${s.target_surah}:${s.target_ayah} (score: ${s.similarity_score.toFixed(2)})`
      );
    });
  }
  return lines.join("\n");
}

export function buildSimilarityContextForPrompt(pairs) {
  if (!pairs.length) return "";
  const lines = ["\n\n=== SIMILARITY DATA FOR TIP GENERATION ==="];
  lines.push("Use the [TIP:ID] format for each pair below. Include the exact ID shown.\n");

  const bySource = {};
  pairs.forEach((p) => {
    const key = `${p.sourceSurah}:${p.sourceAyah}`;
    if (!bySource[key]) bySource[key] = [];
    bySource[key].push(p);
  });

  Object.entries(bySource).forEach(([sourceKey, pairsForSource]) => {
    lines.push(`Source: Surah ${sourceKey}`);
    lines.push(`Found ${pairsForSource.length} similar pairs:`);
    pairsForSource.forEach((r) => {
      lines.push("");
      lines.push(
        `[ID:${r.id}] Surah ${r.name || `Surah ${r.target_surah}`} (${r.target_surah}:${r.target_ayah}) — ${Math.round(r.similarity_score * 100)}% ${r.strength_label || "Match"}`
      );
      lines.push(`  Marhala: ${r.marhala || "N/A"} | Juz: ${r.juz || "N/A"}`);
      lines.push(`  Arabic text: ${r.text || "N/A"}`);
      if (r.tips?.length) lines.push(`  Existing tips: ${r.tips.join("; ")}`);
    });
  });
  return lines.join("\n");
}

// ─── Similarity fetcher ────────────────────────────────────────────────────────
export async function fetchSimilarityForPairs(pairs, marhala) {
  const allResults = [];
  for (const pair of pairs) {
    try {
      let url = `${API_BASE}/similarity?surah=${pair.surah}&ayah=${pair.ayah}`;
      if (marhala) url += `&marhala=${encodeURIComponent(marhala)}`;
      const res  = await authFetch(url);
      const json = await res.json();
      if (json.success && json.data?.results?.length > 0) {
        const tagged = json.data.results.map((r) => ({
          ...r,
          sourceSurah: pair.surah,
          sourceAyah:  pair.ayah,
        }));
        allResults.push(...tagged);
      }
    } catch (e) {
      console.error('[coachConstants] Similarity fetch error for pair:', `${pair.surah}:${pair.ayah}`, e);
    }
  }
  return allResults;
}

// ─── CSS injection (call once on mount) ───────────────────────────────────────
export function injectCoachStyles() {
  const id = "ustadh-coach-styles";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
    @keyframes ustadh-dot-bounce {
      0%,80%,100%{transform:translateY(0);opacity:.4}
      40%{transform:translateY(-6px);opacity:1}
    }
    @keyframes ustadh-slide-up {
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }
    .ustadh-msg-enter { animation: ustadh-slide-up 0.25s ease-out; }
    .ustadh-session-item:hover { background: #F3F4F6 !important; }
    .ustadh-session-item.active { background: #E6F4F1 !important; border-left: 3px solid #004D40 !important; }
    .ustadh-home-opt:hover { background: #F0FDF4 !important; border-color: #004D40 !important; }
    .ustadh-chip:hover { background: #E6F4F1 !important; border-color: #004D40 !important; color: #004D40 !important; }
    .ustadh-send-btn:hover:not(:disabled) { background: #003328 !important; }
    .ustadh-del-btn { opacity:0; transition:opacity .15s; }
    .ustadh-session-item:hover .ustadh-del-btn { opacity:1; }
    .ustadh-textarea {
      resize:none; width:100%; border:none; outline:none;
      background:transparent; font-size:14px; font-family:inherit;
      color:#111827; line-height:1.6; padding-top:10px;
    }
    .ustadh-textarea::placeholder { color:#9CA3AF; }
    .ustadh-session-rename-input {
      width:100%; font-size:12px; border:2px solid #004D40;
      border-radius:4px; padding:4px 8px; outline:none; background:#F0FDF4;
    }
  `;
  document.head.appendChild(s);
}