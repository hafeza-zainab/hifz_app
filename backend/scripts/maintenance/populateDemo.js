/**
 * scripts/maintenance/populateDemo.js
 *
 * ⚠  DESTRUCTIVE — Deletes all diary_logs for the target user, then inserts
 *    365 days of synthetic demo data to showcase the immersive view and all
 *    theme milestones.
 *
 * Usage:
 *   node scripts/maintenance/populateDemo.js [--user=<id>] [--dry-run] [--yes]
 *
 * Flags:
 *   --user=N    Target user ID (default: 1)
 *   --dry-run   Generate data in memory only; make no DB changes.
 *   --yes       Skip the interactive confirmation prompt.
 */

"use strict";

const readline = require("readline");
const { openDb } = require("../_db");

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args  = process.argv.slice(2);
    let userId  = 1;
    let dryRun  = false;
    let yes     = false;

    for (const arg of args) {
        if (arg.startsWith("--user=")) {
            const v = Number(arg.split("=")[1]);
            if (!Number.isInteger(v) || v <= 0) {
                throw new RangeError(`--user must be a positive integer, got "${arg}"`);
            }
            userId = v;
        } else if (arg === "--dry-run") {
            dryRun = true;
        } else if (arg === "--yes") {
            yes = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { userId, dryRun, yes };
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────

function confirm(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === "y");
        });
    });
}

// ─── Data generation ──────────────────────────────────────────────────────────

const TYPES  = ["murajah", "tasmee", "jadeed", "murajah"];
const JUZZES = Array.from({ length: 30 }, (_, i) => i + 1);
const SURAHS = [
    "al-Baqara", "Ali Imran", "An-Nisa",   "Al-Maidah",
    "Al-Anam",   "Al-Araf",  "Al-Anfal",  "At-Tawba",
    "Yunus",     "Hud",
];

function generateDemoData(userId) {
    const records  = [];
    const today    = new Date();
    const startDay = new Date(today);
    startDay.setFullYear(startDay.getFullYear() - 1);

    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
        const date    = new Date(startDay);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().slice(0, 10);

        const type          = TYPES[dayOffset % TYPES.length];
        const entriesPerDay = Math.floor(Math.random() * 3) + 1; // 1–3

        for (let i = 0; i < entriesPerDay; i++) {
            const score = Math.floor(Math.random() * 5) + 6; // 6–10
            let rangeFrom, rangeTo;

            if (type === "murajah" || type === "tasmee") {
                const juz  = JUZZES[Math.floor(Math.random() * JUZZES.length)];
                rangeFrom  = `Juz ${juz}`;
                rangeTo    = `Juz ${juz}`;
            } else {
                const surah = SURAHS[Math.floor(Math.random() * SURAHS.length)];
                const start = Math.floor(Math.random() * 100) + 1;
                const end   = start + Math.floor(Math.random() * 50) + 10;
                rangeFrom   = `${surah} (${start})`;
                rangeTo     = `${surah} (${end})`;
            }

            records.push({
                userId,
                type,
                rangeFrom,
                rangeTo,
                score,
                createdAt: `${dateStr}T12:00:00`,
            });
        }
    }

    return records;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function clearExisting(db, userId) {
    const { changes } = await db.run(
        "DELETE FROM diary_logs WHERE user_id = ?",
        [userId]
    );
    return changes;
}

async function insertRecords(db, records) {
    const sql = `
        INSERT INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`;

    let inserted = 0;

    for (const r of records) {
        await db.run(sql, [r.userId, r.type, r.rangeFrom, r.rangeTo, r.score, r.createdAt]);
        inserted++;
        if (inserted % 100 === 0) {
            process.stdout.write(`  Inserting… ${inserted} / ${records.length}\r`);
        }
    }

    process.stdout.write("\n");
    return inserted;
}

async function verify(db, userId) {
    const total = await db.get(
        "SELECT COUNT(*) AS cnt FROM diary_logs WHERE user_id = ?",
        [userId]
    );
    const byType = await db.all(
        "SELECT type, COUNT(*) AS cnt FROM diary_logs WHERE user_id = ? GROUP BY type ORDER BY type",
        [userId]
    );
    const range = await db.get(
        "SELECT MIN(DATE(created_at)) AS first, MAX(DATE(created_at)) AS last FROM diary_logs WHERE user_id = ?",
        [userId]
    );

    console.log(`\nVerification (user ${userId}):`);
    console.log(`  Total entries : ${total?.cnt ?? 0}`);
    byType.forEach((r) => console.log(`  ${r.type.padEnd(10)}: ${r.cnt}`));
    if (range) console.log(`  Date range    : ${range.first} → ${range.last}`);
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

    const { userId, dryRun, yes } = opts;

    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  ⚠  DESTRUCTIVE — populateDemo.js            ║");
    console.log("╚══════════════════════════════════════════════╝");
    if (dryRun) {
        console.log("[DRY RUN] No changes will be written.\n");
    } else {
        console.log(`This will DELETE all diary_logs for user ${userId} and replace them`);
        console.log("with 365 days of synthetic demo data.\n");

        if (!yes) {
            const ok = await confirm("Continue? (y/N) ");
            if (!ok) {
                console.log("Aborted.");
                return;
            }
        }
    }

    // ── Generate ──────────────────────────────────────────────────────────────

    console.log(`\nGenerating demo data for user ${userId}…`);
    const records = generateDemoData(userId);
    console.log(`  Generated ${records.length} entries across 365 days.`);

    if (dryRun) {
        console.log("\nDry run complete. Re-run without --dry-run to write.");
        return;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        await db.begin();
        try {
            const deleted  = await clearExisting(db, userId);
            console.log(`  Cleared ${deleted} existing entries.`);

            const inserted = await insertRecords(db, records);
            await db.commit();
            console.log(`  Inserted ${inserted} demo entries.`);
        } catch (err) {
            await db.rollback();
            throw err;
        }

        await verify(db, userId);
        console.log("\nDemo data population complete.\n");
    } catch (err) {
        console.error(`\nFailed: ${err.message}`);
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