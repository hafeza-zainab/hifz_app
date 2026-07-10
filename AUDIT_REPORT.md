# Hifz al-Quran Platform — Structural Audit Report

**Audit Date:** 2026-07-10
**Repository:** hafeza-zainab/hifz_app
**Scope:** Full read-only analysis (React frontend, Node.js/Express backend, SQLite database)
**Status:** In progress — module-by-module analysis

---

## Table of Contents

- [1. Backend — modules/coach (Scheduler/Time Management)](#1-backend--modulescoach-schedulertime-management) *(completed previously — not reproduced in this file)*
- [2. Backend — modules/similarity](#2-backend--modulessimilarity) *(completed previously — not reproduced in this file)*
- [3. Backend — modules/diary](#3-backend--modulesdiary)
- [4. Backend — remaining modules](#4-backend--remaining-modules)
- [5. Frontend — features/scheduler](#5-frontend--featuresscheduler)
- [6. Frontend — features/flashcards](#6-frontend--featuresflashcards)
- [7. Frontend — features/diary](#7-frontend--featuresdiary)
- [8. Frontend — features/similarity](#8-frontend--featuressimilarity)
- [9. Frontend — shared/](#9-frontend--shared) *(pending)*
- [10. Frontend — remaining features](#10-frontend--remaining-features) *(pending)*
- [11. Cross-cutting issues & proposed architecture](#11-cross-cutting-issues--proposed-architecture) *(pending)*

---

## 3. Backend — modules/diary (Hifz Diary Logging & Streak System)

### Overview
The diary module manages user progress logging (5 entry types: MURAJAH, TASMEE, IKHTEBAR, JADEED, JUZ HALI), streak calculation, and heatmap aggregation for page strength. It feeds data into the scheduler. Well-organized with clear separation into entry-type sub-controllers and shared repositories.

### Dead Files

#### Legacy Compatibility Shims (Intentional)
- **`backend/modules/diary/diary.repository.js`** — Intentional shim, not dead. All diary sub-services (`murajah.service.js`, `tasmee.service.js`, etc.) require this file, but it's just a re-export of `backend/repositories/diary.repository.js` (line 18). Deliberate backward-compatibility layer with clear documentation (lines 3–16). OK to keep as-is; consider removing once all services import directly from `repositories/`.
- **`backend/modules/themes/theme.model.js`** — Intentional shim, deprecated. Re-exports `backend/repositories/theme.repository.js` (line 13). Comment (lines 3–9) states it's kept for backward compatibility and will be removed in the next cleanup. Diary controllers still use this (`murajah.controller.js:3`). OK to keep for now.

**Summary:** No truly dead files. Both shims serve a purpose (compatibility during refactoring) and are clearly marked. **Recommendation:** track these in a cleanup task for next sprint.

### Dead Code

- **`diary.routes.js:53–59`** — Takhteet (Jadeed planning) routes present but not fully integrated with the diary flow. Flag for review: confirm `takhteetGoal.repository.js` and `takhteet.controller.js` are actually called.
- **`murajah.service.js:6–10`** — Loop through entries with a simple continue check. Minimal logic, not dead.
- **`murajah.controller.js:14`** — Calls `ThemeModel.incrementStreak()` after every murajah log. Intentional (updates streak).
- **`diary.repository.js:41–53`** — `createLog()` has optional parameters (`startPage`, `finishPage`, `startJuz`, `finishJuz`) used conditionally (line 42). Unclear if all callers pass them. **Action:** verify usage (likely only jadeed).

### Architecture

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

**1. Clean Entry-Type Segregation** — Each diary type (murajah, tasmee, ikhtebar, jadeed, juz_hali) has its own controller + service, each calling `diaryRepo.createLog()` with different parameters. Reduces bloat vs. a monolithic controller.

**2. Dual Data Sources for Heatmap (Critical)**
Two separate data sources compute page strength:
1. `diary_logs` table via `diary.repository.getHeatmapAggregates()` — queries `diary_logs` where `type = 'murajah'` and `range_from LIKE '%Page%'` (lines 188–200); returns `[{page_ref, score, entry_count}]`.
2. `heatmap_scores` table via `heatmap.repository.getScoresByUser()` — explicit per-page scores (lines 17–26); returns `[{juz, page, score}]`.

**Problem:** these can diverge if diary logs are updated but `heatmap_scores` is not, or if the scheduler and analytics read from different sources. The scheduler (`tmWizard.controller.js:314`) reads from `heatmap_scores`, while diary analytics may show different results from `diary_logs`. This is a genuine data-consistency issue (see Section 11).

**3. Streak Logic Solid but Date-Dependent**
`theme.repository.incrementStreak()` (lines 50–70) correctly handles: already logged today (no-op), logged yesterday (streak +1), gap (reset to 1). However:
- Date comparison uses ISO strings split on `"T"` (line 54–55) — timezone-sensitive and fragile; should use SQL date functions consistently.
- `last_log_date` stores only the date, losing time information, which can cause incorrect streak resets across timezones.

**4. N+1 Risk in Theme Switching**
`switchTheme()` (lines 88–125) fetches active theme, then target theme, then updates. Low risk in practice (usually called once per session) but could be optimized.

### Data / Control Flow

**Diary Entry Creation:**
```
POST /api/diary/murajah
  Body: { entries: [{range_from: "Juz 1 Page 1", range_to: "", score: 8}, ...], date: "2026-07-10" }
    ↓
murajah.controller.addMurajahLog()
    ├─ Validate: entries is array, non-empty
    ├─ murajah.service.createMurajahLogs(userId, entries, date)
    │   └─ diary.repository.createLog(userId, "murajah", range_from, range_to, score, date)
    │       └─ INSERT INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
    ├─ theme.repository.incrementStreak(userId)
    └─ Response: { logged: count }
```

`diary_logs` columns: `id, user_id, type, range_from, range_to, score, created_at`, plus optional `start_page, finish_page, start_juz, finish_juz` (jadeed only).

**Issue:** `range_from`/`range_to` are free-text strings (e.g., `"Juz 1 Page 15"`). The frontend must parse these to extract page numbers for the heatmap — a brittle data contract.

**Heatmap Aggregation:**
```
GET /api/diary/heatmap
  → diary.repository.getHeatmapAggregates(userId)
    SELECT AVG(score) FROM diary_logs
    WHERE type='murajah' AND range_from LIKE '%Page%'
    GROUP BY range_from
  → [{ page_ref: "Juz 1 Page 15", score: 7.5, entry_count: 4 }, ...]
```
Parsing of `page_ref` happens client-side; if the string format changes, the frontend breaks.

### Duplication
- **Score-to-time mapping:** `diary.repository.getHeatmapAggregates()` vs. `tmWizard.controller.getTimePerPage()` (coach module) — should be unified in a shared constants file.
- **Date string formatting:** `.split("T")[0]` pattern in `theme.repository.incrementStreak()` and likely elsewhere — should be centralized in `backend/utils/dateUtils.js`.
- **Entry type validation:** each sub-controller validates `entries` independently; `diary.routes.js` centralizes rule definitions (`batchEntryRules`, `jadeedRules`) but the validation calls themselves are duplicated per controller.

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Dual heatmap data sources (diary_logs vs heatmap_scores) | **Critical** | Data consistency issue, conflicting UI data |
| Brittle data contract (free-text range_from/range_to) | **Moderate** | Frontend parsing errors, maintenance burden |
| Timezone-sensitive streak logic | **Moderate** | Potential streak miscalculations across timezones |
| Compatibility shims (diary.repository.js, theme.model.js) | **Minor** | Tech debt, remove in next cleanup |
| Optional jadeed parameters possibly unused | **Minor** | Needs verification |
| Date string formatting duplicated across modules | **Minor** | Should centralize |
| Takhteet routes unclear if used | **Minor** | Possible dead feature (needs verification) |

---

## 4. Backend — Remaining Modules (Analytics, Auth, Ayah, Tasks, Scheduler)

### Overview
Five independent backend modules:
1. **Analytics** — trend & deep-dive reporting, heatmap retrieval
2. **Auth** — registration, login, password management, sensory profile
3. **Ayah** — Quran text/context retrieval (public, no auth)
4. **Tasks** — daily task tracking & streak management
5. **Scheduler** — intelligent schedule generation (minimal implementation, mostly stubs)

### 4.1 Analytics (`backend/modules/analytics/`)

- `analytics.controller.js` (105 lines, 4 exports), `analytics.routes.js` (12 lines: GET /trend, GET /deep-dive, GET /heatmap, POST /heatmap).
- Uses two repositories (`diaryRepo` + `heatmapRepo`), mirroring the dual-source problem in Module 3.
- `toDateStr()` (line 27) duplicates diary-module date logic; `addDays()` (line 29) does manual UTC arithmetic.
- `POST /heatmap` saves scores to `heatmap_scores` independently of `diary_logs`, so the two can diverge if a user logs diary entries and separately saves heatmap scores.
- `getTrend()` fills date gaps with nulls and converts scores to a 0–100 percentage; `getDeepDive()` filters by type/juz (capped at 500 rows); `getHeatmapData()`/`saveHeatmapData()` wrap the heatmap repository.

**Severity:** Low — inherits the dual-source problem from diary but has no independent major issues.

### 4.2 Auth (`backend/modules/auth/`)

- `auth.controller.js` (116 lines): signup, login, getMe, changePassword, updateSensoryProfile, markWalkthroughSeen.
- `auth.routes.js` (58 lines, 6 routes: 2 public + 4 protected).
- **Two data-access layers:** `user.model.js` (legacy) and `auth.repository.js` (new) with identical method signatures — duplication from an in-progress refactor.
- **Good security:** bcrypt (12-round salt), timing-safe login (dummy hash comparison when user not found), JWT with expiration (7 days default), password validation (≥8 chars, 1 uppercase, 1 digit).
- **Good validation:** comprehensive rules middleware plus rate limiting on public routes.
- **Console spam:** `auth.controller.js:101,104`; `user.model.js:7,15`; `auth.repository.js:19,31,43` — should use a debug logger, not `console.log`.
- **Duplicate methods** across `user.model.js` and `auth.repository.js`: `findById`, `findByEmail`, `findByUsername`, `createUser`, `updatePassword`, `updateSensoryProfile`. Recommend deleting `user.model.js` once the frontend imports `auth.repository` exclusively.
- **Bug:** `auth.controller.js:113` calls `authRepo.updateWalkthroughSeen()`, but this method is **not exported** from `auth.repository.js` — it only exists in the old `user.model.js`. Calling the `markWalkthroughSeen` route will throw.

**Severity:** Low–Moderate — dead code duplication, console spam, and a real bug (missing `updateWalkthroughSeen` in the active repository).

### 4.3 Ayah (`backend/modules/ayah/`)

- `ayah.controller.js` (170 lines, 11 exports), `ayah.routes.js` (27 lines, careful route ordering — specific before generic, documented), `ayah.model.js` (139 lines) — **dead**, replaced by `ayah.repository.js`.
- Public routes (no auth) for read-only Quran reference data — appropriate.
- Controllers: `getSurahs`, `getAyahsBySurah`, `getSingleAyah`, `getAyahContext`, `getPageDetails`, `getJuzPages`, `getPagesInRange`, `getFirstWords` (extracts first 3 Arabic words, skipping diacritics), `getPageFull`, `getSurahFull`, `getJuzFull`.
- **Console spam:** `ayah.controller.js:115–116` — debug logs in `getPageFull()`. Should be removed or gated behind a debug logger.
- `extractFirstThreeWords()` (lines 10–22) is well-implemented (regex-based diacritic cleanup + Arabic detection).
- Minor duplication: several routes perform similar ayah-object transformations that could be consolidated into a shared utility.

**Severity:** Low — dead model file, console spam, minor duplication.

### 4.4 Tasks (`backend/modules/tasks/`)

- `task.controller.js` (81 lines, 6 exports), `task.model.js` (70 lines) — dead/deprecated (replaced by `task.repository.js`), `task.routes.js` (35 lines, 5 routes).
- Simple CRUD: create, read, update status, edit title, delete, get streak.

**🚨 Security finding — IDOR (Insecure Direct Object Reference), Moderate severity**

Affected endpoints:
- `PATCH /api/tasks/:id` (`updateTask`, lines 24–31)
- `PUT /api/tasks/:id` (`editTaskTitle`, lines 33–40)
- `DELETE /api/tasks/:id` (`deleteTask`, lines 42–49)

The repository layer does include `user_id` in its `WHERE` clauses, so the SQL itself is safe (an attacker's UPDATE/DELETE against another user's task simply matches zero rows). However, the **controller never verifies ownership before attempting the operation**, and a task that exists-but-belongs-to-someone-else returns the same 404 as a task that doesn't exist at all — which allows an authenticated attacker to enumerate task IDs and probe for the existence of other users' data via response behavior, even though they can't actually modify it.

**Recommended fix:**

Add a `getTaskById` method to `backend/repositories/task.repository.js`:

```javascript
/**
 * Fetch a task by ID (for ownership verification).
 * @returns {Promise<{id, user_id, title, category, status, date, created_at}|null>}
 */
const getTaskById = (taskId) =>
    db.get("SELECT * FROM tasks WHERE id = ?", [taskId]);

module.exports = {
    addTask,
    getTasksByDate,
    getTaskById,              // ← add
    updateTaskStatus,
    updateTaskTitle,
    deleteTask,
    getStreakDates,
};
```

Then check ownership explicitly in each controller method before mutating:

```javascript
exports.updateTask = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.updateTaskStatus(req.params.id, req.user.id, req.body.status);
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task updated."));
    } catch (err) { next(err); }
};

exports.editTaskTitle = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.updateTaskTitle(req.params.id, req.user.id, req.body.title.trim());
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task title updated."));
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.deleteTask(req.params.id, req.user.id);
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task deleted."));
    } catch (err) { next(err); }
};
```

This gives an explicit 403 (not 404) when a task exists but isn't owned by the caller, and adds defense-in-depth on top of the already-safe repository queries.

**Other Tasks findings:**
- **Duplicate date handling:** `.split("T")[0]` appears at lines 10, 18, 58 — the third instance of this pattern (after diary and analytics). Centralize in `backend/utils/dateUtils.js`.
- **Streak logic** (`getStreak()`, lines 51–81) closely mirrors `theme.repository.incrementStreak()` (Module 3) — same timezone fragility, separately implemented.
- **No controller-level validation** of `category` — relies solely on the DB's CHECK constraint; earlier feedback would be better UX.

**Severity:** Moderate (IDOR) + Minor (duplicate date/streak logic).

### 4.5 Scheduler (`backend/modules/scheduler/`)

- `schedule.controller.js` (390 lines) — mostly stubs/TODOs. `template.controller.js` (218 lines) — template resolution. `event.controller.js` (195 lines) — event CRUD. `builtInTemplates.js` (149 lines) — template hierarchy. `services/` subdirectory (intelligence/, planning/, scheduling/) — **empty stubs**. `backend/repositories/scheduler/` — 5 repository files, mostly unused by the stub controllers.

**Status: incomplete stub implementation.** `generateWeeklySchedule()` (lines 19–64) returns a hardcoded mock schedule with a `// TODO: Implement full schedule generation pipeline` comment. Nine imported services (`qualityAnalysisService`, `pageAnalysisService`, `revisionUnitGenerator`, `priorityEngine`, `timeEstimationEngine`, `dailyWorkloadPlanner`, `weeklyStrategyService`, `unitScheduler`, `constraintService`) are never actually called.

**Positive:** the template hierarchy is well-structured, with a comprehensive built-in database of 50+ international school-board timings (CBSE, IB, Cambridge, etc.) and clean template resolution logic (lines 89–117).

**🚨 Day-of-week bug (recurring pattern), Critical severity**

`schedule.controller.js:379–386`, `getWeekStart()`:

```javascript
getWeekStart() {
    const now = new Date();
    const day = now.getDay();  // 0 = Sunday, 6 = Saturday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start logic
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return Math.floor(monday.getTime() / 1000);
}
```

The comment says "Monday start," but the formula is off for most days of the week (e.g., on Monday itself the calculation advances to the *next* Tuesday rather than staying on the current Monday). This produces incorrect week boundaries, so events can be assigned to the wrong week or dropped. **This is the same Sunday-based-indexing fragility** found in Module 1 (coach/scheduler `calculateWeekDates()`) and Module 3 (diary streak date handling).

**Severity:** Critical — the scheduler module is roughly 80% unimplemented; it should not be released without a real implementation.

### 4.6 Middleware & Utilities

- **Auth middleware** (`backend/middleware/authMiddleware.js`) — clean JWT verification, handles expired/invalid tokens, Bearer extraction. No issues.
- **Validation middleware** (`backend/middleware/validate.js`) — well-designed rule-based validation (required, minLength, maxLength, isEmail, matches, isInt, isArray, oneOf), composable, clean error responses. No issues.
- **Utilities:** `responseFormatter.js`, `pageConverter.js`, `marhalaMapper.js`, `surahNames.js`, `tokenUsageTracker.js`, `aiErrorHandler.js` — no centralized date utility exists, so date-string handling is duplicated across modules.
- **Database config** (`backend/config/database.js`) — SQLite3 with synchronous API, no connection pooling (not required for SQLite, but an async wrapper would improve error handling).
- **Migrations** (`backend/migrate.js`) — manual, not framework-based; only handles `flashcard_folders`/`flashcard_folder_items` creation. `backend/database/schema.sql` is the real source of truth. No version tracking — impossible to know which migrations have run. Maintenance burden as the schema grows.

### Dead Files Summary (Module 4)

| File | Status | Issue |
|------|--------|-------|
| `backend/modules/auth/user.model.js` | Dead | Replaced by auth.repository.js |
| `backend/modules/ayah/ayah.model.js` | Dead | Replaced by ayah.repository.js |
| `backend/modules/tasks/task.model.js` | Dead | Replaced by task.repository.js |
| `backend/modules/themes/theme.model.js` | Deprecated shim | Keep until frontend updated |
| `backend/modules/diary/diary.repository.js` | Deprecated shim | Keep until frontend updated |

### Duplication Patterns (feed into Section 11)

| Pattern | Locations | Impact |
|---------|-----------|--------|
| Date string formatting (`.split("T")[0]`) | analytics, tasks, diary, coach | Timezone bugs, maintenance burden |
| Streak calculation logic | diary (theme.repository), tasks, coach | 3 separate implementations |
| Day-of-week indexing (Sunday=0) | coach, scheduler | Week-boundary calculation bugs |
| Type validation (murajah, tasmee, etc.) | diary modules, analytics | Scattered validation rules |
| Heatmap data sources (diary_logs vs heatmap_scores) | diary, analytics | Data consistency risk |

### Cross-Module Routes

All registered in `server.js` (lines 61–74):
```
/api/auth       → authRoutes
/api/ayah       → ayahRoutes
/api/similarity → similarityRoutes
/api/similarity/wizard → wizardRoutes
/api/diary      → diaryRoutes
/api/analytics  → analyticsRoutes
/api/tasks      → taskRoutes
/api/themes     → themeRoutes
/api/coach      → chatRoutes
/api/coach/wizard → tmWizardRoutes, seqWizardRoutes, sensoryProfileWizardRoutes
/api/flashcards → flashcardRoutes
/api/scheduler  → schedulerRoutes
```
Three wizard routes are mounted on the same `/api/coach/wizard` prefix — check for overlapping paths. Auth middleware is applied per-route rather than globally, so each protected route must remember to include it.

### Severity Summary (Module 4)

| Module | Severity | Key Issues |
|--------|----------|-----------|
| Analytics | Low | Inherits dual-heatmap-source problem from diary |
| Auth | Low–Moderate | Dead user.model.js, console spam, missing `updateWalkthroughSeen()` in repo |
| Ayah | Low | Dead model.js, console debug logs in controller |
| Tasks | **Moderate** | IDOR vulnerability (missing ownership checks), duplicate date/streak logic |
| Scheduler | **Critical** | ~80% unimplemented, day-of-week bug, services don't exist |
| Middleware/Utils | Low | No centralized date utilities, manual migrations |

---

## 5. Frontend — features/scheduler (Schedule & Event Management UI)

### Overview
React UI for: building weekly routines (fixed events), applying school-board templates, defining revision units per day, viewing generated schedules (week/list view), and handling exceptions (days off, special schedules).

### Structure

```
frontend/features/scheduler/
├── SchedulerPage.jsx            (Main entry point)
├── components/
│   ├── EventBuilder.jsx         (CRUD for fixed events)
│   ├── RevisionUnits.jsx        (Revision unit manager)
│   ├── ScheduleView.jsx         (Display generated schedule)
│   └── PrintableSchedule.jsx    (Print-friendly view)
├── wizard/
│   ├── BuildMyWeek.jsx          (Template application)
│   ├── EventBuilder.jsx         (Legacy, duplicated)
│   ├── WeeklyCycle.jsx          (Sipara assignment per day)
│   ├── WeekView.jsx             (Interactive week grid)
│   ├── GeneratedSchedule.jsx    (Preview & finalize)
│   ├── Review.jsx               (Free time analysis)
│   ├── Exceptions.jsx           (Day exceptions)
│   └── SchedulerWizard.jsx      (Wizard orchestrator)
├── services/schedulerApi.js
├── utils/eventDedup.js (+ others)
└── SchedulerPage.css
```

### Dead Files
- **`components/EventBuilder.jsx`** appears duplicated by **`wizard/EventBuilder.jsx`** — likely near-identical implementations. Verify which is actually used and delete the other.

### Dead Code
- `GeneratedSchedule.jsx:315–334` — 10+ `console.log` calls dumping `weeklyCycle`/`heatmapData` state.
- `BuildMyWeek.jsx:159–170` — debug logging for day filtering.
- `Review.jsx:110+` — debug logging for free-time calculations.

Extensive console logging across all wizard components; should be removed or replaced with a proper debug logger.

### 🚨 Day-of-week bug pattern — frontend manifestation

All scheduler components consistently use **Sunday-based indexing (0=Sunday…6=Saturday)** for `DAYS_OF_WEEK`/`DAY_NAMES` constants, and event filtering (`GeneratedSchedule.jsx:392–416`, `eventDays.includes(dayIndex)`) is internally consistent with that.

**However, there is a real data-type mismatch:**
- **Events** store days as a **numeric array**: `daysOfWeek: [0, 1, 2, 3, 4, 5]`.
- **Exceptions** (`Exceptions.jsx:84–106`) store the selected day as a **string** from a `<select>`: `day: "Monday"`.
- **Weekly cycle / siparas** are keyed by numeric-string keys: `weeklyCycle['0']`, `weeklyCycle['1']`, etc.

Because exceptions use strings and events use numbers, any code comparing `exception.day === event.daysOfWeek` (or similar) will never match — off-day/exception logic silently fails to apply.

**Severity: Moderate.** This is a genuine functional bug (exceptions/day-off logic likely broken), not just a duplication concern.

Separately, `GeneratedSchedule.jsx:741–798` handles uncertainty about the `weeklyCycle` shape returned by the backend (array vs. object-with-numeric-keys vs. name-based fallback) via a triple-lookup strategy. This is defensive but suggests the API contract between frontend and backend isn't fully pinned down, and may be masking real bugs rather than just tolerating format variance.

### Architecture

**Wizard flow:** SchedulerPage → EventBuilder → BuildMyWeek → WeeklyCycle → WeekView → GeneratedSchedule → Review → Exceptions.

**State management:** no centralized store (Redux/Context); state is passed via props through wizard steps. This causes prop drilling and state loss if the user navigates back and forward.

**Templates:** `BuildMyWeek.jsx` hardcodes `SCHOOL_BOARD_TIMINGS`, duplicating `backend/modules/scheduler/builtInTemplates.js`. If the backend updates its templates, the frontend copy goes stale. Should fetch from `GET /api/scheduler/templates` instead.

### Duplication
- **EventBuilder** component duplicated (components/ vs wizard/).
- **Day-of-week constants** redefined in 6 different components — should live in `frontend/features/scheduler/constants/days.js`.
- **Template timings** duplicated between frontend and backend.
- **Time utilities** (`timeToMinutes()`, `mergeIntervals()`) duplicated between `Review.jsx` and `PrintableSchedule.jsx` — should be centralized in `utils/timeUtils.js`.
- **Schedule rendering logic** likely duplicated across `GeneratedSchedule.jsx`, `ScheduleView.jsx`, and `PrintableSchedule.jsx`.

### Code Quality Issues
- `BuildMyWeek.jsx:378–411`, `applyTemplate()` — API-call section wrapped in try/catch with an **empty catch block**; errors are silently swallowed with no user feedback.
- No error handling wraps `schedulerApi` calls more broadly.

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Exception days stored as strings vs. numeric event days | **Moderate** | Exception/day-off logic likely broken |
| Duplicated EventBuilder component | Minor | Maintenance burden |
| Debug console.log spam (10+ per component) | Minor | Production clutter |
| Scattered day-of-week constants (6 definitions) | Minor | Inconsistency risk |
| Duplicated time utilities | Minor | Code duplication |
| Template timings duplicated frontend/backend | **Moderate** | Out-of-sync data |
| No centralized state management | **Moderate** | State loss on navigation, hard to debug |
| Empty catch block silently swallows template-apply errors | Minor | No user feedback on failure |
| Defensive triple-lookup for weeklyCycle shape | Minor | Masks unclear API contract |

### Recommendations
1. Consolidate day-of-week constants into a shared file.
2. Fix `Exceptions.jsx` to store numeric day values (0–6) instead of strings.
3. Remove debug console.log statements.
4. Delete the duplicate EventBuilder component.
5. Centralize time utilities.
6. Introduce centralized wizard state (Context API).
7. Fetch template timings from the backend rather than hardcoding.
8. Pin down the `weeklyCycle` API contract and remove the defensive triple-lookup once it's fixed.

---

## 6. Frontend — features/flashcards (AI-Generated Flashcard Study & Sequences)

### Overview
Enables creating custom flashcard sets (study/test modes), AI-generated sets from Quran sequences (Surahs, Pages, Juz), folder organization, visual flowchart memory aids (first/last-word sequences), question editing, and set metadata management.

### Structure

```
frontend/features/flashcards/
├── FlashcardsPage.jsx
├── components/
│   ├── CreateFlashcardModal.jsx
│   ├── FolderGrid.jsx
│   ├── AddSetsToFolderModal.jsx
│   ├── QuestionEditor.jsx
│   ├── SequenceFlowchart.jsx
│   ├── StudyView.jsx
│   └── TestView.jsx
├── data/flashcardsData.js
└── FlashcardsPage.css
```

### Dead Code

**`QuestionEditor.jsx` imported but never used** (`FlashcardsPage.jsx:7`). The component implements complete question-editing logic (fetch/save questions, lines 119–464), but no UI button or modal trigger ever mounts it anywhere in `FlashcardsPage.jsx`.

A check of the repository's commit history did not turn up any commit that deliberately disconnected this component — the most recent relevant commit (a bulk "Add files via upload" on 2026-07-10) added new, unrelated files and did not touch `QuestionEditor.jsx`. This points to an **unfinished feature** (the editing UI was built but the trigger to open it was never wired up) rather than a deliberate removal.

**Recommendation:** either implement an "Edit Questions" button on the set viewer to open `QuestionEditor`, or delete the component and its import if the feature is no longer planned.

**Console debug logging (~25+ calls)** across `CreateFlashcardModal.jsx`, `SequenceFlowchart.jsx`, and `FlashcardsPage.jsx` — should be removed or replaced with a proper debug logger.

### Architecture

```
FlashcardsPage
  ├─ Sidebar (FolderGrid, folder nav, category buttons)
  ├─ Main content
  │  ├─ UserSetViewer → StudyView / TestView / SequenceFlowchart (lazy-loaded)
  │  └─ Built-in category display (StudyView / TestView)
  ├─ CreateFlashcardModal
  ├─ AddSetsToFolderModal
  └─ QuestionEditor (unused)
```

State is local to `FlashcardsPage` (no Redux/Context); heavy prop drilling to children. Cancellation tokens are correctly used in `useEffect`s to avoid memory leaks.

**Set creation flow:** modal → `POST /coach/wizard/sequence/{type}` → backend returns ayah sequence + generated questions → frontend maps to `{front, back}` cards → `POST /flashcards/user-sets` → sidebar refreshes.

### Duplication
- **`detectSetInfo()`** (regex-based set-name parsing) is defined **twice**, nearly identically, in `SequenceFlowchart.jsx:46–76` and `QuestionEditor.jsx:7–24`. Should be extracted to `frontend/features/flashcards/utils/setDetection.js`. Note `QuestionEditor`'s version doesn't distinguish `juz-pages` from `juz-surahs`, unlike `SequenceFlowchart`'s.
- **Question generation logic** exists in two different places with two different sources: `QuestionEditor.jsx:27–117` pre-generates fixed question templates client-side, while `CreateFlashcardModal.jsx:71–134` builds questions from the backend API response. These will drift out of sync if either side's question set changes. Ideally the backend should own the question templates.
- **Modal overlay styles** (fixed full-screen overlay, same CSS) are duplicated across at least 3 modal components — should be a shared `.modal-overlay` class.
- **Folder-fetch calls** (`getFolders()`) happen in at least 3 places in `FlashcardsPage.jsx` with no caching — acceptable for simple refreshes but worth noting.

### Code Quality Issues
- **Missing user feedback on error:** `handleRemoveFromFolder` (`FlashcardsPage.jsx:512–527`) only logs to console on failure; the user sees no error message.
- **N+1 query pattern:** the fallback path for loading uncategorised sets (`FlashcardsPage.jsx:325–389`) makes one sequential API call per folder to fetch that folder's sets, inside a loop, when the primary endpoint fails. Should batch-fetch instead. The same fallback logic is duplicated between the `else` and `catch` branches.

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| QuestionEditor imported but unused (unfinished feature) | Minor | Dead code, namespace clutter |
| Console debug logging (25+ calls) | Minor | Production clutter |
| `detectSetInfo()` duplicated in two files | **Moderate** | Maintenance burden, drift risk |
| Question generation logic split across frontend/backend | **Moderate** | Inconsistent question formats |
| Modal overlay styles duplicated | Minor | DRY violation |
| No user feedback on folder-removal errors | Minor | Poor error UX |
| N+1 query pattern in folder-loading fallback | Minor | Performance risk under many folders |
| No centralized state management | **Moderate** | Prop drilling, state loss on navigation |

### Recommendations
1. Implement the "Edit Questions" trigger for `QuestionEditor`, or remove it.
2. Remove debug console.log calls.
3. Extract `detectSetInfo()` to a shared utility.
4. Consolidate question-generation logic (prefer backend-owned templates).
5. Extract shared modal-overlay CSS.
6. Add user-facing error feedback (toast) on failed folder operations.
7. Batch folder-set fetches to remove the N+1 pattern.

---

## 7. Frontend — features/diary (Diary Entry Logging & Progress Tracking)

### Overview
Logs daily Quran study progress across 5 entry types (Murajah, Tasmee, Ikhtebar, Jadeed, Juz Hali), plus monthly goal setting (Takhteet), log history, and analytics integration.

### Structure

```
frontend/features/diary/
├── DiaryPage.jsx
├── components/
│   ├── LogHistory.jsx
│   ├── TakhteetProgress.jsx
│   └── forms/
│       ├── MurajahForm.jsx
│       ├── TasmeeForm.jsx
│       ├── IkhtebarForm.jsx
│       ├── JadeedForm.jsx
│       └── JuzHaliForm.jsx
├── hooks/
│   ├── useMurajahForm.js
│   ├── useJadeedForm.js
│   ├── useJuzHaliForm.js
│   ├── useTasmeeForm.js
│   ├── useIkhtebarForm.js
│   └── useRangeForm.js
└── DiaryPage.css
```

No dead files — all components/hooks are imported and rendered.

### Dead Code / Minor Issues
- `TAB_LABELS` (`DiaryPage.jsx:102–108`) uses an inconsistent key, `Juz_Hali`, vs. lowercase keys elsewhere — functionally fine (handled explicitly in the tab switch) but inconsistent naming.
- `refreshLogs()` (`DiaryPage.jsx:132–163`) intentionally swallows errors in production, with a documented comment — deliberate design, not dead code, but worth flagging since it could mask real failures.
- `TakhteetProgress.jsx:157` — variable `now` is redeclared, shadowing an earlier declaration on line 17. Code smell, not a functional bug.

### 🚨 Data-loss UX bug: queued Murajah entries

`useMurajahForm.js:41–44`:

```javascript
const queueJuz = () => {
    if (!currentJuzInput || !activeSuwal.every(s => s.page !== '')) return;
    setQueuedJuzData(prev => [...prev, { juz: currentJuzInput, suwal: activeSuwal }]);
    resetCurrentJuz();
};
```

Users can queue multiple juz entries before saving, but if they navigate away before clicking "Save," all queued (unsaved) data is silently lost — there's no page-unload warning, visual "unsaved changes" indicator, or local backup.

**Severity: Moderate — genuine UX/data-loss bug**, not just style. **Recommendation:** add a `beforeunload` warning when `queuedJuzData` is non-empty, show a badge with the queued count, and/or persist the queue to `localStorage` as a backup.

### Architecture
`DiaryPage` orchestrates tab selection, date navigation, save/refresh logic, and toast/confirm-dialog state; each form's own state lives in a dedicated hook (`useMurajahForm`, etc.), which is a clean separation of concerns. No global diary state store exists — acceptable at current complexity, but will not scale gracefully if the feature grows.

**Takhteet progress flow:** `TakhteetProgress` fetches the monthly goal and progress independently; `DiaryPage` increments a `jadeedLogCounter` after any save, which `TakhteetProgress` watches to know when to refresh — a reasonable, server-state-driven design.

### Duplication
- **Date arithmetic** (`.split("T")[0]`, UTC date math) appears in `DiaryPage.jsx:122–128`, `LogHistory.jsx:39`, and `TakhteetProgress.jsx:20–24` — the same recurring pattern seen in Modules 1, 3, and 5. **Recommend centralizing in `frontend/shared/utils/dateUtils.js`.**
- **`range_from`/`range_to` string formatting** is bespoke per form (Murajah, Tasmee/Ikhtebar, Jadeed each build their own string), so any backend format change requires touching multiple files. Recommend `frontend/features/diary/utils/payloadFormatters.js`.
- **Form reset logic** (`resetAll()`/`resetForm()`) is separately implemented in each of the 5 hooks — similar shape, not identical code; lower priority than the above two.
- `scoreColor()` is correctly centralized already in `frontend/shared/utils/scoreColors.js` and reused across forms — a good existing example of DRY.

### Code Quality Issues
- Date-picker boundary check (`DiaryPage.jsx:246`) uses string comparison (`activeDate <= '2020-01-01'`) rather than `Date` object comparison — works for ISO strings but is fragile.
- `TakhteetProgress.jsx:104–145` (`handleFormSubmit`) has solid error handling and double-submit protection, but doesn't validate that goal values are internally consistent (e.g., target juz vs. start juz, ascending weekly milestones) before submitting.

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Queued Murajah entries can be silently lost on navigation | **Moderate** | Real data-loss bug |
| Date arithmetic duplicated (4+ modules total) | **Moderate** | Timezone bugs, maintenance burden |
| Range string formatting scattered across forms | **Moderate** | Backend contract fragile |
| Tab key naming inconsistent (`Juz_Hali`) | Minor | Cosmetic |
| Form reset logic duplicated across hooks | Minor | Low-priority duplication |
| Variable shadowing in TakhteetProgress | Minor | Code smell |
| No goal-form validation (juz/milestone ordering) | Minor | Could allow inconsistent goals |

### Recommendations
1. Add unsaved-queue warning/backup for Murajah entries.
2. Centralize date arithmetic in a shared utility.
3. Centralize `range_from`/`range_to` formatting per entry type.
4. Add basic validation to the Takhteet goal form.

---

## 8. Frontend — features/similarity (Mutashabihat Finder & Memory Tips)

### Overview
Lets users search for structurally similar Quran verses (mutashabihat), view side-by-side context, and add/edit memory tips for similarity pairs.

### Dead Code
Console debug logging (~15–20 calls) scattered through the module — should be removed or gated behind a debug logger.

### Duplication

**Pair-key normalization logic** is defined **three separate times** in `SidePanel.jsx`:

```javascript
const minSurah = Math.min(sourceSurah, targetSurah);
const maxSurah = Math.max(sourceSurah, targetSurah);
const ayahA = minSurah === sourceSurah ? sourceAyah : targetAyah;
const ayahB = maxSurah === targetSurah ? targetAyah : sourceAyah;
```

Appearing in `saveTips()` (lines 10–16), `fetchTipsFromDB()` (lines 31–36), and a `useEffect` computing the pair key (lines 167–172). **Recommend extracting to `frontend/features/similarity/utils/pairKeyUtils.js`.**

### Code Quality Issues
- `SearchBar.jsx:65–80` uses `useImperativeHandle` with manual refetching — an imperative escape hatch that could be replaced with normal state/prop flow.
- Memory tips are updated optimistically (locally) before the save request completes; on failure there's no rollback or error message, so the user doesn't know the save actually failed.
- No in-memory caching of tips — every result click triggers a fresh DB fetch; could reuse an app-level cache.

### Severity Summary

| Finding | Severity | Impact |
|---------|----------|--------|
| Pair-key normalization duplicated 3 times | **Moderate** | Maintenance burden, drift risk |
| Optimistic tips update without error fallback | Minor | Silent failure, poor UX |
| Console debug logging (15+ calls) | Minor | Production clutter |
| Imperative ref-based refetch pattern | Minor | Could be simplified |
| No tips caching | Minor | Redundant fetches |

---

## Cross-Cutting Patterns Observed So Far (feeding Section 11)

These issues recur across multiple modules and are strong candidates for a single, centralized fix rather than repeated per-module patches:

1. **Date/timezone handling** (`.split("T")[0]`, manual UTC arithmetic) — appears in backend coach, backend diary, backend analytics, backend tasks, frontend scheduler, and frontend diary. Centralize into one date-utility module per side (backend + frontend).
2. **Day-of-week indexing bugs** (Sunday-based indexing combined with off-by-one week-start math) — backend coach and backend scheduler both miscalculate week boundaries; frontend scheduler additionally mixes string day names (Exceptions) with numeric day indices (Events).
3. **Streak calculation logic** — independently implemented in diary (`theme.repository`), tasks, and coach modules.
4. **Dual/inconsistent data sources for heatmap data** (`diary_logs` vs `heatmap_scores`) — affects both the diary and analytics backend modules and is the single highest-severity cross-cutting issue found so far.
5. **Console.log debug spam** — present in nearly every module examined (auth, ayah, flashcards, scheduler, similarity); should be swept and replaced with a single debug-logger utility, gated off in production.
6. **Legacy `.model.js` files superseded by `.repository.js`** — a consistent migration pattern across auth, ayah, tasks, themes, and diary; several are fully dead, two are intentional shims. Worth a single cleanup pass once the auth "missing `updateWalkthroughSeen`" bug (Module 4.2) is fixed, since that bug is a direct symptom of this in-progress migration.

*Modules 9 (frontend shared/), 10 (remaining frontend features), and 11 (full cross-cutting synthesis and proposed architecture) are not yet covered and remain pending.*
