# backend/scripts

Utility scripts for database setup, data import, and debugging.
All scripts share the `_db.js` helper — a thin Promise wrapper over `sqlite3`.

---

## Folder structure

```
scripts/
├── _db.js                          ← shared DB helper (used by all scripts)
│
├── debug/                          ← read-only, safe to run any time
│   ├── checkDatabase.js            ← lists tables, counts, sample rows
│   ├── checkStreakData.js           ← prints streak + diary summary for a user
│   └── debugHeatmap.js             ← inspects heatmap rows in diary_logs
│
├── import/                         ← loads source files into the DB (run once per env)
│   ├── importDiaryData.js          ← imports jadeed + murajah + heatmap txt files
│   ├── importHeatmapData.js        ← imports heatmap_data.txt only (standalone)
│   └── importSimilarities.js       ← loads unique_pairs.json → similarities table
│
└── maintenance/                    ← setup, generation, seeding (some are destructive)
    ├── setup.js                    ← master setup: schema → migrations → ayahs → verify
    ├── generateSimilarities.js     ← CPU-heavy: produces unique_pairs.json
    ├── populateDemo.js             ← ⚠ DESTRUCTIVE: replaces diary_logs with demo data
    └── seedDemoThemes.js           ← ⚠ DESTRUCTIVE: replaces user_themes with seeded data
```

---

## Recommended run order (fresh environment)

```bash
# 1. Create schema, run migrations, import ayahs
node scripts/maintenance/setup.js

# 2. Generate similarity pairs (CPU-intensive, ~minutes)
node scripts/maintenance/generateSimilarities.js

# 3. Import similarity pairs into the DB
node scripts/import/importSimilarities.js

# 4. Import diary history from text files
node scripts/import/importDiaryData.js --user=1

# 5. Verify everything looks correct
node scripts/debug/checkDatabase.js
node scripts/debug/checkStreakData.js 1
```

---

## Common flags

| Flag           | Scripts that accept it         | Effect                                      |
|----------------|--------------------------------|---------------------------------------------|
| `--user=N`     | import*, maintenance/populate* | Target user ID (default: 1 or 2 per script) |
| `--dry-run`    | import*, maintenance/*         | Parse/validate only — no DB writes          |
| `--yes`        | maintenance/populate*, seed*   | Skip the destructive-action confirmation    |
| `--force-ayahs`| maintenance/setup.js           | Re-import ayahs even if rows exist          |
| `--skip-ayahs` | maintenance/setup.js           | Skip ayah import entirely                   |
| `--threshold=N`| maintenance/generateSimilarities.js | Jaccard cutoff, 0–1 (default: 0.25)    |

---

## Error handling contract

Every script follows the same pattern:

1. **Argument errors** — checked before any DB connection opens; exits with code 1.
2. **File-not-found errors** — checked before any DB connection opens; exits with code 1.
3. **Parse errors** — collected as warnings and printed; fatal errors abort before any DB write.
4. **DB errors** — any write that fails triggers an explicit `ROLLBACK`; the connection is always closed in `finally`.
5. **Exit code** — `process.exitCode` is set to `1` on any failure so CI pipelines can detect errors.

---

## `_db.js` API

```js
const { openDb } = require('./_db');

const db = await openDb({ readOnly: false, wal: true });

await db.run(sql, params);   // → { lastID, changes }
await db.get(sql, params);   // → row | undefined
await db.all(sql, params);   // → row[]
await db.exec(sql);          // multi-statement, no params

await db.begin();
await db.commit();
await db.rollback();

await db.close();            // always call in finally
```

`readOnly: true` opens with `SQLITE_OPEN_READONLY` and throws immediately if the file does not exist.