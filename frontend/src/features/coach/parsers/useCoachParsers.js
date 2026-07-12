// features/coach/parsers/useCoachParsers.js
//
// FIXES in this version:
//
//   1. parseWeeklyCycle — was expecting [WEEKLY_CYCLE]...[/WEEKLY_CYCLE] with
//      "Day: Sipara" lines. The system prompt emits a single-line format:
//        [WEEKLY_CYCLE:Mon=Sipara 5,Sipara 12;Tue=Sipara 3,Sipara 18;Sun=Rest]
//      Parser now handles both formats.
//
//   2. parseSchedule — was expecting [SCHEDULE]...[/SCHEDULE].
//      System prompt emits [SCHEDULE:saved] followed by free-text (no closing tag).
//      Parser now handles both: [SCHEDULE:saved]...next-block and [SCHEDULE]...[/SCHEDULE].
//
//   3. parseLearningStyle — was expecting [LEARNING_STYLE]...[/LEARNING_STYLE] with
//      "primary: X" lines. System prompt emits:
//        [STYLE:primary=Visual,secondary=Auditory]
//      Parser now handles both formats.
//
//   4. parseNavigate — was expecting [NAVIGATE:page-slug].
//      System prompt emits [NAV:/flashcards] or [NAV:/similarity?surah=X&ayah=Y].
//      Parser now handles both [NAV:...] and [NAVIGATE:...].

// ─── Flashcard block ──────────────────────────────────────────────────────────
// Format (system prompt + parser both agree — no change needed):
//   [FLASHCARDS:Set Name]
//   FRONT: …  BACK: …  ---
//   [/FLASHCARDS]

export function parseFlashcards(raw = "") {
  const blockRe = /\[FLASHCARDS:([^\]]+)\]([\s\S]*?)\[\/FLASHCARDS\]/gi;
  const match   = blockRe.exec(raw);
  if (!match) return { clean: raw, data: null };

  const setName = match[1].trim();
  const body    = match[2];
  const cards   = [];
  const cardRe  = /FRONT:\s*(.+?)\nBACK:\s*([\s\S]+?)(?=\n---|\n?$)/gi;
  let cm;
  while ((cm = cardRe.exec(body)) !== null) {
    const front = cm[1].trim();
    const back  = cm[2].trim();
    if (front && back) cards.push({ front, back });
  }

  return {
    clean: raw.replace(match[0], "").trim(),
    data:  cards.length ? { name: setName, cards } : null,
  };
}

// ─── Weekly cycle block ───────────────────────────────────────────────────────
// FIX: now handles the actual system-prompt format:
//   [WEEKLY_CYCLE:Mon=Sipara 5,Sipara 12;Tue=Sipara 3,Sipara 18;Sun=Rest]
// Also still handles the old multi-line block format as a fallback.

export function parseWeeklyCycle(raw = "") {
  // ── Format A (system-prompt): single-line with semicolons ─────────────────
  const inlineMatch = raw.match(/\[WEEKLY_CYCLE:([^\]]+)\]/i);
  if (inlineMatch) {
    const cycle = inlineMatch[1]
      .split(";")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const eqIdx = segment.indexOf("=");
        if (eqIdx === -1) return null;
        const day     = segment.slice(0, eqIdx).trim();
        const siparas = segment
          .slice(eqIdx + 1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return day && siparas.length ? { day, siparas } : null;
      })
      .filter(Boolean);

    return {
      clean: raw.replace(inlineMatch[0], "").trim(),
      data:  cycle.length ? cycle : null,
    };
  }

  // ── Format B (fallback): multi-line block ─────────────────────────────────
  const blockMatch = raw.match(/\[WEEKLY_CYCLE\]([\s\S]*?)\[\/WEEKLY_CYCLE\]/i);
  if (!blockMatch) return { clean: raw, data: null };

  const cycle = blockMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) return null;
      const day     = line.slice(0, colonIdx).trim();
      const siparas = line.slice(colonIdx + 1).split(",").map((s) => s.trim()).filter(Boolean);
      return day && siparas.length ? { day, siparas } : null;
    })
    .filter(Boolean);

  return {
    clean: raw.replace(blockMatch[0], "").trim(),
    data:  cycle.length ? cycle : null,
  };
}

// ─── Schedule block ───────────────────────────────────────────────────────────
// FIX: now handles the actual system-prompt format:
//   [SCHEDULE:saved]
//   Free-text schedule here (no closing tag — block ends at next [...] or EOF)
// Also still handles [SCHEDULE]...[/SCHEDULE] as a fallback.

export function parseSchedule(raw = "") {
  // ── Format A (system-prompt): [SCHEDULE:saved] with no closing tag ─────────
  // Content runs from after the tag until the next [...] tag or end of string.
  const openMatch = raw.match(/\[SCHEDULE:[^\]]*\]([\s\S]*?)(?=\[[A-Z_\/]|$)/i);
  if (openMatch) {
    const text = openMatch[1].trim();
    if (text) {
      return {
        clean: raw.replace(openMatch[0], "").trim(),
        data:  { text, generatedAt: new Date().toLocaleString() },
      };
    }
  }

  // ── Format B (fallback): [SCHEDULE]...[/SCHEDULE] ──────────────────────────
  const blockMatch = raw.match(/\[SCHEDULE\]([\s\S]*?)\[\/SCHEDULE\]/i);
  if (!blockMatch) return { clean: raw, data: null };

  return {
    clean: raw.replace(blockMatch[0], "").trim(),
    data:  { text: blockMatch[1].trim(), generatedAt: new Date().toLocaleString() },
  };
}

