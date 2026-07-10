//C:\quran-similarity-app\backend\modules\diary\jadeed\jadeed.controller.js
const service    = require("./jadeed.service");
const ThemeModel = require("../../themes/theme.model");
const { formatSuccess } = require("../../../utils/responseFormatter");

exports.addJadeedLog = async (req, res, next) => {
    try {
        await service.createJadeedLog(req.user.id, req.body);
        await ThemeModel.incrementStreak(req.user.id);
        res.status(201).json(formatSuccess(null, "Jadeed log added."));
    } catch (err) { next(err); }
};