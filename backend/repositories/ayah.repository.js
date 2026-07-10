//C:\quran-similarity-app\backend\repositories\ayah.repository.js
"use strict";

/**
 * ayah.repository.js
 *
 * Single source of truth for all ayahs-table SQL.
 * Replaces modules/ayah/ayah.model.js — controllers import this file instead.
 * ayah.model.js should be deleted once all callers have been updated.
 */

const db = require("../config/database");

// ─── Single lookups ───────────────────────────────────────────────────────────

const getAyah = (surah, ayah) =>
    db.get(
        `SELECT surah, ayah, text, juz, marhala, name, page
         FROM ayahs WHERE surah = ? AND ayah = ?`,
        [surah, ayah]
    );

// ─── Surah-level ──────────────────────────────────────────────────────────────

const getAllSurahs = () =>
    db.all("SELECT DISTINCT surah, name FROM ayahs ORDER BY surah ASC");

/** Ayah numbers only — used by lightweight dropdowns. */
const getAyahsBySurah = (surah) =>
    db.all(
        "SELECT ayah FROM ayahs WHERE surah = ? ORDER BY ayah ASC",
        [surah]
    );

/**
 * Full ayah rows for a surah.
 *  • Surah 1 (Al-Fatihah) — include ayah 0; Bismillah is counted there.
 *  • All other surahs     — exclude ayah 0 (Bismillah header).
 */
const getFullAyahsBySurah = (surah) => {
    const n = parseInt(surah, 10);
    if (n === 1) {
        return db.all(
            `SELECT surah, ayah, text, juz, marhala, name, page
             FROM ayahs WHERE surah = ? ORDER BY ayah ASC`,
            [surah]
        );
    }
    return db.all(
        `SELECT surah, ayah, text, juz, marhala, name, page
         FROM ayahs WHERE surah = ? AND ayah != 0 ORDER BY ayah ASC`,
        [surah]
    );
};

// ─── Context ──────────────────────────────────────────────────────────────────

/** Return { prev, current, next } text for prev/current/next ayah. */
const getAyahContext = async (surah, ayah) => {
    const [prev, current, next] = await Promise.all([
        Number(ayah) > 1
            ? db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, Number(ayah) - 1])
            : Promise.resolve(null),
        db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, ayah]),
        db.get("SELECT text FROM ayahs WHERE surah = ? AND ayah = ?", [surah, Number(ayah) + 1]),
    ]);
    return {
        prev:    prev?.text    ?? null,
        current: current?.text ?? null,
        next:    next?.text    ?? null,
    };
};

// ─── Page-level ───────────────────────────────────────────────────────────────

/**
 * Returns { surahs: [{ surah, name, juz, ayahs: [numbers] }] } for a page.
 * Single query + JS grouping — avoids N+1.
 */
const getPageDetails = async (page) => {
    const rows = await db.all(
        `SELECT a.surah, a.name, a.juz, a.ayah
         FROM ayahs a
         WHERE a.page = ?
         ORDER BY a.surah ASC, a.ayah ASC`,
        [page]
    );
    if (rows.length === 0) return null;

    const surahMap = new Map();
    for (const row of rows) {
        if (!surahMap.has(row.surah)) {
            surahMap.set(row.surah, { surah: row.surah, name: row.name, juz: row.juz, ayahs: [] });
        }
        surahMap.get(row.surah).ayahs.push(row.ayah);
    }
    return { surahs: [...surahMap.values()] };
};

/** All full ayah rows on a page (ayah 0 excluded). */
const getAyahsByPage = (page) =>
    db.all(
        `SELECT surah, ayah, text, juz, marhala, name, page
         FROM ayahs
         WHERE page = ? AND ayah != 0
         ORDER BY surah ASC, ayah ASC`,
        [page]
    );

// ─── Juz-level ────────────────────────────────────────────────────────────────

const getPagesByJuz = (juz) =>
    db.all(
        "SELECT DISTINCT page FROM ayahs WHERE juz = ? ORDER BY page ASC",
        [juz]
    );

/** Get unique surahs in a juz with their names. */
const getSurahsByJuz = (juz) =>
    db.all(
        `SELECT DISTINCT surah, name
         FROM ayahs
         WHERE juz = ?
         ORDER BY surah ASC`,
        [juz]
    );

/** Get the last ayah of a juz (highest surah, highest ayah). */
const getLastAyahByJuz = (juz) =>
    db.get(
        `SELECT surah, ayah, text, juz, marhala, name, page
         FROM ayahs
         WHERE juz = ? AND ayah != 0
         ORDER BY surah DESC, ayah DESC
         LIMIT 1`,
        [juz]
    );

/**
 * First ayah of each page within a juz.
 * Subquery selects MIN(rowid) per page — single pass, no N+1.
 */
const getFirstAyahOfEachPageInJuz = (juz) =>
    db.all(
        `SELECT a.page, a.surah, a.ayah, a.text
         FROM ayahs a
         INNER JOIN (
             SELECT page, MIN(rowid) AS min_rowid
             FROM ayahs
             WHERE juz = ? AND ayah != 0
             GROUP BY page
         ) t ON a.rowid = t.min_rowid
         ORDER BY a.page ASC`,
        [juz]
    );

// ─── Range ────────────────────────────────────────────────────────────────────

const getPagesInRange = (start, end) =>
    db.all(
        `SELECT DISTINCT page, juz
         FROM ayahs
         WHERE page >= ? AND page <= ?
         ORDER BY page ASC`,
        [start, end]
    );

/** Get first ayah of a page */
const getFirstAyahOfPage = (page) =>
    db.get(
        `SELECT surah, ayah, text, name
         FROM ayahs
         WHERE page = ? AND ayah != 0
         ORDER BY surah ASC, ayah ASC
         LIMIT 1`,
        [page]
    );

/** Get last ayah of a page */
const getLastAyahOfPage = (page) =>
    db.get(
        `SELECT surah, ayah, text, name
         FROM ayahs
         WHERE page = ? AND ayah != 0
         ORDER BY surah DESC, ayah DESC
         LIMIT 1`,
        [page]
    );

module.exports = {
    getAyah,
    getAllSurahs,
    getAyahsBySurah,
    getFullAyahsBySurah,
    getAyahContext,
    getPageDetails,
    getAyahsByPage,
    getPagesByJuz,
    getSurahsByJuz,
    getLastAyahByJuz,
    getFirstAyahOfEachPageInJuz,
    getPagesInRange,
    getFirstAyahOfPage,
    getLastAyahOfPage,
};