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

*(Sections 1 & 2 have been completed. Module 3 below.)*

---

## 3. Backend — modules/diary (Hifz Diary Logging & Streak System)

### Overview
The diary module manages user progress logging (5 entry types: MURAJAH, TASMEE, IKHTEBAR, JADEED, JUZ HALI), streak calculation, and heatmap aggregation for page strength. It feeds data into the scheduler. Well-organized with clear separation into entry-type sub-controllers and shared repositories.

### Dead Files

#### Legacy Compatibility Shims (Intentional)
- **`backend/modules/diary/diary.repository.js`** — **Intentional shim, not dead**. All diary sub-services (`murajah.service.js`, `tasmee.service.js`, etc.) require this file, but it's just a re-export of `backend/repositories/diary.repository.js` (see line 18). This is a **deliberate backward-compatibility layer** with clear documentation (lines 3–16). OK to keep as-is, but consider removing it after updating all services to import directly from repositories/.
- **`backend/modules/themes/theme.model.js`** — **Intentional shim, DEPRECATED**. Re-exports `backend/repositories/theme.repository.js` (line 13). Comment on lines 3–9 explicitly states it's kept for backward compatibility and will be removed in next cleanup. Diary controllers still use this (see `murajah.controller.js:3`). OK to keep for now.

#### Summary
No truly dead files. Both shims serve a purpose (compatibility during refactoring) and are clearly marked. **Recommendation:** Track these in a cleanup task for next sprint.

### Dead Code

#### Within `diary.routes.js`
- **Lines 53–59:** Takhteet (Jadeed planning) routes are present but **not fully integrated with the diary flow**. These routes exist but it's unclear if they're used by the frontend. **Flag for review:** Check if takhteetGoal.repository.js and takhteet.controller.js are actually called.
- **No console.log spam** — Clean routes file.

#### Within Diary Entry Services
- **`murajah.service.js:6–10`** — Loop through entries with a simple continue check. Not dead code, but the logic is minimal. OK.
- **`murajah.controller.js:14`** — Calls `ThemeModel.incrementStreak()` after every murajah log. This is intentional (updates streak), not dead.

#### Unused Parameters / Incomplete Logic
- **`diary.repository.js:41–53`** — `createLog()` function has optional parameters for `startPage`, `finishPage`, `startJuz`, `finishJuz`. These are used conditionally (line 42), but it's unclear if they're ever passed by callers. **Action:** Search codebase to verify these parameters are actually used (likely only by jadeed).

### UI Consistency
*Not applicable to backend module.*

### Architecture

#### Current Structure
```
backend/modules/diary/
├── diary.routes.js                (Aggregator routes, 61 lines)
├── diary.repository.js            (Compatibility shim, 18 lines)
├── murajah/
│   ├── murajah.controller.js      (16 lines)
│   └── murajah.service.js         (12 lines)
├── tasmee/                        (Similar structure)
├── ikhtebar/                      (Similar structure)
├── jadeed/
│   ├── jadeed.controller.js       (13 lines)
│   └── jadeed.service.js          (40 lines)
├── juzzHali/                      (Similar structure)
├── log/
│   └── log.controller.js          (Update/delete individual logs)
└── takhteet/                      (Jadeed planning feature)

backend/repositories/
├── diary.repository.js            (Real implementation, 227 lines)
├── heatmap.repository.js          (Heatmap scores table, 41 lines)
└── theme.repository.js            (Streak & theme data, 127 lines)
```

#### Observations

**1. Clean Entry-Type Segregation**
- Each diary type (murajah, tasmee, ikhtebar, jadeed, juz_hali) has its own controller + service
- Each service calls `diaryRepo.createLog()` with different parameters
- Reduces code bloat compared to a single monolithic controller

**2. Dual Data Sources for Heatmap**
- **Issue:** Two separate data sources compute page strength:
  1. **`diary_logs` table via `diary.repository.getHeatmapAggregates()`** — queries `diary_logs` where `type = 'murajah'` and `range_from LIKE '%Page%'` (line 188–200). Returns `[{page_ref, score, entry_count}]`.
  2. **`heatmap_scores` table via `heatmap.repository.getScoresByUser()`** — explicit per-page scores (line 17–26). Returns `[{juz, page, score}]`.
  
  **Problem:** These may diverge if:
  - Diary logs are updated but heatmap_scores is not
  - Scheduler uses one source, analytics uses the other
  - Frontend receives conflicting data
  
  **Risk:** The scheduler (`tmWizard.controller.js:314`) fetches from `heatmapRepo.getScoresByUser()` (heatmap_scores table), but the diary analytics might show different results from diary_logs. This is a **data consistency issue**. **See section 11 for proposed fix.**

