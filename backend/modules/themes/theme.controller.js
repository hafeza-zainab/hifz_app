// modules/themes/theme.controller.js
"use strict";

const themeRepo = require("../../repositories/theme.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

exports.getCurrent = async (req, res, next) => {
    try {
        const active = await themeRepo.getActive(req.user.id);
        res.json(formatSuccess({
            theme_id:   active?.theme_id   ?? null,
            streak:     active?.streak     ?? 0,
            max_streak: active?.max_streak ?? 0,
            has_theme:  !!active,
        }));
    } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
    try {
        const [themes, active] = await Promise.all([
            themeRepo.getAll(req.user.id),
            themeRepo.getActive(req.user.id),
        ]);
        res.json(formatSuccess({ themes, active_id: active?.theme_id ?? null }));
    } catch (err) { next(err); }
};

exports.select = async (req, res, next) => {
    try {
        const { theme_id } = req.body;

        if (!theme_id)
            return res.status(400).json(formatError("theme_id is required."));
        if (!themeRepo.VALID_THEMES.has(theme_id))
            return res.status(400).json(
                formatError(`Invalid theme. Valid themes: ${[...themeRepo.VALID_THEMES].join(", ")}.`)
            );

        await themeRepo.switchTheme(req.user.id, theme_id);
        res.json(formatSuccess(null, "Theme switched."));
    } catch (err) { next(err); }
};

exports.preview = async (req, res, next) => {
    try {
        const active = await themeRepo.getActive(req.user.id);
        res.json(formatSuccess({ alreadySelected: !!active }));
    } catch (err) { next(err); }
};