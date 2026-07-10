/**
 * scripts/import/importSimilarities.js
 *
 * Reads unique_pairs.json (produced by maintenance/generateSimilarities.js)
 * and populates the similarities table bidirectionally.
 *
 * Usage:
 *   node scripts/import/importSimilarities.js [--dry-run]
 *
 * Flags:
 *   --dry-run   Validate the JSON file only; make no DB changes.
 */

"use strict";

require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { openDb } = require("../_db");

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_PATH = path.resolve(__dirname, "../../data/unique_pairs.json");

const INSERT_SQL = `
    INSERT OR IGNORE INTO similarities
        (source_surah, source_ayah, source_page,
         target_surah, target_ayah, target_page,
         similarity_score, tips)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args   = process.argv.slice(2);
    let dryRun   = false;

    for (const arg of args) {
        if (arg === "--dry-run") {
            dryRun = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return { dryRun };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates and filters the raw pairs array.
 * Returns { valid, invalid } counts plus the filtered array.
 */
function validatePairs(raw) {
    if (!Array.isArray(raw)) {
        throw new TypeError(`unique_pairs.json must contain a JSON array, got: ${typeof raw}`);
    }

    const valid   = [];
    let   invalid = 0;

    for (const p of raw) {
        // Must have all required numeric fields and non-zero ayahs
        if (
            typeof p.surah_1 !== "number" || typeof p.ayah_1 !== "number" ||
            typeof p.surah_2 !== "number" || typeof p.ayah_2 !== "number" ||
            p.ayah_1 === 0 || p.ayah_2 === 0
        ) {
            invalid++;
            continue;
        }

        if (typeof p.similarity_score !== "number" || p.similarity_score < 0 || p.similarity_score > 1) {
            invalid++;
            continue;
        }

        valid.push(p);
    }

    return { valid, invalid };
}

// ─── DB writer ────────────────────────────────────────────────────────────────

async function importPairs(db, pairs) {
    let inserted = 0;

    // Wipe existing data first so re-runs are idempotent
    await db.run("DELETE FROM similarities");

    const BATCH = 500;

    for (let i = 0; i < pairs.length; i += BATCH) {
        const batch = pairs.slice(i, i + BATCH);

        for (const p of batch) {
            const tips = JSON.stringify(Array.isArray(p.tips) ? p.tips : []);

            // Forward direction
            const r1 = await db.run(INSERT_SQL, [
                p.surah_1, p.ayah_1, p.page_1 ?? null,
                p.surah_2, p.ayah_2, p.page_2 ?? null,
                p.similarity_score, tips,
            ]);
            inserted += r1.changes;

            // Reverse direction
            const r2 = await db.run(INSERT_SQL, [
                p.surah_2, p.ayah_2, p.page_2 ?? null,
                p.surah_1, p.ayah_1, p.page_1 ?? null,
                p.similarity_score, tips,
            ]);
            inserted += r2.changes;
        }

        process.stdout.write(`  Progress: ${Math.min(i + BATCH, pairs.length)} / ${pairs.length} pairs\r`);
    }

    process.stdout.write("\n"); // clear progress line
    return inserted;
}

// ─── Verify ───────────────────────────────────────────────────────────────────

async function verify(db) {
    const row = await db.get("SELECT COUNT(*) AS cnt FROM similarities");
    console.log(`\nVerification:`);
    console.log(`  similarities rows: ${row?.cnt ?? 0}`);
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

    const { dryRun } = opts;
    if (dryRun) console.log("[DRY RUN] No changes will be written to the database.\n");

    // ── Load + validate JSON ──────────────────────────────────────────────────

    if (!fs.existsSync(DATA_PATH)) {
        console.error(`unique_pairs.json not found at: ${DATA_PATH}`);
        console.error("Run: node scripts/maintenance/generateSimilarities.js first.");
        process.exitCode = 1;
        return;
    }

    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    } catch (err) {
        console.error(`Failed to parse unique_pairs.json: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    let valid, invalid;
    try {
        ({ valid, invalid } = validatePairs(raw));
    } catch (err) {
        console.error(`Validation error: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    console.log(`Loaded ${raw.length} pairs from JSON.`);
    if (invalid > 0) console.warn(`  ⚠  Filtered out ${invalid} invalid pair(s) (ayah = 0 or bad fields).`);
    console.log(`  Importing ${valid.length} valid pairs → ${valid.length * 2} DB rows.\n`);

    if (dryRun) {
        console.log("Dry run complete. Re-run without --dry-run to import.");
        return;
    }

    // ── Write to DB ───────────────────────────────────────────────────────────

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        await db.begin();
        try {
            const inserted = await importPairs(db, valid);
            await db.commit();
            console.log(`Inserted: ${inserted} row(s).`);
        } catch (err) {
            await db.rollback();
            throw err;
        }

        await verify(db);
        console.log("\nSimilarities import complete.\n");
    } catch (err) {
        console.error(`\nImport failed: ${err.message}`);
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