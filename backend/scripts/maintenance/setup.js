/**
 * scripts/maintenance/setup.js
 *
 * One-stop setup script. Run once per environment (safe to re-run).
 *
 *   node scripts/maintenance/setup.js [--skip-ayahs] [--force-ayahs]
 *
 * Flags:
 *   --skip-ayahs    Skip ayah import even if the table is empty.
 *   --force-ayahs   Re-import ayahs even if rows already exist.
 *
 * Steps:
 *   1. Apply master schema  (database/schema.sql)
 *   2. Run pending migrations (database/migrations/*.sql)
 *   3. Create coach / flashcard tables
 *   4. Import ayahs from data/quran.json
 *   5. Verify all expected tables exist
 */

"use strict";

require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { openDb } = require("../_db");

// ─── Paths ────────────────────────────────────────────────────────────────────

const SCHEMA_PATH    = path.resolve(__dirname, "../../database/schema.sql");
const MIGRATIONS_DIR = path.resolve(__dirname, "../../database/migrations");
const JSON_PATH      = path.resolve(__dirname, "../../data/quran.json");

// ─── Surah names map ─────────────────────────────────────────────────────────

let SURAH_NAMES;
try {
    SURAH_NAMES = require("../../utils/surahNames");
} catch {
    // Fallback if the util doesn't exist yet
    SURAH_NAMES = {};
}

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args       = process.argv.slice(2);
    let skipAyahs    = false;
    let forceAyahs   = false;

    for (const arg of args) {
        if (arg === "--skip-ayahs")  skipAyahs  = true;
        else if (arg === "--force-ayahs") forceAyahs = true;
        else throw new Error(`Unknown argument: ${arg}`);
    }

    if (skipAyahs && forceAyahs) {
        throw new Error("--skip-ayahs and --force-ayahs cannot both be set.");
    }

    return { skipAyahs, forceAyahs };
}

// ─── Step 1 — Master schema ───────────────────────────────────────────────────

async function applySchema(db) {
    console.log("\nStep 1: Applying master schema…");

    if (!fs.existsSync(SCHEMA_PATH)) {
        throw new Error(`schema.sql not found at: ${SCHEMA_PATH}`);
    }

    const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
    if (!sql.trim()) {
        throw new Error("schema.sql is empty.");
    }

    await db.exec(sql);
    console.log("  schema.sql applied.");
}

// ─── Step 2 — Migrations ──────────────────────────────────────────────────────

async function runMigrations(db) {
    console.log("\nStep 2: Running migrations…");

    await db.run(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename   TEXT     PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    );

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log("  No migrations/ directory — skipped.");
        return;
    }

    let files;
    try {
        files = fs.readdirSync(MIGRATIONS_DIR)
            .filter((f) => f.endsWith(".sql"))
            .sort();
    } catch (err) {
        throw new Error(`Cannot read migrations directory: ${err.message}`);
    }

    const appliedRows = await db.all("SELECT filename FROM schema_migrations");
    const applied     = new Set(appliedRows.map((r) => r.filename));

    let ran = 0;
    for (const file of files) {
        if (applied.has(file)) continue;

        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, "utf8");

        if (!sql.trim()) {
            console.warn(`  ⚠  ${file} is empty — skipped.`);
            continue;
        }

        await db.exec(sql);
        await db.run("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
        console.log(`  Applied: ${file}`);
        ran++;
    }

    if (ran === 0) console.log("  All migrations already applied.");
}

// ─── Step 3 — Coach / flashcard tables ───────────────────────────────────────