**3. Streak Logic Solid but Date-Dependent**
- `theme.repository.incrementStreak()` (lines 50–70) correctly handles:
  - Already logged today → no-op
  - Logged yesterday → streak + 1
  - Gap in logs → reset to 1
- **Issue:** Date comparison uses ISO strings split on "T" (line 54–55). This is timezone-sensitive and fragile. Should use SQL date functions consistently.
- **Issue:** `last_log_date` stores only the date, losing time information. If user logs twice in one day (on different dates per their timezone), streak might reset incorrectly.

**4. N+1 Risk in Theme Switching**
- `switchTheme()` (lines 88–125) fetches active theme (line 51), then fetches target theme (line 104), then does updates.
- If called multiple times, could be optimized, but low risk (usually called once per session).

### Data / Control Flow

#### Diary Entry Creation Flow
```
POST /api/diary/murajah
  Body: { entries: [{range_from: "Juz 1 Page 1", range_to: "", score: 8}, ...], date: "2026-07-10" }
    ↓
diary.routes.js → murajah.controller.addMurajahLog()
    ├─ Validate: entries is array, non-empty
    ├─ Call murajah.service.createMurajahLogs(userId, entries, date)
    │   └─ For each entry:
    │       └─ diary.repository.createLog(userId, "murajah", range_from, range_to, score, date)
    │           └─ INSERT INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
    ├─ Increment streak: theme.repository.incrementStreak(userId)
    │   └─ Fetch last_log_date, compare to today/yesterday
    │   └─ UPDATE user_themes SET streak, max_streak, last_log_date
    └─ Response: { logged: count }
```

**Data Shape:** `diary_logs` table has columns:
- `id, user_id, type, range_from, range_to, score, created_at`
- Plus optional: `start_page, finish_page, start_juz, finish_juz` (used by jadeed)

**Issue:** `range_from` and `range_to` are free-text strings (e.g., "Juz 1 Page 15"). Frontend must parse these to extract page numbers for the heatmap. **Brittle data contract** — if parsing logic differs between frontend and backend, data mismatches occur.

#### Heatmap Aggregation Flow
```
GET /api/diary/heatmap
    ↓
diary.repository.getHeatmapAggregates(userId)
    └─ SELECT AVG(score) FROM diary_logs 
       WHERE type='murajah' AND range_from LIKE '%Page%'
       GROUP BY range_from
    ↓
Response: [{ page_ref: "Juz 1 Page 15", score: 7.5, entry_count: 4 }, ...]
```

**Issue:** Parsing happens on client side. Frontend must extract page number from `"Juz X Page Y"` string. If format changes, frontend breaks.

#### Streak Increment Logic (with edge case)
```
Rules:
  - Already logged today?           → return current row (no change)
  - Last log was yesterday?         → streak + 1, max_streak = max(max_streak, new_streak)
  - Last log was earlier?           → reset streak to 1
  - No active theme?                → return null

Timezone Risk:
  - Uses .split("T")[0] which is UTC-based
  - If user's local date differs from UTC date, streak may miscalculate
```

### Duplication

#### Score-to-Time Mapping
- **`diary.repository.getHeatmapAggregates()`** queries raw diary logs (averaged score)
- **`tmWizard.controller.getTimePerPage()`** (coach module) has separate score-to-time mapping
- These should be unified in a shared constants file. **See section 11.**

#### Date String Formatting
- `theme.repository.incrementStreak():54–55` uses `.split("T")[0]` to extract date
- Similar logic likely duplicated elsewhere (coach, analytics)
- Should be centralized in `backend/utils/dateUtils.js`

#### Entry Type Validation
- Each sub-controller (murajah, tasmee, etc.) validates `entries` parameter independently
- `diary.routes.js:12` defines `batchEntryRules`
- Validation is centralized (good), but `jadeedRules` is separate (line 14–18)
- **Minor inconsistency:** Different entry types have different validation rules passed to middleware, but the actual validation calls are duplicated in each controller

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Dual heatmap data sources (diary_logs vs heatmap_scores) | **Critical** | Data consistency issue, conflicting UI data |
| Brittle data contract (free-text range_from/range_to) | **Moderate** | Frontend parsing errors, maintenance burden |
| Timezone-sensitive streak logic | **Moderate** | Potential streak miscalculations across timezones |
| Compatibility shims (diary.repository.js, theme.model.js) | **Minor** | Tech debt, should be removed in next cleanup |
| Optional jadeed parameters possibly unused | **Minor** | Dead parameters (needs verification) |
| Date string formatting duplicated across modules | **Minor** | Code duplication, should centralize |
| Takhteet routes unclear if used | **Minor** | Possible dead feature (needs verification) |

---

*Audit continues with module 4 (Backend — remaining modules) next.*
