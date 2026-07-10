/**
 * scripts/import/importHeatmapData.js
 *
 * Imports heatmap_data.txt into the heatmap_scores table.
 * This is a standalone script for heatmap-only re-imports.
 * For full diary imports (jadeed + murajah + heatmap) use importDiaryData.js.
 *
 * Usage:
 *   node scripts/import/importHeatmapData.js [--user=<id>] [--dry-run]
 *
 * Flags:
 *   --user=N    Target user ID (default: 1)
 *   --dry-run   Parse and validate only; make no DB changes.
 */

"use strict";

require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { openDb } = require("../_db");

// ─── Config ───────────────────────────────────────────────────────────────────

const HEATMAP_FILE = path.resolve(__dirname, "../../data/heatmap_data.txt");

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args  = process.argv.slice(2);
    let userId  = 1;
    let dryRun  = false;

    for (const arg of args) {
        if (arg.startsWith("--user=")) {
            const v = Number(arg.split("=")[1]);
            if (!Number.isInteger(v) || v <= 0) {
                throw new RangeError(`--user must be a positive integer, got "${arg}"`);
            }
            userId = v;
        } else if (arg === "--dry-run") {
            dryRun = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { userId, dryRun };
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses heatmap_data.txt into an array of record objects.
 * Returns { records, warnings }.
 */
function parseHeatmapFile(filePath) {
    const lines    = fs.readFileSync(filePath, "utf8").split("\n");
    const records  = [];
    const warnings = [];
    const seen     = new Set(); // deduplicate sipara+page

    let currentSipara = null;

    lines.forEach((raw, lineNo) => {
        const line = raw.trim();
        if (!line || line === "---") return;

        // ── Sipara header ─────────────────────────────────────────────────────
        const siparaMatch = line.match(/^Sipara\s+(\d+)$/i);
        if (siparaMatch) {
            const n = parseInt(siparaMatch[1], 10);
            if (n < 1 || n > 30) {
                warnings.push(`Line ${lineNo + 1}: Sipara number out of range (${n}) — skipped`);
                return;
            }
            currentSipara = n;
            return;
        }

        // ── Page line ─────────────────────────────────────────────────────────
        const pageMatch = line.match(/^Page\s+(\d+)\s*\(\s*(\d+)\s*\)\s*[→—|]\s*([\d.]+)$/);
        if (!pageMatch) return; // comments or unrecognised lines — skip silently

        if (currentSipara === null) {
            warnings.push(`Line ${lineNo + 1}: page entry appears before any Sipara header — skipped`);
            return;
        }

        const pageInSipara = parseInt(pageMatch[1], 10);
        const quranPage    = parseInt(pageMatch[2], 10);
        const score        = parseFloat(pageMatch[3]);

        if (isNaN(score) || score < 0) {
            warnings.push(`Line ${lineNo + 1}: invalid score "${pageMatch[3]}" — skipped`);
            return;
        }

        if (quranPage < 1 || quranPage > 604) {
            warnings.push(`Line ${lineNo + 1}: Quran page ${quranPage} out of range (1–604) — skipped`);
            return;
        }

        const key = `${currentSipara}_${pageInSipara}`;
        if (seen.has(key)) return; // silently deduplicate
        seen.add(key);

        records.push({ sipara: currentSipara, pageInSipara, quranPage, score });
    });

    return { records, warnings };
}

// ─── DB writer ────────────────────────────────────────────────────────────────

async function insertHeatmap(db, records, userId) {
    const sql = `
        INSERT OR REPLACE INTO heatmap_scores
            (user_id, sipara, page_number, quran_page, score)
        VALUES (?, ?, ?, ?, ?)`;

    let inserted = 0;

    for (const r of records) {
        const { changes } = await db.run(sql, [
            userId, r.sipara, r.pageInSipara, r.quranPage, r.score,
        ]);
        inserted += changes;
    }

    return inserted;
}

// ─── Verify ───────────────────────────────────────────────────────────────────

async function verify(db, userId) {
    const row = await db.get(
        "SELECT COUNT(*) AS cnt FROM heatmap_scores WHERE user_id = ?",
        [userId]
    );
    const sample = await db.all(
        "SELECT sipara, page_number, quran_page, score FROM heatmap_scores WHERE user_id = ? LIMIT 3",
        [userId]
    );

    console.log(`\nVerification (user ${userId}):`);
    console.log(`  heatmap_scores: ${row?.cnt ?? 0} records`);
    if (sample.length) {
        console.log("  Sample:");
        sample.forEach((s) =>
            console.log(`    Sipara ${s.sipara}, Page ${s.page_number} (Quran p.${s.quran_page}): score ${s.score}`)
        );
    }
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

    const { userId, dryRun } = opts;
    if (dryRun) console.log("[DRY RUN] No changes will be written to the database.\n");
    console.log(`Importing heatmap data for user ${userId}…\n`);

    // ── Parse ─────────────────────────────────────────────────────────────────

    if (!fs.existsSync(HEATMAP_FILE)) {
        console.error(`heatmap_data.txt not found at: ${HEATMAP_FILE}`);
        process.exitCode = 1;
        return;
    }

    let records, warnings;
    try {
        ({ records, warnings } = parseHeatmapFile(HEATMAP_FILE));
    } catch (err) {
        console.error(`Failed to parse heatmap_data.txt: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    console.log(`Parsed ${records.length} records, ${warnings.length} warning(s).`);
    if (warnings.length) {
        warnings.forEach((w) => console.warn(`  ⚠  ${w}`));
    }

    if (dryRun) {
        console.log("\nDry run complete. Re-run without --dry-run to import.");
        return;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        await db.begin();
        try {
            const inserted = await insertHeatmap(db, records, userId);
            await db.commit();
            console.log(`\nInserted: ${inserted} heatmap record(s).`);
        } catch (err) {
            await db.rollback();
            throw err;
        }

        await verify(db, userId);
        console.log("\nHeatmap import complete.\n");
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