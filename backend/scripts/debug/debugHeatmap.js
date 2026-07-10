/**
 * scripts/debug/debugHeatmap.js
 *
 * Inspects heatmap-related rows in diary_logs to diagnose missing or
 * malformed data.  Makes no writes.
 *
 * Usage:
 *   node scripts/debug/debugHeatmap.js
 */

"use strict";

const { openDb } = require("../_db");

// ─── Queries ──────────────────────────────────────────────────────────────────

const CHECKS = [
    {
        label: "Total murajah entries",
        sql:   "SELECT COUNT(*) AS cnt FROM diary_logs WHERE type = 'murajah'",
    },
    {
        label: "Heatmap entries (range_from contains 'Page')",
        sql:   "SELECT COUNT(*) AS cnt FROM diary_logs WHERE type = 'murajah' AND range_from LIKE '%Page%'",
    },
    {
        label: "Distinct range_from values (first 10)",
        sql:   `SELECT DISTINCT range_from
                FROM diary_logs
                WHERE type = 'murajah' AND range_from LIKE '%Page%'
                LIMIT 10`,
    },
    {
        label: "Sample full heatmap rows (5)",
        sql:   `SELECT *
                FROM diary_logs
                WHERE type = 'murajah' AND range_from LIKE '%Page%'
                LIMIT 5`,
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printResult(label, rows) {
    console.log(`\n${label}: ${rows.length} row(s)`);
    rows.slice(0, 5).forEach((row, i) => console.log(`  [${i + 1}]`, row));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    let db;
    let exitCode = 0;

    try {
        db = await openDb({ readOnly: true });

        for (const { label, sql } of CHECKS) {
            try {
                const rows = await db.all(sql);
                printResult(label, rows);
            } catch (err) {
                console.error(`  [SKIP] ${label}: ${err.message}`);
                exitCode = 1;
            }
        }

        console.log(); // trailing newline
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