// ─── Learning style ───────────────────────────────────────────────────────────
// FIX: now handles the actual system-prompt format:
//   [STYLE:primary=Visual,secondary=Auditory]
// Also still handles [LEARNING_STYLE]...[/LEARNING_STYLE] as a fallback.

export function parseLearningStyle(raw = "") {
  // ── Format A (system-prompt): [STYLE:primary=X,secondary=Y] ─────────────
  const inlineMatch = raw.match(/\[STYLE:([^\]]+)\]/i);
  if (inlineMatch) {
    const parts     = inlineMatch[1].split(",");
    const primaryPart   = parts.find((p) => /^primary=/i.test(p.trim()));
    const secondaryPart = parts.find((p) => /^secondary=/i.test(p.trim()));

    const primary   = primaryPart?.split("=")[1]?.trim() ?? null;
    const secondary = secondaryPart?.split("=")[1]?.trim() ?? null;

    if (!primary) return { clean: raw, data: null };

    return {
      clean: raw.replace(inlineMatch[0], "").trim(),
      data:  { primary, secondary },
    };
  }

  // ── Format B (fallback): [LEARNING_STYLE]...[/LEARNING_STYLE] ────────────
  const blockMatch = raw.match(/\[LEARNING_STYLE\]([\s\S]*?)\[\/LEARNING_STYLE\]/i);
  if (!blockMatch) return { clean: raw, data: null };

  const primaryMatch   = blockMatch[1].match(/primary:\s*(.+)/i);
  const secondaryMatch = blockMatch[1].match(/secondary:\s*(.+)/i);
  const primary        = primaryMatch?.[1]?.trim() ?? null;
  if (!primary) return { clean: raw, data: null };

  return {
    clean: raw.replace(blockMatch[0], "").trim(),
    data:  { primary, secondary: secondaryMatch?.[1]?.trim() ?? null },
  };
}

// ─── Navigate tag ─────────────────────────────────────────────────────────────
// FIX: now handles the actual system-prompt format [NAV:/path] in addition to
// the old [NAVIGATE:page-slug] format.
//
// Examples from system prompt:
//   [NAV:/flashcards]
//   [NAV:/similarity?surah=2&ayah=255]

export function parseNavigate(raw = "") {
  // ── Format A (system-prompt): [NAV:/path] ────────────────────────────────
  const navMatch = raw.match(/\[NAV:([^\]]+)\]/i);
  if (navMatch) {
    return {
      clean: raw.replace(navMatch[0], "").trim(),
      data:  { page: navMatch[1].trim().replace(/^\//, "") }, // strip leading /
    };
  }

  // ── Format B (fallback): [NAVIGATE:page-slug] ────────────────────────────
  const navigateMatch = raw.match(/\[NAVIGATE:([^\]]+)\]/i);
  if (!navigateMatch) return { clean: raw, data: null };

  return {
    clean: raw.replace(navigateMatch[0], "").trim(),
    data:  { page: navigateMatch[1].trim() },
  };
}

// ─── Sensory Profile tag ───────────────────────────────────────────────────────
// Format: [SENSORY_PROFILE:profile_name]
// Examples: [SENSORY_PROFILE:Exploratory Learner]

export function parseSensoryProfile(raw = "") {
  const profileMatch = raw.match(/\[SENSORY_PROFILE:([^\]]+)\]/i);
  if (!profileMatch) return { clean: raw, data: null };

  const profile = profileMatch[1].trim();
  const validProfiles = [
    "Exploratory Learner",
    "Repetitive Learner",
    "Sensitive Structured Learner",
    "Balanced Learner",
  ];

  const normalizedProfile = validProfiles.find((p) =>
    p.toLowerCase() === profile.toLowerCase()
  );

  if (!normalizedProfile) return { clean: raw, data: null };

  return {
    clean: raw.replace(profileMatch[0], "").trim(),
    data:  { profile: normalizedProfile },
  };
}

// ─── Run all parsers in one pass ──────────────────────────────────────────────
export function parseAllCommands(raw = "") {
  let text          = raw;
  let flashcards    = null;
  let weeklyCycle   = null;
  let schedule      = null;
  let learningStyle = null;
  let navigate      = null;
  let sensoryProfile  = null;

  { const r = parseFlashcards(text);    text = r.clean; flashcards    = r.data; }
  { const r = parseWeeklyCycle(text);   text = r.clean; weeklyCycle   = r.data; }
  { const r = parseSchedule(text);      text = r.clean; schedule      = r.data; }
  { const r = parseLearningStyle(text); text = r.clean; learningStyle = r.data; }
  { const r = parseNavigate(text);      text = r.clean; navigate      = r.data; }
  { const r = parseSensoryProfile(text);  text = r.clean; sensoryProfile  = r.data; }

  return { displayText: text.trim(), flashcards, weeklyCycle, schedule, learningStyle, navigate, sensoryProfile };
}