const COACH_TABLES = [
    [`CREATE TABLE IF NOT EXISTS chat_sessions (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER  NOT NULL,
        title      TEXT     NOT NULL DEFAULT 'New Session',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, "chat_sessions"],

    [`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
      ON chat_sessions(user_id, updated_at)`,
     "idx_chat_sessions_user"],

    [`CREATE TABLE IF NOT EXISTS chat_messages (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER  NOT NULL,
        role       TEXT     NOT NULL CHECK(role IN ('user','assistant')),
        content    TEXT     NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )`, "chat_messages"],

    [`CREATE INDEX IF NOT EXISTS idx_chat_messages_session
      ON chat_messages(session_id, created_at)`,
     "idx_chat_messages_session"],

    [`CREATE TABLE IF NOT EXISTS coach_messages (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER  NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, "coach_messages"],

    [`CREATE INDEX IF NOT EXISTS idx_coach_messages_user_date
      ON coach_messages(user_id, created_at)`,
     "idx_coach_messages_user_date"],

    [`CREATE TABLE IF NOT EXISTS flashcard_sets (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER  NOT NULL,
        name       TEXT     NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, "flashcard_sets"],

    [`CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user
      ON flashcard_sets(user_id)`,
     "idx_flashcard_sets_user"],

    [`CREATE TABLE IF NOT EXISTS flashcard_cards (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        set_id INTEGER NOT NULL,
        front  TEXT    NOT NULL,
        back   TEXT    NOT NULL,
        FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
    )`, "flashcard_cards"],

    [`CREATE INDEX IF NOT EXISTS idx_flashcard_cards_set
      ON flashcard_cards(set_id)`,
     "idx_flashcard_cards_set"],

    [`CREATE TABLE IF NOT EXISTS flashcard_questions (
        id         INTEGER  PRIMARY KEY AUTOINCREMENT,
        set_id     INTEGER  NOT NULL,
        text       TEXT     NOT NULL,
        answer     TEXT,
        is_fixed   INTEGER  NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
    )`, "flashcard_questions"],

    [`CREATE INDEX IF NOT EXISTS idx_flashcard_questions_set
      ON flashcard_questions(set_id)`,
     "idx_flashcard_questions_set"],

    [`CREATE TABLE IF NOT EXISTS flashcard_answers (
        id          INTEGER  PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER  NOT NULL,
        question_id INTEGER  NOT NULL,
        user_answer TEXT     NOT NULL,
        is_correct  INTEGER,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id)     REFERENCES users(id)                ON DELETE CASCADE,
        FOREIGN KEY(question_id) REFERENCES flashcard_questions(id)  ON DELETE CASCADE
    )`, "flashcard_answers"],

    [`CREATE INDEX IF NOT EXISTS idx_flashcard_answers_user_question
      ON flashcard_answers(user_id, question_id)`,
     "idx_flashcard_answers_user_question"],
];

async function createCoachTables(db) {
    console.log("\nStep 3: Creating coach/flashcard tables…");

    for (const [sql, label] of COACH_TABLES) {
        await db.run(sql);
        console.log(`  ${label}`);
    }
}

// ─── Step 4 — Import ayahs ────────────────────────────────────────────────────

async function importAyahs(db, { skipAyahs, forceAyahs }) {
    console.log("\nStep 4: Importing ayahs…");

    if (skipAyahs) {
        console.log("  Skipped (--skip-ayahs).");
        return;
    }

    if (!fs.existsSync(JSON_PATH)) {
        console.warn("  ⚠  data/quran.json not found — skipped.");
        return;
    }

    if (!forceAyahs) {
        const existing = await db.get("SELECT COUNT(*) AS n FROM ayahs");
        if (existing?.n > 0) {
            console.log(`  ${existing.n} ayahs already in DB — skipped. Use --force-ayahs to re-import.`);
            return;
        }
    }

    let ayahs;
    try {
        ayahs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
    } catch (err) {
        throw new Error(`Failed to parse quran.json: ${err.message}`);
    }

    if (!Array.isArray(ayahs) || ayahs.length === 0) {
        throw new Error("quran.json is empty or not an array.");
    }

    await db.begin();
    try {
        const sql = `
            INSERT OR REPLACE INTO ayahs (surah, ayah, page, text, juz, marhala, name)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        let n = 0;
        for (const a of ayahs) {
            if (!a.Surah || !a.Ayah || !a.Text) {
                console.warn(`  ⚠  Ayah missing required fields — skipped: ${JSON.stringify(a).slice(0, 60)}`);
                continue;
            }
            await db.run(sql, [
                a.Surah, a.Ayah, a.Page ?? 0, a.Text,
                a.Juz ?? a.Juzz,
                a.Marhala ?? "",
                SURAH_NAMES[a.Surah] || `Surah ${a.Surah}`,
            ]);
            n++;
        }

        await db.commit();
        console.log(`  Imported ${n} ayahs.`);
    } catch (err) {
        await db.rollback();
        throw err;
    }
}

// ─── Step 5 — Verify ──────────────────────────────────────────────────────────

const EXPECTED_TABLES = [
    "ayahs", "similarities", "users", "diary_logs", "tasks", "user_themes",
    "chat_sessions", "chat_messages", "coach_messages",
    "flashcard_sets", "flashcard_cards", "flashcard_questions", "flashcard_answers",
    "heatmap_scores",
    "scheduler_events", "scheduler_revision_units", "scheduler_page_analysis", "scheduler_schedules",
];

async function verify(db) {
    console.log("\nStep 5: Verifying tables…");

    const rows    = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const present = new Set(rows.map((r) => r.name));

    let allOk = true;
    for (const t of EXPECTED_TABLES) {
        if (present.has(t)) {
            console.log(`  ✓  ${t}`);
        } else {
            console.error(`  ✗  ${t}  ← MISSING`);
            allOk = false;
        }
    }

    if (!allOk) throw new Error("One or more expected tables are missing — check schema.sql and migrations.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    let opts;
    try {
        opts = parseArgs();
    } catch (err) {
        console.error(`Argument error: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        await applySchema(db);
        await runMigrations(db);
        await createCoachTables(db);
        await importAyahs(db, opts);
        await verify(db);

        console.log("\nSetup complete. Run: npm start\n");
    } catch (err) {
        console.error(`\nSetup failed: ${err.message}`);
        exitCode = 1;
    } finally {
        if (db) {
            try {
                await db.close();
            } catch (err) {
                console.error(`Warning: failed to close database — ${err.message}`);
                exitCode = 1;
            }
        }
        process.exitCode = exitCode;
    }
}

main();