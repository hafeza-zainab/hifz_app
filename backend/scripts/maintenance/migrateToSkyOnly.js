/**
 * scripts/maintenance/migrateToSkyOnly.js
 *
 * ONE-TIME migration: removes all non-sky theme rows from user_themes
 * and ensures every user has an active sky row.
 *
 * Safe to run multiple times (idempotent).
 *
 * What it does per user:
 *   1. Deletes all rows where theme_id != 'sky'.
 *   2. If a sky row already exists → ensures is_active = 1.
 *   3. If no sky row exists        → inserts one (streak = 0).
 *
 * Usage:
 *   node scripts/maintenance/migrateToSkyOnly.js [--dry-run] [--yes]
 *
 * Flags:
 *   --dry-run   Show what would change; make no DB changes.
 *   --yes       Skip the interactive confirmation prompt.
 */

"use strict";

const readline = require("readline");
const { openDb } = require("../_db");

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args  = process.argv.slice(2);
    let dryRun  = false;
    let yes     = false;

    for (const arg of args) {
        if (arg === "--dry-run") {
            dryRun = true;
        } else if (arg === "--yes") {
            yes = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { dryRun, yes };
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

    const { dryRun, yes } = opts;

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  migrateToSkyOnly.js — ONE-TIME theme migration          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    if (dryRun) {
        console.log("[DRY RUN] No changes will be written.\n");
    } else {
        console.log("This will:");
        console.log("  • DELETE all user_themes rows where theme_id != 'sky'");
        console.log("  • Ensure every user has an active sky row\n");

        if (!yes) {
            const ok = await confirm("Continue? (y/N) ");
            if (!ok) {
                console.log("Aborted.");
                return;
            }
        }
    }

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        // ── Dry run: preview only ─────────────────────────────────────────────

        if (dryRun) {
            const legacyRows = await db.all(
                "SELECT user_id, theme_id, streak, is_active FROM user_themes WHERE theme_id != 'sky' ORDER BY user_id"
            );
            const skyRows = await db.all(
                "SELECT user_id, streak, is_active FROM user_themes WHERE theme_id = 'sky' ORDER BY user_id"
            );
            const allUsers = await db.all(
                "SELECT DISTINCT user_id FROM user_themes ORDER BY user_id"
            );

            console.log(`\nLegacy rows to DELETE (${legacyRows.length}):`);
            if (legacyRows.length === 0) {
                console.log("  None.");
            } else {
                legacyRows.forEach((r) =>
                    console.log(`  user=${r.user_id}  theme=${r.theme_id}  streak=${r.streak}  active=${r.is_active}`)
                );
            }

            const usersWithSky = new Set(skyRows.map((r) => r.user_id));
            const usersNeedingSky = allUsers.filter((r) => !usersWithSky.has(r.user_id));

            console.log(`\nUsers needing a new sky row (${usersNeedingSky.length}):`);
            if (usersNeedingSky.length === 0) {
                console.log("  None.");
            } else {
                usersNeedingSky.forEach((r) => console.log(`  user=${r.user_id}`));
            }

            console.log("\nDry run complete. Re-run without --dry-run to apply.");
            return;
        }

        // ── Live run ──────────────────────────────────────────────────────────

        await db.begin();

        try {
            const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

            // 1. Count what we're about to delete
            const { count: legacyCount } = await db.get(
                "SELECT COUNT(*) AS count FROM user_themes WHERE theme_id != 'sky'"
            );

            // 2. Get all distinct users before deleting
            const allUsers = await db.all(
                "SELECT DISTINCT user_id FROM user_themes ORDER BY user_id"
            );

            // 3. Delete legacy rows
            await db.run("DELETE FROM user_themes WHERE theme_id != 'sky'");
            console.log(`\n  Deleted ${legacyCount} legacy theme row(s).`);

            // 4. For each user: ensure sky row exists and is active
            let inserted = 0;
            let activated = 0;

            for (const { user_id } of allUsers) {
                const existing = await db.get(
                    "SELECT * FROM user_themes WHERE user_id = ? AND theme_id = 'sky'",
                    [user_id]
                );

                if (existing) {
                    if (!existing.is_active) {
                        await db.run(
                            "UPDATE user_themes SET is_active = 1 WHERE user_id = ? AND theme_id = 'sky'",
                            [user_id]
                        );
                        activated++;
                    }
                } else {
                    await db.run(
                        `INSERT INTO user_themes
                             (user_id, theme_id, streak, max_streak, frozen_streak, last_log_date, is_active)
                         VALUES (?, 'sky', 0, 0, 0, ?, 1)`,
                        [user_id, yesterday]
                    );
                    inserted++;
                }
            }

            await db.commit();

            console.log(`  Sky rows inserted : ${inserted}`);
            console.log(`  Sky rows activated: ${activated}`);

        } catch (err) {
            await db.rollback();
            throw err;
        }

        // ── Verify ────────────────────────────────────────────────────────────

        const remaining = await db.all(
            "SELECT user_id, theme_id, streak, is_active FROM user_themes ORDER BY user_id"
        );
        const nonSky = remaining.filter((r) => r.theme_id !== "sky");

        console.log(`\nVerification:`);
        console.log(`  Total user_themes rows : ${remaining.length}`);
        console.log(`  Non-sky rows remaining : ${nonSky.length} (expected 0)`);

        if (nonSky.length > 0) {
            console.warn("  ⚠ Unexpected non-sky rows:");
            nonSky.forEach((r) => console.warn(`    user=${r.user_id}  theme=${r.theme_id}`));
        } else {
            console.log("  ✓ All rows are sky theme.");
        }

        console.log("\nMigration complete.\n");

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