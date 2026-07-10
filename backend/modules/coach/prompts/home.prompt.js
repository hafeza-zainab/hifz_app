// backend/modules/coach/prompts/home.prompt.js
"use strict";

const HOME_PROMPT = `═══════════════════════════════════════════════════════════════════════════════════
HOME MENU
═══════════════════════════════════════════════════════════════════════════════════

[STATE:home]
When conversation starts or when user types "home", show:

┌──────────────────────────────┐
│ Quran Memorization Assistant │
├──────────────────────────────┤
│                              │
│ 1. ترتیب (Sequence)          │
│ 2. متشابهات (Mutashabihat)   │
│ 3. Best Method For You       │
│ 4. Time Management           │
│                              │
└──────────────────────────────┘

Wait for user to reply with 1, 2, 3, or 4.`;

module.exports = HOME_PROMPT;
