/**
 * scripts/maintenance/seedDemoThemes.js
 *
 * ⚠  DESTRUCTIVE — Deletes all user_themes for the target user, then inserts
 *    the sky theme at a configurable streak level for visual demo purposes.
 *
 * Usage:
 *   node scripts/maintenance/seedDemoThemes.js [--user=<id>] [--streak=<n>] [--dry-run] [--yes]
 *
 * Flags:
 *   --user=N     Target user ID (default: 1)
 *   --streak=N   Streak days to seed the theme at (default: 365)
 *   --dry-run    Preview what would be inserted; make no DB changes.
 *   --yes        Skip the interactive confirmation prompt.
 */

"use strict";

const readline = require("readline");
const { openDb } = require("../_db");

// ─── Config ───────────────────────────────────────────────────────────────────

const ALL_THEMES = ["sky"];

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args  = process.argv.slice(2);
    let userId  = 1;
    let streak  = 365;
    let dryRun  = false;
    let yes     = false;

    for (const arg of args) {
        if (arg.startsWith("--user=")) {
            const v = Number(arg.split("=")[1]);
            if (!Number.isInteger(v) || v <= 0) {
                throw new RangeError(`--user must be a positive integer, got "${arg}"`);
            }
            userId = v;
        } else if (arg.startsWith("--streak=")) {
            const v = Number(arg.split("=")[1]);
            if (!Number.isInteger(v) || v < 0) {
                throw new RangeError(`--streak must be a non-negative integer, got "${arg}"`);
            }
            streak = v;
        } else if (arg === "--dry-run") {
            dryRun = true;
        } else if (arg === "--yes") {
            yes = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { userId, streak, dryRun, yes };
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

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function seedThemes(db, userId, streak) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    const rows = ALL_THEMES.map((themeId, index) => ({
        themeId,
        isActive: index === 0 ? 1 : 0,
    }));

    // Clear first
    await db.run("DELETE FROM user_themes WHERE user_id = ?", [userId]);

    const sql = `
        INSERT INTO user_themes
            (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    for (const r of rows) {
        await db.run(sql, [
            userId, r.themeId, streak, streak,
            Math.max(0, streak - 1), yesterday, r.isActive,
        ]);
        const badge = r.isActive ? " ← ACTIVE" : "";
        console.log(`  Inserted: ${r.themeId.padEnd(12)} streak=${streak}${badge}`);
    }

    return rows.length;
}

async function verify(db, userId) {
    const rows = await db.all(
        "SELECT theme_id, streak, max_streak, is_active FROM user_themes WHERE user_id = ? ORDER BY theme_id",
        [userId]
    );
    console.log(`\nVerification — user_themes for user ${userId}: ${rows.length} row(s)`);
    rows.forEach((r) =>
        console.log(
            `  ${r.theme_id.padEnd(12)} streak=${r.streak}  max=${r.max_streak}  active=${r.is_active}`
        )
    );
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

    const { userId, streak, dryRun, yes } = opts;

    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  ⚠  DESTRUCTIVE — seedDemoThemes.js          ║");
    console.log("╚══════════════════════════════════════════════╝");

    if (dryRun) {
        console.log("[DRY RUN] No changes will be written.\n");
    } else {
        console.log(`This will DELETE all user_themes for user ${userId} and seed`);
        console.log(`all ${ALL_THEMES.length} theme(s) at streak = ${streak} days.\n`);

        if (!yes) {
            const ok = await confirm("Continue? (y/N) ");
            if (!ok) {
                console.log("Aborted.");
                return;
            }
        }
    }

    if (dryRun) {
        console.log("\nWould insert:");
        ALL_THEMES.forEach((id, i) =>
            console.log(`  ${id.padEnd(12)} streak=${streak}${i === 0 ? " ← ACTIVE" : ""}`)
        );
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
            const count = await seedThemes(db, userId, streak);
            await db.commit();
            console.log(`\nInserted ${count} theme row(s).`);
        } catch (err) {
            await db.rollback();
            throw err;
        }

        await verify(db, userId);
        console.log("\nTheme seeding complete.");
        console.log("Sky theme is active at the configured streak level.\n");
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