/**
 * scripts/debug/checkDatabase.js
 *
 * Read-only sanity check: lists tables, row counts, and sample rows.
 * Safe to run at any time — makes no writes.
 *
 * Usage:
 *   node scripts/debug/checkDatabase.js
 */

"use strict";

const path = require("path");
const { openDb } = require("../_db");

// ─── Queries ──────────────────────────────────────────────────────────────────

const CHECKS = [
    {
        label: "Tables in database",
        sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        format: (rows) => rows.map((r) => `  - ${r.name}`).join("\n"),
    },
    {
        label: "Total diary_logs",
        sql: "SELECT COUNT(*) AS cnt FROM diary_logs",
        format: (rows) => `  ${rows[0]?.cnt ?? 0}`,
    },
    {
        label: "Entries by type",
        sql: "SELECT type, COUNT(*) AS cnt FROM diary_logs GROUP BY type ORDER BY type",
        format: (rows) =>
            rows.length
                ? rows.map((r) => `  ${r.type}: ${r.cnt}`).join("\n")
                : "  (none)",
    },
    {
        label: "Sample murajah entries (3)",
        sql: `SELECT id, user_id, type, range_from, range_to, score
              FROM diary_logs WHERE type='murajah' LIMIT 3`,
        format: (rows) =>
            rows.length
                ? rows.map((r) => `  ID ${r.id}: "${r.range_from}" → score ${r.score}`).join("\n")
                : "  (none found)",
    },
    {
        label: "Sample jadeed entries (3)",
        sql: `SELECT id, user_id, type, range_from, range_to, score
              FROM diary_logs WHERE type='jadeed' LIMIT 3`,
        format: (rows) =>
            rows.length
                ? rows.map((r) => `  ID ${r.id}: "${r.range_from}" → score ${r.score}`).join("\n")
                : "  (none found)",
    },
    {
        label: "Users (first 3)",
        sql: "SELECT id, username FROM users LIMIT 3",
        format: (rows) =>
            rows.length
                ? rows.map((r) => `  ID ${r.id}: ${r.username}`).join("\n")
                : "  (none found)",
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    let db;
    let exitCode = 0;

    try {
        db = await openDb({ readOnly: true });
        console.log(`Connected to: ${path.resolve(__dirname, "../../database/quran.db")}\n`);

        for (const check of CHECKS) {
            try {
                const rows = await db.all(check.sql);
                console.log(`${check.label}:`);
                console.log(check.format(rows));
                console.log();
            } catch (err) {
                // A missing table is non-fatal — report it and keep going
                console.error(`  [SKIP] ${check.label}: ${err.message}\n`);
                exitCode = 1;
            }
        }
    } catch (err) {
        console.error(`Fatal: ${err.message}`);
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