//C:\quran-similarity-app\backend\repositories\similarity.repository.js
"use strict";

/**
 * similarity.repository.js
 *
 * All SQL for the similarities table.
 * Replaces modules/similarity/similarity.model.js.
 */

const db = require("../config/database");

/**
 * Return all similarity matches for a source ayah, joined with ayah text/meta.
 *
 * Columns returned per row:
 *   id, target_surah, target_ayah, target_page,
 *   similarity_score, tips (raw JSON string),
 *   text, juz, marhala, name
 */
const getSimilarities = (surah, ayah) =>
    db.all(
        `SELECT s.id, s.target_surah, s.target_ayah, s.target_page,
                s.similarity_score, s.tips,
                a.text, a.juz, a.marhala, a.name
         FROM similarities s
         JOIN ayahs a ON s.target_surah = a.surah AND s.target_ayah = a.ayah
         WHERE s.source_surah = ? AND s.source_ayah = ?`,
        [surah, ayah]
    );

/**
 * Update tips by row id and mirror the change to the reverse pair.
 * The similarities table stores pairs bidirectionally (A→B and B→A),
 * so both rows must be kept in sync.
 *
 * @param {number|string} id     similarities.id
 * @param {string[]}      tips   already-sanitised array (caller's responsibility)
 */
const updateTipsById = async (id, tips) => {
    const tipsStr = JSON.stringify(tips);
    await db.run("UPDATE similarities SET tips = ? WHERE id = ?", [tipsStr, id]);

    // Look up the coordinates so we can update the reverse direction.
    const pair = await db.get(
        "SELECT source_surah, source_ayah, target_surah, target_ayah FROM similarities WHERE id = ?",
        [id]
    );
    if (pair) {
        await db.run(
            `UPDATE similarities SET tips = ?
             WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
            [tipsStr, pair.target_surah, pair.target_ayah, pair.source_surah, pair.source_ayah]
        );
    }
};

/**
 * Update tips directly by ayah coordinate pair — no id lookup required.
 * Updates both the forward (ss:sa → ts:ta) and reverse (ts:ta → ss:sa) rows.
 *
 * @param {number|string} ss   source surah
 * @param {number|string} sa   source ayah
 * @param {number|string} ts   target surah
 * @param {number|string} ta   target ayah
 * @param {string[]}      tips already-sanitised array
 */
const updateTipsByPair = async (ss, sa, ts, ta, tips) => {
    const tipsStr = JSON.stringify(tips);
    await db.run(
        `UPDATE similarities SET tips = ?
         WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
        [tipsStr, ss, sa, ts, ta]
    );
    await db.run(
        `UPDATE similarities SET tips = ?
         WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
        [tipsStr, ts, ta, ss, sa]
    );
};

/**
 * Get a similarity pair by coordinates (bidirectional check)
 * Returns the pair if it exists in either direction, including tips
 */
const getPairByCoordinates = async (ss, sa, ts, ta) => {
    const pair = await db.get(
        `SELECT id, tips FROM similarities
         WHERE (source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?)
            OR (source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?)`,
        [ss, sa, ts, ta, ts, ta, ss, sa]
    );
    return pair;
};

/**
 * Create a bidirectional similarity pair
 * Inserts both A→B and B→A rows
 */
const createPair = async (ss, sa, ts, ta) => {
    // Calculate mutashabiha score (placeholder - should use actual similarity calculation)
    const mutashabihaScore = 0.5;
    
    // Get target page from ayahs table
    const targetAyah = await db.get(
        "SELECT page FROM ayahs WHERE surah = ? AND ayah = ?",
        [ts, ta]
    );
    const targetPage = targetAyah ? targetAyah.page : null;

    // Insert A→B
    await db.run(
        `INSERT INTO similarities (source_surah, source_ayah, target_surah, target_ayah, target_page, similarity_score, tips)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ss, sa, ts, ta, targetPage, mutashabihaScore, JSON.stringify([])]
    );

    // Insert B→A
    const sourceAyah = await db.get(
        "SELECT page FROM ayahs WHERE surah = ? AND ayah = ?",
        [ss, sa]
    );
    const sourcePage = sourceAyah ? sourceAyah.page : null;

    await db.run(
        `INSERT INTO similarities (source_surah, source_ayah, target_surah, target_ayah, target_page, similarity_score, tips)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ts, ta, ss, sa, sourcePage, mutashabihaScore, JSON.stringify([])]
    );
};

module.exports = { getSimilarities, updateTipsById, updateTipsByPair, getPairByCoordinates, createPair };