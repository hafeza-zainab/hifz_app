// modules/ayah/ayah.controller.js
"use strict";

const ayahRepo = require("../../repositories/ayah.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Extract the first 3 Arabic content words, skipping Quranic symbol characters. */
function extractFirstThreeWords(text) {
    if (!text) return "";
    const symbolPrefix = /^[\u06D6-\u06ED\u06DD\u06DE\u2766\u2767\u2764\u274C\u25A0\u25AB\u25B2\u25BC\u25CF\u25CB\s\u200B\u200C\u200D\uFEFF]+/;
    const cleanWords = [];
    for (const word of text.trim().split(/\s+/)) {
        const clean = word.replace(symbolPrefix, "").trim();
        if (clean && /[\u0600-\u06FF]/.test(clean)) {
            cleanWords.push(clean);
            if (cleanWords.length === 3) break;
        }
    }
    return cleanWords.join(" ");
}

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.getSurahs = async (req, res, next) => {
    try {
        const surahs = await ayahRepo.getAllSurahs();
        res.status(200).json(formatSuccess(surahs));
    } catch (err) { next(err); }
};

exports.getAyahsBySurah = async (req, res, next) => {
    try {
        const ayahs = await ayahRepo.getAyahsBySurah(req.params.surah);
        res.status(200).json(formatSuccess(ayahs));
    } catch (err) { next(err); }
};

exports.getSingleAyah = async (req, res, next) => {
    try {
        const { surah, ayah } = req.params;
        if (!surah || !ayah)
            return res.status(400).json(formatError("surah and ayah params are required."));
        const ayahData = await ayahRepo.getAyah(surah, ayah);
        if (!ayahData)
            return res.status(404).json(formatError(`Ayah ${surah}:${ayah} not found.`));
        res.status(200).json(formatSuccess(ayahData));
    } catch (err) { next(err); }
};

exports.getAyahContext = async (req, res, next) => {
    try {
        const { surah, ayah } = req.query;
        if (!surah || !ayah)
            return res.status(400).json(formatError("surah and ayah query params are required."));
        const context = await ayahRepo.getAyahContext(surah, ayah);
        res.status(200).json(formatSuccess(context));
    } catch (err) { next(err); }
};

exports.getPageDetails = async (req, res, next) => {
    try {
        const { page } = req.query;
        if (!page) return res.status(400).json(formatError("page query param is required."));
        const details = await ayahRepo.getPageDetails(page);
        if (!details) return res.status(404).json(formatError("Page not found."));
        res.status(200).json(formatSuccess(details));
    } catch (err) { next(err); }
};

exports.getJuzPages = async (req, res, next) => {
    try {
        const { juz } = req.query;
        if (!juz) return res.status(400).json(formatError("juz query param is required."));
        const pages = await ayahRepo.getPagesByJuz(juz);
        res.status(200).json(formatSuccess(pages.map((p) => p.page)));
    } catch (err) { next(err); }
};

exports.getPagesInRange = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        if (!start || !end)
            return res.status(400).json(formatError("start and end query params are required."));
        const pages = await ayahRepo.getPagesInRange(start, end);
        res.status(200).json(formatSuccess(pages));
    } catch (err) { next(err); }
};

exports.getFirstWords = async (req, res, next) => {
    try {
        const { surah } = req.params;
        const surahNum  = parseInt(surah, 10);
        const ayahs     = await ayahRepo.getFullAyahsBySurah(surah);
        const filtered  = ayahs.filter((a) => surahNum === 1 ? true : a.ayah !== 0);
        const withFirstWords = filtered.map((a) => ({
            ayah:      a.ayah,
            text:      a.text,
            firstWord: extractFirstThreeWords(a.text),
        }));
        res.status(200).json(formatSuccess(withFirstWords));
    } catch (err) { next(err); }
};

// GET /api/ayah/page/:page/full
exports.getPageFull = async (req, res, next) => {
    try {
        const { page } = req.params;
        if (!page) return res.status(400).json(formatError("page param required."));
        const ayahs = await ayahRepo.getAyahsByPage(page);
        if (!ayahs || ayahs.length === 0)
            return res.status(404).json(formatError("No ayahs found for this page."));
        
        console.log(`[PAGE FULL] Page ${page} has ${ayahs.length} ayahs`);
        console.log('[PAGE FULL] Ayahs:', ayahs.map(a => `${a.surah}:${a.ayah}`));
        
        res.status(200).json(formatSuccess({
            page:       Number(page),
            totalAyahs: ayahs.length,
            ayahs:      ayahs.map((a) => ({
                ayah:      `${a.surah}:${a.ayah}`,
                text:      a.text,
                firstWord: extractFirstThreeWords(a.text),
            })),
        }));
    } catch (err) { next(err); }
};

// GET /api/ayah/:surah/full
exports.getSurahFull = async (req, res, next) => {
    try {
        const { surah } = req.params;
        const ayahs = await ayahRepo.getFullAyahsBySurah(surah);
        if (!ayahs || ayahs.length === 0)
            return res.status(404).json(formatError("Surah not found."));
        res.status(200).json(formatSuccess({
            surah:      Number(surah),
            totalAyahs: ayahs.length,
            ayahs:      ayahs.map((a) => ({
                ayah:      a.ayah,
                text:      a.text,
                firstWord: extractFirstThreeWords(a.text),
            })),
        }));
    } catch (err) { next(err); }
};

// GET /api/ayah/juz/:juz/full
exports.getJuzFull = async (req, res, next) => {
    try {
        const { juz } = req.params;
        const pageFirstAyahs = await ayahRepo.getFirstAyahOfEachPageInJuz(juz);
        if (!pageFirstAyahs || pageFirstAyahs.length === 0)
            return res.status(404).json(formatError("Juz not found."));
        res.status(200).json(formatSuccess({
            juz:        Number(juz),
            totalPages: pageFirstAyahs.length,
            ayahs:      pageFirstAyahs.map((a) => ({
                ayah:      `${a.surah}:${a.ayah}`,
                text:      a.text,
                firstWord: extractFirstThreeWords(a.text),
                page:      a.page,
            })),
        }));
    } catch (err) { next(err); }
};

// GET /api/ayah/:surah/ayahs  (alias kept for backward compat)
exports.getAyahsByPage = exports.getSurahFull;