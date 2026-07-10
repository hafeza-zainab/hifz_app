// modules/diary/log/log.controller.js
"use strict";

const diaryRepo = require("../../../repositories/diary.repository");
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

exports.getLogs = async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const type = req.query.type || null;
        const rows = await diaryRepo.getLogsByDate(req.user.id, date, type);
        res.status(200).json(formatSuccess(rows));
    } catch (err) { next(err); }
};

exports.updateLog = async (req, res, next) => {
    try {
        const { score } = req.body;
        if (score === undefined || score < 0 || score > 10)
            return res.status(400).json(formatError("score must be between 0 and 10."));
        const result = await diaryRepo.updateLog(req.params.id, req.user.id, score);
        if (result.changes === 0)
            return res.status(404).json(formatError("Log not found or not owned by user."));
        res.status(200).json(formatSuccess(null, "Log updated."));
    } catch (err) { next(err); }
};

exports.deleteLog = async (req, res, next) => {
    try {
        const result = await diaryRepo.deleteLog(req.params.id, req.user.id);
        if (result.changes === 0)
            return res.status(404).json(formatError("Log not found or not owned by user."));
        res.status(200).json(formatSuccess(null, "Log deleted."));
    } catch (err) { next(err); }
};