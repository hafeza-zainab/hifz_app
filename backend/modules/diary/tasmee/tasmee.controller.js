//C:\quran-similarity-app\backend\modules\diary\tasmee\tasmee.controller.js
const service    = require("./tasmee.service");
const ThemeModel = require("../../themes/theme.model");
const { formatSuccess, formatError } = require("../../../utils/responseFormatter");

exports.addTasmeeLog = async (req, res, next) => {
    try {
        const { entries, date } = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json(formatError("entries must be a non-empty array."));
        }
        const today = new Date().toISOString().split("T")[0];
        const count = await service.createTasmeeLogs(req.user.id, entries, date || today);
        await ThemeModel.incrementStreak(req.user.id);
        res.status(201).json(formatSuccess({ logged: count }, `Logged ${count} tasmee entries.`));
    } catch (err) { next(err); }
};
