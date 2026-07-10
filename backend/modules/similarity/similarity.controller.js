// modules/similarity/similarity.controller.js
"use strict";

const similarityRepo  = require("../../repositories/similarity.repository");
const ayahRepo        = require("../../repositories/ayah.repository");
const { applyFilters } = require("./filter.service");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const strengthLabel = (score) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
};

/** Sanitise a tips array — non-empty strings, max 500 chars, max 20 entries. */
const sanitiseTips = (raw) =>
    raw
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim().slice(0, 500))
        .slice(0, 20);

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.getSimilarities = async (req, res, next) => {
    try {
        const { surah, ayah, marhala, juz, page } = req.query;

        if (!surah || !ayah)
            return res.status(400).json(formatError("surah and ayah query params are required."));

        const sourceAyah = await ayahRepo.getAyah(surah, ayah);
        if (!sourceAyah)
            return res.status(404).json(formatError("Source ayah not found."));

        const raw    = await similarityRepo.getSimilarities(surah, ayah);
        const parsed = raw.map((s) => ({ ...s, tips: JSON.parse(s.tips || "[]") }));

        const juzList  = juz ? juz.split(",").map((j) => j.trim()) : [];
        const filtered = applyFilters(parsed, marhala, juzList, page);

        const results = filtered.map((r) => ({
            ...r,
            highlight_mode: r.similarity_score >= 0.5 ? "similarities" : "differences",
            strength_label: strengthLabel(r.similarity_score),
        }));

        res.status(200).json(formatSuccess({ source: sourceAyah, results }));
    } catch (err) { next(err); }
};

exports.updateTips = async (req, res, next) => {
    try {
        const { id }   = req.params;
        const { tips } = req.body;

        if (!Array.isArray(tips))
            return res.status(400).json(formatError("tips must be an array of strings."));

        const cleanTips = sanitiseTips(tips);
        await similarityRepo.updateTipsById(id, cleanTips);
        res.status(200).json(formatSuccess({ tips: cleanTips }, "Tips updated."));
    } catch (err) { next(err); }
};

exports.updateTipsByPair = async (req, res, next) => {
    try {
        const ss = req.body.source_surah ?? req.query.ss;
        const sa = req.body.source_ayah  ?? req.query.sa;
        const ts = req.body.target_surah ?? req.query.ts;
        const ta = req.body.target_ayah  ?? req.query.ta;
        const { tips } = req.body;

        if (!ss || !sa || !ts || !ta)
            return res.status(400).json(formatError("source and target ayah coordinates are required.", 400));
        if (!Array.isArray(tips))
            return res.status(400).json(formatError("tips must be an array.", 400));

        const cleanTips = sanitiseTips(tips);
        await similarityRepo.updateTipsByPair(ss, sa, ts, ta, cleanTips);
        res.status(200).json(formatSuccess({ tips: cleanTips }, "Tips updated."));
    } catch (err) { next(err); }
};

exports.getTipsByPair = async (req, res, next) => {
    try {
        const { ss, sa, ts, ta } = req.query;

        if (!ss || !sa || !ts || !ta)
            return res.status(400).json(formatError("source and target ayah coordinates are required."));

        // Use consistent pair key format: minSurah_ayahA_maxSurah_ayahB
        const minSurah = Math.min(parseInt(ss), parseInt(ts));
        const maxSurah = Math.max(parseInt(ss), parseInt(ts));
        const ayahA = minSurah === parseInt(ss) ? parseInt(sa) : parseInt(ta);
        const ayahB = maxSurah === parseInt(ts) ? parseInt(ta) : parseInt(sa);

        const pair = await similarityRepo.getPairByCoordinates(minSurah, ayahA, maxSurah, ayahB);
        
        if (!pair) {
            return res.status(200).json(formatSuccess({ tips: [] }, "No tips found for this pair."));
        }

        const tips = JSON.parse(pair.tips || "[]");
        res.status(200).json(formatSuccess({ tips }, "Tips retrieved."));
    } catch (err) { next(err); }
};