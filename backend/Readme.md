# Quran Similarity App — Backend

## Quick Start

```bash
cp .env.example .env
# Fill in JWT_SECRET (see .env.example for how to generate one)

npm install
node scripts/setupDatabase.js   # creates DB, applies schema, imports ayahs
npm run dev
```

---

## Project Structure

```
backend/
├── server.js                        # Entry point
├── .env.example
│
├── config/
│   └── database.js                  # SQLite async wrapper + WAL mode
│
├── database/
│   └── schema.sql                   # ← Single source of truth for all tables
│
├── middleware/
│   ├── authMiddleware.js            # JWT verification
│   ├── errorHandler.js              # Global error handler
│   └── rateLimiter.js               # In-memory rate limiter for auth routes
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   └── user.model.js
│   │
│   ├── ayah/
│   │   ├── ayah.controller.js
│   │   ├── ayah.model.js
│   │   └── ayah.routes.js
│   │
│   ├── similarity/
│   │   ├── filter.service.js
│   │   ├── similarity.controller.js
│   │   ├── similarity.model.js
│   │   └── similarity.routes.js
│   │
│   ├── diary/
│   │   ├── diary.repository.js      # All DB operations for diary logs
│   │   ├── diary.routes.js
│   │   ├── ikhtebar/
│   │   ├── jadeed/
│   │   ├── juzzHali/
│   │   ├── log/                     # GET/PUT/DELETE log endpoints
│   │   ├── murajah/
│   │   └── tasmee/
│   │
│   ├── analytics/
│   │   ├── analytics.controller.js
│   │   └── analytics.routes.js
│   │
│   ├── tasks/
│   │   ├── task.controller.js
│   │   ├── task.model.js
│   │   └── task.routes.js
│   │
│   └── themes/
│       ├── theme.controller.js
│       ├── theme.model.js
│       └── theme.routes.js
│
├── utils/
│   ├── marhalaMapper.js
│   ├── responseFormatter.js
│   └── surahNames.js
│
└── scripts/                         # Run once / offline tools
    ├── setupDatabase.js             # ← START HERE: schema + ayah import
    ├── importHistory.js             # Import txt diary history files
    ├── generateSimilarities.js      # CPU-heavy: computes unique_pairs.json
    └── importSimilarities.js        # Loads unique_pairs.json → DB
```

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/ayah/surahs | — | All surahs |
| GET | /api/ayah/:surah/ayahs | — | Ayahs in surah |
| GET | /api/ayah/context | — | Prev/current/next ayah |
| GET | /api/ayah/page-details | — | Surahs/ayahs on a page |
| GET | /api/ayah/juz-pages | — | Pages in a juz |
| GET | /api/ayah/pages-in-range | — | Pages between start/end |
| GET | /api/similarity | — | Similar ayahs |
| POST | /api/diary/murajah | ✓ | Log murajah |
| POST | /api/diary/tasmee | ✓ | Log tasmee |
| POST | /api/diary/ikhtebar | ✓ | Log ikhtebar |
| POST | /api/diary/jadeed | ✓ | Log jadeed |
| POST | /api/diary/juz-hali | ✓ | Log Juz Hali |
| GET | /api/diary/logs | ✓ | Logs for a date |
| PUT | /api/diary/log/:id | ✓ | Update log score |
| DELETE | /api/diary/log/:id | ✓ | Delete log |
| GET | /api/analytics/trend | ✓ | Score trend over time |
| GET | /api/analytics/deep-dive | ✓ | Per-type detailed logs |
| GET | /api/analytics/heatmap | ✓ | Juz/page heatmap data |
| GET | /api/tasks/streak | ✓ | Current diary streak |
| POST | /api/tasks | ✓ | Create task |
| GET | /api/tasks | ✓ | Tasks for a date |
| PATCH | /api/tasks/:id | ✓ | Update task status |
| PUT | /api/tasks/:id | ✓ | Edit task title |
| DELETE | /api/tasks/:id | ✓ | Delete task |
| GET | /api/themes/current | ✓ | Active theme + streak |
| GET | /api/themes/all | ✓ | All user themes |
| POST | /api/themes/select | ✓ | Switch theme |

---

## Scripts — What to Keep

### ✅ Keep these 4

| Script | When to run |
|--------|-------------|
| `setupDatabase.js` | Once on fresh install, or to reset |
| `importHistory.js` | Once to seed historical diary data |
| `generateSimilarities.js` | Offline, when re-computing ayah pairs |
| `importSimilarities.js` | After generateSimilarities.js |

