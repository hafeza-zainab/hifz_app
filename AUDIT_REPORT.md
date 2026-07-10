# Hifz al-Quran Platform — Structural Audit Report

**Audit Date:** 2026-07-10  
**Repository:** hafeza-zainab/hifz_app  
**Scope:** Full read-only analysis (React frontend, Node.js/Express backend, SQLite database)  
**Status:** In progress — module-by-module analysis

---

## Table of Contents

- [1. Backend — modules/coach (Scheduler/Time Management)](#1-backend--modulescoach-schedulertime-management)
- [2. Backend — modules/similarity](#2-backend--modulessimilarity)
- [3. Backend — modules/diary](#3-backend--modulesdiary)
- [4. Backend — remaining modules](#4-backend--remaining-modules)
- [5. Frontend — features/scheduler](#5-frontend--featuresscheduler)
- [6. Frontend — features/flashcards](#6-frontend--featuresflashcards)
- [7. Frontend — features/diary](#7-frontend--featuresdiary)
- [8. Frontend — features/similarity](#8-frontend--featuressimilarity)
- [9. Frontend — shared/](#9-frontend--shared)
- [10. Frontend — remaining features](#10-frontend--remaining-features)
- [11. Cross-cutting issues & proposed architecture](#11-cross-cutting-issues--proposed-architecture)

---

## 1. Backend — modules/coach (Scheduler/Time Management)

### Overview
The coach module handles time management wizards, flashcard creation/management, and sensory profile assessment. It's the most complex and historically bug-prone area.

### Dead Files
- **`backend/cleanup-duplicate-events.js`** — **DEAD**: v1 cleanup script for duplicate scheduler events; superseded by `cleanup-duplicate-events-v2.js`. Not imported anywhere. Called manually as a one-time script. **Recommendation:** Keep but mark as legacy; archive or delete after confirming v2 is stable.
- **`backend/a`** — **DEAD**: Empty placeholder file. No purpose. **Delete.**

### Dead Code

#### Within `tmWizard.controller.js` (Time Management Wizard)
- **Lines 26–29, 60, 97, 98, 148, 193, 194:** Extensive console.log statements left over from development. Many are commented as debug output (e.g., `'=== ANALYSIS DEBUG ==='`, `'=== WEEKLY CYCLE DEBUG ==='`). These should be replaced with structured logging (logger module) or removed for production. **Priority:** Moderate (tech debt).
- **Lines 509–572:** `formatScheduleWithLLM()` helper function — **dead code path**. This function is called on line 509 but the result (`formattedSchedule`) is returned as `formattedText` on line 513. However, the frontend may not be consuming this formatted text (needs frontend verification). **Flag for review:** check if frontend uses the `formattedText` response field.

#### Within `sequenceWizard.controller.js` (Sequence Wizard)
- **Lines 75–79, 184–188, 231–232, 264–274, 283, 306–307, 315:** Debug console.log statements throughout all sequence endpoints. Similar pattern to tmWizard. **Priority:** Moderate.
- **Lines 393–422:** `formatSequenceWithLLM()` helper function — **never called**. Defined but not invoked anywhere. **Action:** Remove or document why it exists.

#### Within `flashcard.routes.js`
- **Lines 12–31:** Debug route `/api/flashcards/debug-tables` — **DEAD** unless explicitly used by developers. This is a database introspection endpoint that exposes table schema. Should be removed or gated behind an admin/dev middleware. **Priority:** Critical (security).
- **Lines 45–47, 71, 76, 93, 97, 99:** Console.log debug statements in production routes. **Priority:** Moderate.

#### Unused Exports / Helpers
- **`groqClient.js`:** Exports `callGroq()` but it's **never imported or used** in the codebase. The code makes direct Groq API calls via fetch instead (see `tmWizard.controller.js:552` and `sequenceWizard.controller.js:401`). This is a duplication issue (see section 6). **Priority:** Critical.

### UI Consistency
*Not applicable to backend module.*

### Architecture

#### Current Structure
```
backend/modules/coach/
├── tmWizard.controller.js          (Time Management wizard, 574 lines)
├── sequenceWizard.controller.js    (Sequence wizard for flashcards, 423 lines)
├── sensoryProfileWizard.controller.js
├── sensoryProfileWizard.routes.js
├── flashcard.routes.js             (Flashcard CRUD, 228 lines)
├── chat.routes.js                  (Chat/coach dialogue, 15K lines)
├── tmWizard.routes.js
├── sequenceWizard.routes.js
├── groqClient.js                   (Unused Groq wrapper, 99 lines)
├── promptBuilder.js                (Prompt formatting utility)
├── coach.system-prompt.js          (System prompt for coach, 26K lines)
└── prompts/                        (Prompt files)
```

#### Issues

**1. Bloated Controllers (Critical)**
- `tmWizard.controller.js` (574 lines) and `sequenceWizard.controller.js` (423 lines) contain mixed concerns:
  - DB queries (via repositories)
  - Business logic (cycle generation, scheduling)
  - API response formatting
  - LLM calls
  
  **Should be split:** Controllers should delegate to service classes. Example:
  ```javascript
  // Current: all in controller
  exports.analyzeProgress = async (req, res, next) => {
    const heatmapData = await heatmapRepo.getScoresByUser(userId);
    // 120+ lines of analysis logic here
  };
  
  // Proposed: extract to service
  exports.analyzeProgress = async (req, res, next) => {
    const analysis = await progressAnalysisService.analyze(userId);
    res.json(formatSuccess(analysis));
  };
  ```

**2. Inconsistent Data Contract Across Wizards**
- `tmWizard.generateWeeklyCycle()` returns: `{ day, siparas: [...] }`
- `sequenceWizard.getJuzSurahSequence()` returns: `{ juzNumber, surahs: [...] }`
- No consistent wrapper or naming convention for wizard step responses.
  **Risk:** Frontend must handle each wizard's response shape differently. Increases coupling and bug surface area.

**3. Circular Dependency Risk**
- `tmWizard.controller.js` imports `sequenceWizard.controller.js` implicitly (not directly, but via coach routes that mount both). If either gets refactored, breakage is likely.
- Shared utilities (`promptBuilder.js`, `groqClient.js`) not used consistently; some routes import, some don't.

#### Historical Bug Pattern: Day-of-Week Indexing
- **Evidence:** Two dead cleanup scripts (`cleanup-duplicate-events.js`, `cleanup-duplicate-events-v2.js`) exist specifically to fix a recurring bug where **template application created one row per day instead of one row with merged daysOfWeek array**.
- **Root Cause:** Inconsistent interpretation of `daysOfWeek` array semantics across different controllers/repositories.
- **Impact:** This bug has occurred at least twice, suggesting the data contract is fragile.

### Data / Control Flow

#### Time Management Wizard (8 Steps)
1. **Step 2 (Analyze Progress):** `POST /api/coach/wizard/tm/analyze`
   - Input: `{ useCurrentLogs: boolean }`
   - DB: Fetches heatmap scores per user
   - Output: `{ completedMarhalas, currentMarhala, currentSipara, currentPage, allActiveSiparas, strongPages, weakPages, veryWeakPages, estimatedWorkload }`
   - **Issue:** `useCurrentLogs` parameter is accepted but **never used** in the logic. Always uses current heatmap data. Dead parameter. **Action:** Remove or implement.

2. **Step 3 (Generate Weekly Cycle):** `POST /api/coach/wizard/tm/cycle`
   - Input: `{ analysisData: object }`
   - Output: `{ day: string, siparas: [...] }[]` (7 days)
   - **Issue:** Uses `allActiveSiparas` from analysis to distribute siparas evenly across days using modulo arithmetic (lines 261–265). Logic is deterministic but complex; unclear if it handles edge cases (e.g., 1 active sipara, 30+ active siparas).

3. **Step 9 (Generate Schedule):** `POST /api/coach/wizard/tm/generate`
   - Input: `{ weeklyCycle, dailySchedule, frequency, exceptions, timeInputs, preferences }`
   - **Data Shape Mismatch:** `weeklyCycle` is expected but `frequency`, `exceptions`, `preferences` are accepted but **not always used** in the logic. Lines 287–289 log them, but the actual scheduling (lines 317–504) primarily uses `weeklyCycle`, `dailySchedule`, `exceptions`, and `timeInputs`.
   - **Flow:** 
     1. Fetch heatmap data for page scores
     2. For each day in `weeklyCycle`, calculate free time by merging `dailySchedule` fixedEvents + `exceptions`
     3. Reserve time for Jadeed (45 min) + Juz Hali (20 min)
     4. Allocate remaining time to Muraja'ah (revision) based on page scores
     5. Format with LLM for readability (line 509)
   - **Issue:** `getTimePerPage()` (lines 302–310) uses hardcoded score-to-time mapping. If Diary marks scale changes, this breaks. Should be a configuration constant.

4. **Step 10 (Save Schedule):** `POST /api/coach/wizard/tm/save`
   - Input: `{ schedule: object }`
   - **Issue:** Controller accepts schedule but **does not persist it**. Comment on line 531 says "In production, this would save to a schedules table." This is incomplete. **Critical:** The generated schedule is never saved; users cannot retrieve it later.

#### Sequence Wizard (Flashcard Creation)
1. **Surah Sequence:** `POST /api/coach/wizard/sequence/surah`
   - Fetches ayahs by surah, orders by ayah number, returns first/last 3 words based on mode.
   - **Data shape:** `{ surahName, surahNumber, mode, ayahs: [...], ayahCount, juzInfo, pageInfo, neighboringSurahs }`

2. **Page Sequence:** `POST /api/coach/wizard/sequence/page`
   - Fetches ayahs on page, orders by surah+ayah, fetches neighboring page ayahs separately.
   - **Data shape:** `{ pageNumber, mode, ayahs: [...], firstAyah, firstAyahText, lastAyah, lastAyahText, neighboringAyahs }`
   - **Issue:** Fetches neighboring ayahs one by one (lines 152–177) instead of batching queries. Performance issue if many pages.

3. **Juz Pages Sequence:** `POST /api/coach/wizard/sequence/juz-pages`
   - Fetches pages by juz, then for each page, fetches ayahs to get first/last word.
   - **Issue:** N+1 query problem (line 260: `await Promise.all(...)`). If juz has 20 pages, this makes 21 DB calls.

4. **Juz Surah Sequence:** `POST /api/coach/wizard/sequence/juz-surahs`
   - Fetches surahs by juz, then for each surah, fetches first ayah separately.
   - **Issue:** N+1 query problem again (line 359: `await Promise.all(...)`).

### Duplication

#### Groq API Calls
**Issue:** API calls to Groq are duplicated across multiple files:
1. `tmWizard.controller.js:544–572` — `formatScheduleWithLLM()`
2. `sequenceWizard.controller.js:393–422` — `formatSequenceWithLLM()` (never called)
3. `chat.routes.js` (large file, not fully reviewed yet) — likely more Groq calls

**Each duplicates:**
- Fetch setup (method, headers, Auth header, body)
- Error handling
- Response parsing
- Hardcoded model ("llama-3.3-70b-versatile") and temperature (0.7 or 0.3)

**Note:** `groqClient.js` exists but is unused, suggesting this duplication was not caught.

#### Day Array Mappings
- `sequenceWizard.controller.js:221` — hardcoded `const days = ['SUNDAY', 'MONDAY', ..., 'SATURDAY']`
- Similar arrays likely exist in diary, scheduler, and frontend modules (to be verified in later passes).
- Should be centralized in `backend/shared/constants/` or similar.

#### Page Score-to-Time Mapping
- `tmWizard.controller.js:302–310` — `getTimePerPage()` hardcodes: Excellent=1min, Very Good=2min, Good=3min, Fair=4min, Poor=5min
- This logic is **not shared** across the codebase; duplicated if referenced elsewhere (to be verified).

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Debug route `/api/flashcards/debug-tables` exposes schema | **Critical** | Security vulnerability |
| Schedule not persisted (step 10 incomplete) | **Critical** | Feature broken |
| Unused `groqClient.js` module; Groq calls duplicated | **Critical** | Code duplication, maintenance burden |
| console.log spam across controllers | **Moderate** | Noise in logs, tech debt |
| N+1 queries in sequence wizard | **Moderate** | Performance issue for large data |
| `useCurrentLogs` parameter unused | **Minor** | Dead parameter |
| `formatSequenceWithLLM()` never called | **Minor** | Dead code |
| Bloated controllers (500+ lines each) | **Moderate** | Maintainability, testability |
| Inconsistent wizard response shapes | **Moderate** | Frontend coupling, error surface |
| Day-of-week indexing bug history | **Critical** | Recurring architectural flaw |

---

*Audit continues with modules 2–10 below. See section 11 for cross-cutting analysis.*
