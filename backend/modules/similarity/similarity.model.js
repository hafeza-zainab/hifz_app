// C:\quran-similarity-app\backend\modules\similarity\similarity.model.js

const db = require("../../config/database");

const getSimilarities = async (surah, ayah) => {
    return await db.all(
        `SELECT s.id, s.target_surah, s.target_ayah, s.target_page,
                s.similarity_score, s.tips,
                a.text, a.juz, a.marhala, a.name
         FROM similarities s
         JOIN ayahs a ON s.target_surah = a.surah AND s.target_ayah = a.ayah
         WHERE s.source_surah = ? AND s.source_ayah = ?`,
        [surah, ayah]
    );
};

const updateTips = async (id, tips) => {
    await db.run(
        `UPDATE similarities SET tips = ? WHERE id = ?`,
        [JSON.stringify(tips), id]
    );
    // Also update the reverse pair (same pair stored bidirectionally)
    // Find it first
    const pair = await db.get(`SELECT source_surah, source_ayah, target_surah, target_ayah FROM similarities WHERE id = ?`, [id]);
    if (pair) {
        await db.run(
            `UPDATE similarities SET tips = ?
             WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
            [JSON.stringify(tips), pair.target_surah, pair.target_ayah, pair.source_surah, pair.source_ayah]
        );
    }
};

// New helper to update tips directly by coordinates without needing ID lookup first
const updateTipsByPair = async (ss, sa, ts, ta, tips) => {
    const tipsStr = JSON.stringify(tips);
    // Update forward
    await db.run(
        `UPDATE similarities SET tips = ? 
         WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
        [tipsStr, ss, sa, ts, ta]
    );
    // Update backward
    await db.run(
        `UPDATE similarities SET tips = ? 
         WHERE source_surah = ? AND source_ayah = ? AND target_surah = ? AND target_ayah = ?`,
        [tipsStr, ts, ta, ss, sa]
    );
};

module.exports = { getSimilarities, updateTips, updateTipsByPair };