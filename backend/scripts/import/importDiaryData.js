/**
 * scripts/import/importDiaryData.js
 *
 * Imports diary history text files into the diary_logs table.
 *
 * Source files expected in data/:
 *   jadeed_history.txt   — CSV: DD/MM/YYYY, rangeFrom, rangeTo, score
 *   murajah_history.txt  — one date per line: DD/MM/YYYY → juzNum (score), ...
 *   heatmap_data.txt     — Sipara N headers + Page N(quranPage) → score lines
 *
 * Usage:
 *   node scripts/import/importDiaryData.js [--user=<id>] [--dry-run]
 *
 * Flags:
 *   --user=N     Target user ID (default: 1)
 *   --dry-run    Parse and validate only; make no DB changes
 */

"use strict";

require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const { openDb } = require("../_db");

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR     = path.resolve(__dirname, "../../data");
const JADEED_FILE  = path.join(DATA_DIR, "jadeed_history.txt");
const MURAJAH_FILE = path.join(DATA_DIR, "murajah_history.txt");
const HEATMAP_FILE = path.join(DATA_DIR, "heatmap_data.txt");

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args  = process.argv.slice(2);
    let userId  = 1;
    let dryRun  = false;

    for (const arg of args) {
        if (arg.startsWith("--user=")) {
            const v = Number(arg.split("=")[1]);
            if (!Number.isInteger(v) || v <= 0) throw new RangeError(`--user must be a positive integer, got "${arg}"`);
            userId = v;
        } else if (arg === "--dry-run") {
            dryRun = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { userId, dryRun };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Converts DD/MM/YYYY → YYYY-MM-DD.
 * Returns null if the string is not a valid date.
 */
function parseDate(raw) {
    const match = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    // Validate by round-tripping through Date
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return iso;
}

// ─── Jadeed parser ────────────────────────────────────────────────────────────

function parseJadeed(filePath) {
    const records = [];
    const warnings = [];

    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    lines.forEach((raw, lineNo) => {
        const line = raw.trim();
        if (!line || line.startsWith("//") || line.startsWith("#")) return;

        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 4) {
            warnings.push(`Line ${lineNo + 1}: expected 4 columns, got ${parts.length} — skipped`);
            return;
        }

        const [dateStr, rangeFrom, rangeTo, scoreStr] = parts;
        const createdAt = parseDate(dateStr);
        if (!createdAt) {
            warnings.push(`Line ${lineNo + 1}: invalid date "${dateStr}" — skipped`);
            return;
        }

        const score = parseInt(scoreStr, 10);
        if (isNaN(score) || score < 0 || score > 10) {
            warnings.push(`Line ${lineNo + 1}: invalid score "${scoreStr}" — skipped`);
            return;
        }

        records.push({ createdAt, rangeFrom, rangeTo, score });
    });

    return { records, warnings };
}

// ─── Murajah parser ───────────────────────────────────────────────────────────

function parseMurajah(filePath) {
    const records = [];
    const warnings = [];
    const seen    = new Set(); // deduplicate by date+juz

    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    lines.forEach((raw, lineNo) => {
        const line = raw.trim();
        if (!line || line.startsWith("//") || line.startsWith("#") || line === "---") return;

        const match = line.match(/^(\d{2}\/\d{2}\/\d{4})\s*[→—|]\s*(.+)$/);
        if (!match) return; // skip headers / blank separators silently

        const dateStr  = match[1];
        const itemsStr = match[2];
        const createdAt = parseDate(dateStr);

        if (!createdAt) {
            warnings.push(`Line ${lineNo + 1}: invalid date "${dateStr}" — skipped`);
            return;
        }

        const items = itemsStr.split(/[,|]/);

        for (const item of items) {
            const cleaned = item.trim();
            if (!cleaned || cleaned === "N/A" || cleaned.startsWith("–")) continue;

            const itemMatch = cleaned.match(/^(\d+)\s*\((\d+)\)$/);
            if (!itemMatch) {
                warnings.push(`Line ${lineNo + 1}: cannot parse item "${cleaned}" — skipped`);
                continue;
            }

            const juzNum = itemMatch[1];
            const score  = parseInt(itemMatch[2], 10);

            if (isNaN(score) || score < 0 || score > 10) {
                warnings.push(`Line ${lineNo + 1}: invalid score "${itemMatch[2]}" — skipped`);
                continue;
            }

            const key = `${createdAt}_${juzNum}`;
            if (seen.has(key)) continue;
            seen.add(key);

            records.push({
                createdAt,
                rangeFrom: `Juz ${juzNum}`,
                rangeTo:   `Juz ${juzNum}`,
                score,
            });
        }
    });

    return { records, warnings };
}

// ─── Heatmap parser ───────────────────────────────────────────────────────────

function parseHeatmap(filePath) {
    const records = [];
    const warnings = [];
    const seen     = new Set();

    let currentSipara = null;
    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    lines.forEach((raw, lineNo) => {
        const line = raw.trim();
        if (!line || line === "---") return;

        const siparaMatch = line.match(/^Sipara\s+(\d+)$/i);
        if (siparaMatch) {
            currentSipara = parseInt(siparaMatch[1], 10);
            return;
        }

        const pageMatch = line.match(/^Page\s+(\d+)\s*\(\s*(\d+)\s*\)\s*[→—|]\s*([\d.]+)$/);
        if (!pageMatch) return;

        if (currentSipara === null) {
            warnings.push(`Line ${lineNo + 1}: page entry before any Sipara header — skipped`);
            return;
        }

        const pageInSipara = parseInt(pageMatch[1], 10);
        const quranPage    = parseInt(pageMatch[2], 10);
        const score        = parseFloat(pageMatch[3]);

        if (isNaN(score) || score < 0) {
            warnings.push(`Line ${lineNo + 1}: invalid score "${pageMatch[3]}" — skipped`);
            return;
        }

        const key = `${currentSipara}_${pageInSipara}`;
        if (seen.has(key)) return; // silently deduplicate
        seen.add(key);

        records.push({ sipara: currentSipara, pageInSipara, quranPage, score });
    });

    return { records, warnings };
}

// ─── DB writers ───────────────────────────────────────────────────────────────

async function insertJadeed(db, records, userId) {
    const sql = `
        INSERT OR IGNORE INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
        VALUES (?, 'jadeed', ?, ?, ?, ?)`;

    let inserted = 0;
    for (const r of records) {
        const { changes } = await db.run(sql, [userId, r.rangeFrom, r.rangeTo, r.score, r.createdAt]);
        inserted += changes;
    }
    return inserted;
}

async function insertMurajah(db, records, userId) {
    const sql = `
        INSERT OR IGNORE INTO diary_logs (user_id, type, range_from, range_to, score, created_at)
        VALUES (?, 'murajah', ?, ?, ?, ?)`;

    let inserted = 0;
    for (const r of records) {
        const { changes } = await db.run(sql, [userId, r.rangeFrom, r.rangeTo, r.score, r.createdAt]);
        inserted += changes;
    }
    return inserted;
}

async function insertHeatmap(db, records, userId) {
    const sql = `
        INSERT OR REPLACE INTO heatmap_scores (user_id, sipara, page_number, quran_page, score)
        VALUES (?, ?, ?, ?, ?)`;

    let inserted = 0;
    for (const r of records) {
        const { changes } = await db.run(sql, [userId, r.sipara, r.pageInSipara, r.quranPage, r.score]);
        inserted += changes;
    }
    return inserted;
}

// ─── Verify ───────────────────────────────────────────────────────────────────

async function verify(db, userId) {
    console.log("\nVerification:");
    const counts = await db.all(
        "SELECT type, COUNT(*) AS cnt FROM diary_logs WHERE user_id = ? GROUP BY type ORDER BY type",
        [userId]
    );
    for (const r of counts) {
        console.log(`  diary_logs.${r.type}: ${r.cnt}`);
    }

    const hm = await db.get(
        "SELECT COUNT(*) AS cnt FROM heatmap_scores WHERE user_id = ?",
        [userId]
    );
    console.log(`  heatmap_scores: ${hm?.cnt ?? 0}`);
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
    console.log(`Importing diary data for user ${userId}…\n`);

    // ── Parse all files first (fail fast before touching the DB) ──────────────

    const parsed = {};

    const fileSources = [
        { key: "heatmap", file: HEATMAP_FILE,  parser: parseHeatmap,  label: "heatmap_data.txt"   },
        { key: "jadeed",  file: JADEED_FILE,   parser: parseJadeed,   label: "jadeed_history.txt"  },
        { key: "murajah", file: MURAJAH_FILE,  parser: parseMurajah,  label: "murajah_history.txt" },
    ];

    let parseHadErrors = false;

    for (const { key, file, parser, label } of fileSources) {
        if (!fs.existsSync(file)) {
            console.warn(`  [SKIP] ${label} not found at ${file}`);
            parsed[key] = { records: [], warnings: [] };
            continue;
        }

        try {
            const result = parser(file);
            parsed[key]  = result;
            console.log(`  Parsed ${label}: ${result.records.length} records, ${result.warnings.length} warning(s)`);
            if (result.warnings.length) {
                result.warnings.forEach((w) => console.warn(`    ⚠  ${w}`));
            }
        } catch (err) {
            console.error(`  [ERROR] Failed to parse ${label}: ${err.message}`);
            parseHadErrors = true;
        }
    }

    if (parseHadErrors) {
        console.error("\nAborting due to parse errors.");
        process.exitCode = 1;
        return;
    }

    if (dryRun) {
        console.log("\nDry run complete. Re-run without --dry-run to import.");
        return;
    }

    // ── Write to DB ───────────────────────────────────────────────────────────

    let db;
    let exitCode = 0;

    try {
        db = await openDb();

        await db.begin();
        try {
            const hInserted = await insertHeatmap(db, parsed.heatmap.records, userId);
            const jInserted = await insertJadeed(db,  parsed.jadeed.records,  userId);
            const mInserted = await insertMurajah(db, parsed.murajah.records, userId);
            await db.commit();

            console.log(`\nInserted:`);
            console.log(`  heatmap_scores : ${hInserted}`);
            console.log(`  jadeed logs    : ${jInserted}`);
            console.log(`  murajah logs   : ${mInserted}`);
        } catch (err) {
            await db.rollback();
            throw err;
        }

        await verify(db, userId);
        console.log("\nDiary data import complete.\n");
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