/**
 * scripts/debug/checkStreakData.js
 *
 * Prints streak data and diary log summary for a given user.
 * Safe to run at any time — makes no writes.
 *
 * Usage:
 *   node scripts/debug/checkStreakData.js [userId]
 *   USER_ID=2 node scripts/debug/checkStreakData.js
 */

"use strict";

const { openDb } = require("../_db");

// ─── Argument parsing ─────────────────────────────────────────────────────────

function parseUserId(value) {
    const raw = value || process.env.USER_ID || "1";
    const id  = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new RangeError(`User ID must be a positive integer, got: "${raw}"`);
    }
    return id;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function printThemeRows(rows) {
    console.log("\nuser_themes:");
    if (!rows.length) {
        console.log("  No theme rows found.");
        return;
    }
    for (const r of rows) {
        console.log(
            `  theme=${r.theme_id}  streak=${r.streak}  max=${r.max_streak}  active=${r.is_active}`
        );
    }
}

function printDiarySummary(row) {
    console.log("\ndiary_logs:");
    console.log(`  total      = ${row?.total ?? 0}`);
    console.log(`  date_range = ${row?.first ?? "none"} → ${row?.last ?? "none"}`);
}

function printTodayRows(rows, today) {
    console.log(`\ntoday (${today}):`);
    if (!rows.length) {
        console.log("  No entries today.");
        return;
    }
    for (const r of rows) {
        console.log(`  ${r.type}: ${r.count}`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    let userId;
    try {
        userId = parseUserId(process.argv[2]);
    } catch (err) {
        console.error(`Argument error: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    console.log(`Checking streak data for user ${userId}`);

    let db;
    let exitCode = 0;

    try {
        db = await openDb({ readOnly: true });

        const [themes, summary, todayRows] = await Promise.all([
            db.all(
                `SELECT theme_id, streak, max_streak, is_active
                 FROM user_themes
                 WHERE user_id = ?
                 ORDER BY is_active DESC, theme_id ASC`,
                [userId]
            ),
            db.get(
                `SELECT MIN(DATE(created_at)) AS first,
                        MAX(DATE(created_at)) AS last,
                        COUNT(*)              AS total
                 FROM diary_logs
                 WHERE user_id = ?`,
                [userId]
            ),
            db.all(
                `SELECT type, COUNT(*) AS count
                 FROM diary_logs
                 WHERE user_id = ? AND DATE(created_at) = ?
                 GROUP BY type
                 ORDER BY type ASC`,
                [userId, today]
            ),
        ]);

        printThemeRows(themes);
        printDiarySummary(summary);
        printTodayRows(todayRows, today);
    } catch (err) {
        console.error(`\nStreak data check failed: ${err.message}`);
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