### ❌ Delete these (all superseded)

- `add-diary-table.js` — schema.sql handles this
- `add-tasks-table.js` — schema.sql handles this
- `add-users-table.js` — schema.sql handles this
- `addThemesTable.js` — schema.sql handles this
- `addPageColumn.js` — schema.sql handles this
- `addPageNumbers.js` — setupDatabase.js handles this
- `fix-similarity-pages.js` — schema.sql + importSimilarities handles this
- `fixAllPages.js` — setupDatabase.js handles this
- `setupComplete.js` — replaced by setupDatabase.js
- `importAllHistory.js` — replaced by importHistory.js
- `importFinalSimilarities.js` — replaced by importSimilarities.js
- `importHistory.js` (old) — replaced
- `checkAyahs.js` — one-time debug tool
- `checkUser.js` — one-time debug tool
- `auditSimilarities.js` — one-time debug tool
- `forceThemeActive.js` — dev/debug only
- `previewThemes.js` — dev/debug only
- `seedDemoThemes.js` — dev/debug only
- `resetThemes.js` — dev/debug only
- `check.js` — one-time debug tool
- `fixDB.js` — one-time debug tool

---

## Bugs Fixed

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `ayah.routes.js` | Called `getJuzzPages` but controller exported `getJuzPages` → 500 crash | Renamed to `getJuzPages` everywhere |
| 2 | `ikhtebar.controller.js` | `require("./ikhtebar.service")` but file didn't exist — pointed at tasmee | Created `ikhtebar.service.js` |
| 3 | `diary.routes.js` | Referenced `reflection/reflection.controller` which didn't exist | Pointed to `log/log.controller.js` |
| 4 | `analytics.controller.js` `getDeepDive` | `ORDER BY` clause before `AND` filter = invalid SQL | Moved filter into WHERE block conditionally |
| 5 | `diary.repository.js` | Stored raw date string; `DATE(created_at)` comparisons sometimes failed | Store as `YYYY-MM-DDT00:00:00` always |
| 6 | `authMiddleware.js` + `auth.controller.js` | Fell back to hardcoded JWT secret if env var missing | App exits on startup if `JWT_SECRET` unset |
| 7 | `auth.routes.js` | No rate limiting on login/signup | Added in-memory rate limiter |
| 8 | `schema.sql` inconsistency | `diary_logs` missing `time_spent`/`difficulty` columns in some places | Unified in single schema.sql |
| 9 | `theme.controller.js` `select` | Direct DB calls outside transaction wrapper | Wrapped in `db.transaction()` |
| 10 | `auth.controller.js` login | User enumeration possible via timing difference | Added constant-time dummy hash compare |

# Backend Scripts — Cleanup Guide

## Scripts to KEEP (3 total)

| File | Purpose | When to run |
|---|---|---|
| `scripts/setup.js` | Creates all tables, runs migrations, imports ayahs | Once on fresh install; safe to re-run |
| `scripts/generateSimilarities.js` | CPU-intensive: computes similar ayah pairs → `unique_pairs.json` | Offline, when re-computing similarity data |
| `scripts/importSimilarities.js` | Loads `unique_pairs.json` into the DB similarities table | After generateSimilarities.js |

## Scripts to DELETE (all of these are replaced by setup.js)

- `add_all_coach_tables.js`
- `add_chat_sessions_tables.js`
- `add_coach_messages_table.js`
- `add_flashcard_tables.js`
- `add-diary-table.js`
- `add-tasks-table.js`
- `add-users-table.js`
- `addPageColumn.js`
- `addPageNumbers.js`
- `addThemesTable.js`
- `fixDb.js`
- `migrateDb.js`
- `rebuildDiaryLogs.js`
- `setupDatabase.js`
- `importAllHistory.js` ← keep only if you still need to import personal history txt files
- `auditSimilarities.js` ← optional debugging tool, keep or delete as you wish

## How to add tables in the future

Never create a new `addXxxTable.js` script. Instead:

1. Create a new file in `database/migrations/` named `002_your_feature.sql`
2. Write your `CREATE TABLE IF NOT EXISTS` statements inside it
3. Run `node scripts/setup.js` — it tracks which migrations have been applied
   and only runs new ones

## First-time setup (fresh machine)

```bash
cd backend
npm install
node scripts/setup.js
node scripts/generateSimilarities.js   # only if unique_pairs.json doesn't exist
node scripts/importSimilarities.js     # only if similarities table is empty
npm start
```