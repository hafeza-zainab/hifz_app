// backend/modules/similarity/wizard.controller.js
"use strict";

const similarityRepo = require("../../repositories/similarity.repository");
const ayahRepo = require("../../repositories/ayah.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

// ─── Wizard Flow Controllers ─────────────────────────────────────────────────────

/**
 * Find Mutashabihat - similarity search only, no LLM
 * POST /api/similarity/wizard/find
 * Body: { surah: number, ayah: number }
 */
exports.findMutashabihat = async (req, res, next) => {
    try {
        const { surah, ayah } = req.body;

        if (!surah || !ayah) {
            return res.status(400).json(formatError("surah and ayah are required."));
        }

        const sourceAyah = await ayahRepo.getAyah(surah, ayah);
        if (!sourceAyah) {
            return res.status(404).json(formatError("Source ayah not found."));
        }

        const raw = await similarityRepo.getSimilarities(surah, ayah);
        const results = raw.map((s) => ({
            id: s.id,
            target_surah: s.target_surah,
            target_ayah: s.target_ayah,
            similarity_score: s.similarity_score,
        }));

        res.status(200).json(formatSuccess({
            source: { surah, ayah, text: sourceAyah.text },
            results,
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * Save Pair - store bidirectional pair relationship
 * POST /api/similarity/wizard/pair/save
 * Body: { source_surah: number, source_ayah: number, target_surah: number, target_ayah: number }
 */
exports.savePair = async (req, res, next) => {
    try {
        const { source_surah, source_ayah, target_surah, target_ayah } = req.body;

        if (!source_surah || !source_ayah || !target_surah || !target_ayah) {
            return res.status(400).json(formatError("All pair coordinates are required."));
        }

        // Check if pair already exists (bidirectional)
        const existing = await similarityRepo.getPairByCoordinates(
            source_surah, source_ayah, target_surah, target_ayah
        );

        if (existing) {
            return res.status(200).json(formatSuccess({
                id: existing.id,
                message: "Pair already exists",
            }));
        }

        // Create bidirectional pair
        await similarityRepo.createPair(source_surah, source_ayah, target_surah, target_ayah);

        res.status(201).json(formatSuccess({
            message: "Pair saved successfully",
        }));
    } catch (err) {
        next(err);
    }
};
