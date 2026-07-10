/**
 * scripts/maintenance/generateSimilarities.js
 *
 * Compares all ayah pairs and writes unique_pairs.json.
 * CPU-intensive — run offline before importSimilarities.js.
 *
 * Usage:
 *   node scripts/maintenance/generateSimilarities.js [--threshold=0.25] [--dry-run]
 *
 * Flags:
 *   --threshold=N   Jaccard similarity cutoff (default: 0.25, range: 0–1)
 *   --dry-run       Run the comparison but do not write unique_pairs.json
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────

const JSON_IN  = path.resolve(__dirname, "../../data/quran.json");
const JSON_OUT = path.resolve(__dirname, "../../data/unique_pairs.json");

const DEFAULT_THRESHOLD = 0.25;

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
    const args      = process.argv.slice(2);
    let threshold   = DEFAULT_THRESHOLD;
    let dryRun      = false;

    for (const arg of args) {
        if (arg.startsWith("--threshold=")) {
            const v = parseFloat(arg.split("=")[1]);
            if (isNaN(v) || v < 0 || v > 1) {
                throw new RangeError(`--threshold must be between 0 and 1, got "${arg}"`);
            }
            threshold = v;
        } else if (arg === "--dry-run") {
            dryRun = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return { threshold, dryRun };
}

// ─── Arabic normalisation ─────────────────────────────────────────────────────

const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g;

function removeTashkeel(text) {
    return text.replace(TASHKEEL_RE, "");
}

function normalizeArabic(text) {
    let t = removeTashkeel(text);
    t = t.replace(/ﷲ/g,      "الله");
    t = t.replace(/[أإآا]/g,  "ا");
    t = t.replace(/ى/g,       "ي");
    return t;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function jaccardSimilarity(setA, setB) {
    let intersection = 0;
    for (const w of setA) if (setB.has(w)) intersection++;
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function maxSequentialMatch(wordsA, wordsB) {
    let max = 0;
    for (let i = 0; i < wordsA.length; i++) {
        for (let j = 0; j < wordsB.length; j++) {
            let k = 0;
            while (
                i + k < wordsA.length &&
                j + k < wordsB.length &&
                wordsA[i + k] === wordsB[j + k]
            ) k++;
            if (k > max) max = k;
        }
    }
    return max;
}

// ─── Repeated-verse exclusions ────────────────────────────────────────────────

const INTERNAL_EXCLUSIONS = [
    { surah: 26, text: normalizeArabic("وَإِنَّ رَبَّكَ لَهُوَ الْعَزِيزُ الرَّحِيمُ") },
    { surah: 54, text: normalizeArabic("فَكَيْفَ كَانَ عَذَابِي وَنُذُرِ") },
    { surah: 54, text: normalizeArabic("وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُدَّكِرٍ") },
    { surah: 55, text: normalizeArabic("فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ") },
    { surah: 77, text: normalizeArabic("وَيْلٌ يَوْمَئِذٍ لِلْمُكَذِّبِينَ") },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
    let opts;
    try {
        opts = parseArgs();
    } catch (err) {
        console.error(`Argument error: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    const { threshold, dryRun } = opts;
    if (dryRun) console.log("[DRY RUN] unique_pairs.json will NOT be written.\n");
    console.log(`Jaccard threshold : ${threshold}`);

    // ── Load quran.json ───────────────────────────────────────────────────────

    if (!fs.existsSync(JSON_IN)) {
        console.error(`quran.json not found at: ${JSON_IN}`);
        process.exitCode = 1;
        return;
    }

    let quranData;
    try {
        quranData = JSON.parse(fs.readFileSync(JSON_IN, "utf8"));
    } catch (err) {
        console.error(`Failed to parse quran.json: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    if (!Array.isArray(quranData) || quranData.length === 0) {
        console.error("quran.json is empty or not an array.");
        process.exitCode = 1;
        return;
    }

    console.log(`Loaded ${quranData.length} ayahs from quran.json.\n`);

    // ── Prepare ayah objects ──────────────────────────────────────────────────

    const ayahs = quranData.map((a) => {
        if (!a.Text || typeof a.Text !== "string") {
            throw new TypeError(`Ayah ${a.Surah}:${a.Ayah} has no Text field`);
        }
        return {
            surah : a.Surah,
            ayah  : a.Ayah,
            page  : a.Page  ?? 0,
            words : normalizeArabic(a.Text).split(/\s+/).filter((w) => w.length > 0),
        };
    });

    // ── Compare all pairs ─────────────────────────────────────────────────────

    const uniquePairs = new Map();
    const startTime   = Date.now();

    for (let i = 0; i < ayahs.length; i++) {
        const a = ayahs[i];
        if (a.ayah === 0) continue;

        const setA = new Set(a.words);

        for (let j = i + 1; j < ayahs.length; j++) {
            const b = ayahs[j];
            if (b.ayah === 0) continue;

            // Quick length filter — avoids expensive Jaccard for very different lengths
            if (Math.abs(a.words.length - b.words.length) > 15) continue;

            // Skip known repeated refrains within the same surah
            if (a.surah === b.surah) {
                const textA = a.words.join(" ");
                const textB = b.words.join(" ");
                let skip = false;
                for (const rule of INTERNAL_EXCLUSIONS) {
                    if (
                        a.surah === rule.surah &&
                        textA.includes(rule.text) &&
                        textB.includes(rule.text)
                    ) {
                        skip = true;
                        break;
                    }
                }
                if (skip) continue;
            }

            const setB  = new Set(b.words);
            const score = jaccardSimilarity(setA, setB);
            if (score < threshold) continue;

            const sharedWords  = [...setB].filter((w) => setA.has(w));
            const sequential   = maxSequentialMatch(a.words, b.words);

            if (sharedWords.length >= 5 || sequential >= 3) {
                const id1 = `${a.surah}:${a.ayah}`;
                const id2 = `${b.surah}:${b.ayah}`;
                const key = id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

                if (!uniquePairs.has(key)) {
                    const [first, second] = id1 < id2 ? [a, b] : [b, a];
                    uniquePairs.set(key, {
                        surah_1 : first.surah,  ayah_1 : first.ayah,  page_1 : first.page,
                        surah_2 : second.surah, ayah_2 : second.ayah, page_2 : second.page,
                        similarity_score : score,
                        tips             : [],
                    });
                }
            }
        }

        if (i % 500 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`  Progress: ${i} / ${ayahs.length} ayahs  (${elapsed}s)\r`);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write("\n");
    console.log(`\nFound ${uniquePairs.size} unique pairs in ${elapsed}s.`);

    if (dryRun) {
        console.log("Dry run complete. Re-run without --dry-run to write unique_pairs.json.");
        return;
    }

    // ── Write output ──────────────────────────────────────────────────────────

    try {
        const output = JSON.stringify([...uniquePairs.values()], null, 2);
        fs.writeFileSync(JSON_OUT, output, "utf8");
        console.log(`\nExported to: ${JSON_OUT}`);
        console.log("Next step: node scripts/import/importSimilarities.js\n");
    } catch (err) {
        console.error(`Failed to write unique_pairs.json: ${err.message}`);
        process.exitCode = 1;
    }
}

// Wrap synchronous main in a top-level try/catch
try {
    main();
} catch (err) {
    console.error(`Unexpected error: ${err.message}`);
    process.exitCode = 1;
}