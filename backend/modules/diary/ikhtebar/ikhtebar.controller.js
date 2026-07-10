// modules/diary/ikhtebar/ikhtebar.controller.js
const service    = require("./ikhtebar.service");   // ← was wrongly pointing to tasmee.service
const ThemeModel = require("../../themes/theme.model");
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

exports.addIkhtebarLog = async (req, res, next) => {
    try {
        const { entries, date } = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json(formatError("entries must be a non-empty array."));
        }
        const today = new Date().toISOString().split("T")[0];
        const count = await service.createIkhtebarLogs(req.user.id, entries, date || today);
        await ThemeModel.incrementStreak(req.user.id);
        res.status(201).json(formatSuccess({ logged: count }, `Logged ${count} ikhtebar entries.`));
    } catch (err) { next(err); }
};