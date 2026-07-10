// modules/analytics/analytics.controller.js
"use strict";

const diaryRepo   = require("../../repositories/diary.repository");
const heatmapRepo = require("../../repositories/heatmap.repository");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANGE_INTERVALS = {
    "7d": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all": 365 * 10,
};

const DEEP_DIVE_INTERVALS = {
    "7d": "-7 days", "1m": "-1 month", "3m": "-3 months",
    "6m": "-6 months", "1y": "-1 year", "all": "-100 years",
};

const TYPE_MAP = {
    murajah:  "murajah",
    tasmee:   "tasmee",
    ikhtebar: "ikhtebar",
    jadeed:   "jadeed",
    juzz_hali: "Juz_Hali",
    Juz_Hali:  "Juz_Hali",
};

const toDateStr = (date) => date.toISOString().split("T")[0];

const addDays = (dateStr, n) => {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return toDateStr(d);
};

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.getTrend = async (req, res, next) => {
    try {
        const { range, start, end } = req.query;
        const today = toDateStr(new Date());

        let startDate, endDate;
        if (start && end) {
            startDate = start < end ? start : end;
            endDate   = start < end ? end   : start;
        } else {
            const days = RANGE_INTERVALS[range] ?? 7;
            startDate  = toDateStr(new Date(Date.now() - days * 86_400_000));
            endDate    = today;
        }

        const rows = await diaryRepo.getTrendRows(req.user.id, startDate, endDate);

        const dataMap = new Map(rows.map((d) => [
            d.raw_date,
            d.total_entries > 0
                ? Math.round((d.total_score / (d.total_entries * 10)) * 100)
                : 0,
        ]));

        // Fill every date in range so gaps are visible (null = no data)
        const continuousData = [];
        let cursor = startDate;
        while (cursor <= endDate) {
            continuousData.push({ date: cursor, percentage: dataMap.get(cursor) ?? null });
            cursor = addDays(cursor, 1);
        }

        res.status(200).json({ success: true, data: continuousData });
    } catch (err) { next(err); }
};

exports.getDeepDive = async (req, res, next) => {
    try {
        const { type, juz, range } = req.query;

        if (!type)
            return res.status(400).json({ success: false, message: "type query param is required." });

        const dbType = TYPE_MAP[type];
        if (!dbType)
            return res.status(400).json({ success: false, message: `Unknown type: ${type}` });

        const interval = DEEP_DIVE_INTERVALS[range] ?? "-7 days";
        const data     = await diaryRepo.getDeepDiveRows(req.user.id, dbType, interval, juz ?? null);
        res.status(200).json({ success: true, data: data ?? [] });
    } catch (err) { next(err); }
};

exports.getHeatmapData = async (req, res, next) => {
    try {
        const rows = await heatmapRepo.getScoresByUser(req.user.id);
        res.status(200).json({ success: true, data: rows || [] });
    } catch (err) { next(err); }
};

exports.saveHeatmapData = async (req, res, next) => {
    try {
        const { sipara, page_number, quran_page, score } = req.body;
        if (sipara === undefined || page_number === undefined || quran_page === undefined || score === undefined)
            return res.status(400).json({ success: false, message: "sipara, page_number, quran_page, and score are required." });

        await heatmapRepo.upsertScore(req.user.id, sipara, page_number, quran_page, score);
        res.status(201).json({ success: true, message: "Heatmap score saved." });
    } catch (err) { next(err); }
};